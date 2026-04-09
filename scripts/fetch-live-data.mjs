/**
 * fetch-live-data.mjs
 *
 * Fetches the live module structure from chatdaddy/frontend-dashboard-v2@akil/review
 * via the GitHub REST API and writes src/data/live-data.json.
 *
 * Requires: GITHUB_PAT env var with read access to the repo.
 * Run: node scripts/fetch-live-data.mjs
 */

import { writeFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const OWNER = 'chatdaddy'
const REPO = 'frontend-dashboard-v2'
const BRANCH = 'akil/review'
const TOKEN = process.env.GH_PAT

if (!TOKEN) {
  console.error('❌  GH_PAT env var is required')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

async function githubGet(path) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}${path}`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub API ${res.status} for ${path}: ${text}`)
  }
  return res.json()
}

async function getTreeRecursive(sha) {
  return githubGet(`/git/trees/${sha}?recursive=1`)
}

async function run() {
  console.log(`📡  Fetching module structure from ${OWNER}/${REPO}@${BRANCH}...`)

  // 1. Get latest commit sha on branch (branch names with slashes must not be encoded)
  const branchData = await githubGet(`/branches/${BRANCH}`)
  const commitSha = branchData.commit.sha
  const commitDate = branchData.commit.commit.author.date
  const commitMessage = branchData.commit.commit.message.split('\n')[0]

  console.log(`   Commit: ${commitSha.slice(0, 7)} — ${commitMessage}`)

  // 2. Get full repo tree
  const treeData = await getTreeRecursive(branchData.commit.commit.tree.sha)
  const allPaths = treeData.tree.map((item) => item.path)

  // 3. Find all module folders under src/modules/
  const moduleSet = new Set()
  for (const p of allPaths) {
    const match = p.match(/^src\/modules\/([^/]+)\//)
    if (match) moduleSet.add(match[1])
  }

  const modules = {}

  for (const modId of moduleSet) {
    const prefix = `src/modules/${modId}/`
    const modPaths = allPaths.filter((p) => p.startsWith(prefix))

    // Exclude .gitkeep — empty stub
    const realFiles = modPaths.filter(
      (p) => !p.endsWith('.gitkeep') && !p.includes('/node_modules/')
    )

    const hasStore = modPaths.some((p) => p.endsWith('/store.ts') || p.endsWith('/store.tsx') || p.includes('.store.'))
    const hasQueries = modPaths.some((p) => p.includes('/queries/') || p.endsWith('.queries.ts'))
    const hasIndex = modPaths.some((p) => p === `src/modules/${modId}/index.tsx` || p === `src/modules/${modId}/index.ts`)
    const isEmpty = realFiles.length === 0

    // Detect component files
    const componentFiles = modPaths.filter(
      (p) => p.includes('/components/') && (p.endsWith('.tsx') || p.endsWith('.ts'))
    )

    modules[modId] = {
      id: modId,
      fileCount: realFiles.length,
      componentCount: componentFiles.length,
      hasStore,
      hasQueries,
      hasRoute: hasIndex && !isEmpty,
      isEmpty,
      files: realFiles,
    }
  }

  // 4. Fetch recent commits (last 10) for EOD summary
  const commitsData = await githubGet(`/commits?sha=${BRANCH}&per_page=10`)
  const recentCommits = commitsData.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0],
    date: c.commit.author.date,
    author: c.commit.author.name,
  }))

  // 5. Also check router.tsx for registered routes
  const routerPath = allPaths.find((p) => p === 'src/app/router.tsx')
  let registeredRoutes = []
  if (routerPath) {
    const routerContent = await githubGet(
      `/contents/src/app/router.tsx?ref=${BRANCH}`
    )
    const decoded = Buffer.from(routerContent.content, 'base64').toString('utf-8')
    // Extract path: '/xxx' from createRoute calls
    const routeMatches = decoded.matchAll(/path:\s*['"]([^'"]+)['"]/g)
    registeredRoutes = [...routeMatches].map((m) => m[1])
  }

  // 6. Write output
  const output = {
    fetchedAt: new Date().toISOString(),
    branch: BRANCH,
    commit: {
      sha: commitSha,
      shortSha: commitSha.slice(0, 7),
      message: commitMessage,
      date: commitDate,
    },
    recentCommits,
    registeredRoutes,
    modules,
  }

  const outPath = resolve(__dirname, '../src/data/live-data.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(output, null, 2))

  console.log(`✅  Written to src/data/live-data.json`)
  console.log(`   Modules detected: ${Object.keys(modules).length}`)
  console.log(`   Routes registered: ${registeredRoutes.length}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
