/**
 * CI version of fix-prs — runs on GitHub Actions against a cloned v2 repo.
 * Uses Claude Code CLI (claude --print) to fix TS + lint errors on failing branches.
 */
import { execSync, spawnSync } from 'child_process';

const V2_DIR = '/tmp/v2';
const TOKEN  = process.env.GH_PAT;
const OWNER  = 'chatdaddy';
const REPO   = 'frontend-dashboard-v2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: V2_DIR, encoding: 'utf8', stdio: ['pipe','pipe','pipe'], ...opts });
  } catch (e) { return e.stdout || ''; }
}

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

async function ghFetch(path) {
  const r = await fetch(`https://api.github.com${path}`, { headers });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${path}`);
  return r.json();
}

async function getPrs() {
  const prs = await ghFetch(`/repos/${OWNER}/${REPO}/pulls?state=open&per_page=50`);
  const result = [];
  for (const pr of prs) {
    const checks = await ghFetch(`/repos/${OWNER}/${REPO}/commits/${pr.head.sha}/check-runs?per_page=20`);
    const failing = (checks.check_runs || []).some(c => c.conclusion === 'failure');
    result.push({ number: pr.number, title: pr.title, branch: pr.head.ref, failing });
  }
  return result;
}

async function fixBranch(pr) {
  log(`PR #${pr.number}: ${pr.title} (${pr.branch})`);

  run(`git fetch origin ${pr.branch}`);
  run(`git checkout -B ${pr.branch} origin/${pr.branch}`);

  const tscErrors = run('npx tsc --noEmit 2>&1 || true').trim();
  const lintErrors = run('npx eslint src --ext .ts,.tsx --max-warnings=9999 2>&1 || true').trim();

  if (tscErrors.length < 50 && lintErrors.length < 50) {
    log(`  No errors — skipping`);
    return;
  }

  log(`  Sending to Claude Code...`);

  const prompt =
    `Fix all TypeScript and ESLint errors on branch "${pr.branch}" of chatdaddy/frontend-dashboard-v2.\n\n` +
    `TypeScript errors:\n${tscErrors.slice(0, 3000)}\n\n` +
    `ESLint errors:\n${lintErrors.slice(0, 2000)}\n\n` +
    `Steps:\n` +
    `1. Fix every TypeScript error listed above\n` +
    `2. Run: npx eslint src --ext .ts,.tsx --fix --max-warnings=9999\n` +
    `3. Verify with: npx tsc --noEmit\n` +
    `4. Stage all: git add -A\n` +
    `5. Commit: git commit -m "fix: resolve TS and lint errors on ${pr.branch}"\n` +
    `Do NOT push. Do NOT touch main branch.`;

  const result = spawnSync('claude', ['--print', '--dangerously-skip-permissions', prompt], {
    cwd: V2_DIR, encoding: 'utf8', timeout: 300_000,
    env: { ...process.env, HOME: process.env.HOME },
  });

  if (result.status !== 0) {
    log(`  Claude failed — running eslint --fix fallback`);
    run('npx eslint src --ext .ts,.tsx --fix --max-warnings=9999');
    run('git add -A');
    const diff = run('git diff --cached --name-only').trim();
    if (diff) run(`git commit -m "fix: auto-fix lint on ${pr.branch}"`);
  }

  const ahead = run(`git log origin/${pr.branch}..HEAD --oneline`).trim();
  if (ahead) {
    log(`  Pushing ${ahead.split('\n').length} commit(s)...`);
    run(`git push https://x-access-token:${TOKEN}@github.com/${OWNER}/${REPO}.git ${pr.branch}`);
    log(`  Done — PR #${pr.number} fixed`);
  } else {
    log(`  Nothing to push`);
  }
}

log('fix-prs CI agent starting...');
const prs = await getPrs();
const failing = prs.filter(p => p.failing);
log(`${failing.length} failing PR(s) found`);
for (const pr of failing) await fixBranch(pr);
log('fix-prs CI agent done');
