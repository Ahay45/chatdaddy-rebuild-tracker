/**
 * Fetches open PRs + CI status from chatdaddy/frontend-dashboard-v2
 * and writes public/pipeline-data.json for the static pipeline dashboard.
 * Requires GH_PAT env var with repo read access.
 */
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TOKEN = process.env.GH_PAT
const OWNER = 'chatdaddy'
const REPO  = 'frontend-dashboard-v2'

if (!TOKEN) {
  console.warn('[pipeline-data] No GH_PAT — skipping fetch')
  process.exit(0)
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

async function ghFetch(path) {
  const r = await fetch(`https://api.github.com${path}`, { headers })
  if (!r.ok) throw new Error(`GitHub API ${r.status}: ${path}`)
  return r.json()
}

async function getCiStatus(sha) {
  try {
    const data = await ghFetch(`/repos/${OWNER}/${REPO}/commits/${sha}/check-runs?per_page=20`)
    const build = (data.check_runs || []).find(c => c.name && c.name.toLowerCase().includes('build'))
    if (!build) return 'pending'
    const s = build.conclusion || build.status || ''
    if (s === 'success')    return 'pass'
    if (s === 'failure')    return 'fail'
    if (['in_progress','queued','waiting','pending'].includes(s)) return 'running'
    return 'pending'
  } catch { return 'pending' }
}

console.log('[pipeline-data] Fetching open PRs…')
const prs = await ghFetch(`/repos/${OWNER}/${REPO}/pulls?state=open&per_page=100`)
console.log(`[pipeline-data] ${prs.length} PRs found, fetching CI status…`)

const result = await Promise.all(prs.map(async pr => ({
  number: pr.number,
  title:  pr.title,
  branch: pr.head.ref,
  url:    pr.html_url,
  ci:     await getCiStatus(pr.head.sha),
})))

const out = resolve(__dirname, '../public/pipeline-data.json')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify({ prs: result, updatedAt: new Date().toISOString() }, null, 2))
console.log(`[pipeline-data] Written ${result.length} PRs → public/pipeline-data.json`)
