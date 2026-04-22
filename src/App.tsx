import { memo, useMemo, useRef, useState } from 'react'
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
  useTheme,
  Tab,
  Tabs,
} from '@mui/material'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, GitCommit, RefreshCw, Clock, Zap, MapPin, CheckCircle2, Circle } from 'lucide-react'
import {
  TRACKED_MODULES,
  getOverallStats,
  liveMeta,
  type TrackedModule,
  type ModuleStatus,
  type RecentCommit,
} from './data/modules'
import {
  ENHANCEMENT_MODULES,
  PHASE_CONFIG,
  PRIORITY_CONFIG,
  EFFORT_LABEL,
  getEnhancementStats,
  type Enhancement,
  type EnhancementModule,
  type EnhancementPhase,
} from './data/enhancements'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ModuleStatus, { label: string; color: string }> = {
  done: { label: 'Done', color: '#10B981' },
  'in-progress': { label: 'In Progress', color: '#F59E0B' },
  'not-started': { label: 'Not Started', color: '#EF4444' },
  deferred: { label: 'Deferred', color: '#6B7280' },
}

const CATEGORIES = [
  { id: 'core', label: 'Core', icon: '🏠' },
  { id: 'engage', label: 'Engage', icon: '📣' },
  { id: 'tools', label: 'Tools', icon: '🔧' },
  { id: 'commerce', label: 'Commerce', icon: '🛍️' },
  { id: 'admin', label: 'Admin', icon: '🛡️' },
  { id: 'missing', label: 'Missing / Deferred', icon: '⚠️' },
  { id: 'platform', label: 'Platform / Infra', icon: '🔬' },
] as const

type FilterValue = 'all' | ModuleStatus

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── LiveBanner ───────────────────────────────────────────────────────────────

const LiveBanner = memo(function LiveBanner() {
  const { palette } = useTheme()
  const hasData = !!liveMeta.fetchedAt

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.25,
        borderRadius: '12px',
        bgcolor: hasData ? alpha('#10B981', 0.06) : alpha('#F59E0B', 0.06),
        border: `1px solid ${hasData ? alpha('#10B981', 0.2) : alpha('#F59E0B', 0.2)}`,
        mb: 3,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <RefreshCw size={13} color={hasData ? '#10B981' : '#F59E0B'} />
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: hasData ? '#10B981' : '#F59E0B' }}>
          {hasData ? 'Live data' : 'No live data yet'}
        </Typography>
      </Box>

      {hasData && (
        <>
          <Box sx={{ width: 1, height: 14, bgcolor: palette.divider }} />

          {/* Branch */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>branch:</Typography>
            <Chip
              label={liveMeta.branch}
              size="small"
              sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: alpha('#0F5BFF', 0.1), color: '#0F5BFF', borderRadius: '5px' }}
            />
          </Box>

          {/* Commit */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GitCommit size={12} color="#6B7280" />
            <Typography sx={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: 'text.secondary' }}>
              {liveMeta.commit.shortSha}
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              — {liveMeta.commit.message}
            </Typography>
          </Box>

          {/* Last synced */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
            <Clock size={12} color="#9CA3AF" />
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
              synced {timeAgo(liveMeta.fetchedAt)}
            </Typography>
          </Box>
        </>
      )}

      {!hasData && (
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
          Add <code>GITHUB_PAT</code> secret to the repo settings to enable live sync from{' '}
          <strong>chatdaddy/frontend-dashboard-v2</strong>.
        </Typography>
      )}
    </Box>
  )
})

// ─── Daily Digest ─────────────────────────────────────────────────────────────

type CommitType = 'feature' | 'fix' | 'other'

interface CategorisedCommit extends RecentCommit {
  type: CommitType
  scope: string | null
  summary: string
}

function categorise(commits: RecentCommit[]): CategorisedCommit[] {
  return commits.map((c) => {
    const match = c.message.match(/^(feat|fix|chore|refactor|style|docs|test|ci|build)(?:\(([^)]+)\))?:\s*(.+)/i)
    if (!match) return { ...c, type: 'other' as CommitType, scope: null, summary: c.message.split('\n')[0] }
    const prefix = match[1].toLowerCase()
    const scope = match[2] ?? null
    const summary = match[3]
    const type: CommitType = prefix === 'feat' ? 'feature' : prefix === 'fix' ? 'fix' : 'other'
    return { ...c, type, scope, summary }
  })
}

const TYPE_CONFIG: Record<CommitType, { label: string; color: string; dot: string }> = {
  feature: { label: 'Added',  color: '#10B981', dot: '#10B981' },
  fix:     { label: 'Fixed',  color: '#F59E0B', dot: '#F59E0B' },
  other:   { label: 'Other',  color: '#6B7280', dot: '#9CA3AF' },
}

function getDayMeta(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const now = new Date()
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const diffDays = Math.round((todayUtc.getTime() - date.getTime()) / 86400000)
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
  const dayNum = date.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'UTC' })
  const month = date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })
  const full = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  return { diffDays, weekday, dayNum, month, full, isToday: diffDays === 0 }
}

const CommitRow = memo(function CommitRow({ c }: { c: CategorisedCommit }) {
  const { palette } = useTheme()
  const cfg = TYPE_CONFIG[c.type]
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2, py: 0.875, borderBottom: `1px solid ${alpha(palette.divider, 0.5)}`, '&:last-child': { borderBottom: 'none' } }}>
      <Box sx={{ pt: '6px', flexShrink: 0 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.dot }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.primary', lineHeight: 1.5 }}>
          {c.scope && (
            <Box component="span" sx={{ fontWeight: 700, color: cfg.color, mr: 0.5 }}>
              {c.scope}:
            </Box>
          )}
          {c.summary}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <GitCommit size={11} color="#9CA3AF" />
        <Typography sx={{ fontSize: '0.625rem', fontFamily: 'monospace', color: 'text.secondary' }}>
          {c.sha}
        </Typography>
      </Box>
    </Box>
  )
})

function CommitSections({ commits }: { commits: RecentCommit[] }) {
  const { palette } = useTheme()
  const categorised = categorise(commits)
  const sections = (
    [
      { type: 'feature' as CommitType, items: categorised.filter((c) => c.type === 'feature') },
      { type: 'fix' as CommitType, items: categorised.filter((c) => c.type === 'fix') },
      { type: 'other' as CommitType, items: categorised.filter((c) => c.type === 'other') },
    ] as const
  ).filter((s) => s.items.length > 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {sections.map(({ type, items }) => {
        const cfg = TYPE_CONFIG[type]
        return (
          <Box key={type} sx={{ borderRadius: '12px', border: `1px solid ${alpha(cfg.color, 0.2)}`, bgcolor: palette.background.paper, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 0.75, bgcolor: alpha(cfg.color, 0.05), borderBottom: `1px solid ${alpha(cfg.color, 0.12)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: cfg.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {cfg.label}
              </Typography>
              <Chip label={items.length} size="small" sx={{ height: 15, fontSize: '0.5rem', fontWeight: 700, bgcolor: alpha(cfg.color, 0.12), color: cfg.color, borderRadius: '4px', ml: 'auto' }} />
            </Box>
            {items.map((c) => <CommitRow key={c.sha} c={c} />)}
          </Box>
        )
      })}
    </Box>
  )
}

const EodSummary = memo(function EodSummary() {
  const { palette } = useTheme()
  const days = liveMeta.commitsByDay.length
    ? liveMeta.commitsByDay
    : liveMeta.recentCommits.length
      ? [{ date: liveMeta.recentCommits[0].date.slice(0, 10), commits: liveMeta.recentCommits }]
      : []

  // null = nothing expanded; index into pastDays
  const [expandedPast, setExpandedPast] = useState<number | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  if (!days.length) return null

  const todayDay = days[0]
  const pastDays = days.slice(1)
  const todayMeta = getDayMeta(todayDay.date)
  const todayCats = categorise(todayDay.commits)
  const todayFeat = todayCats.filter((c) => c.type === 'feature').length
  const todayFix = todayCats.filter((c) => c.type === 'fix').length

  function scrollCarousel(dir: -1 | 1) {
    carouselRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' })
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Section title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.75 }}>
        <Zap size={14} color="#F59E0B" />
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: 'text.primary' }}>
          Daily Updates
        </Typography>
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
          — what was added &amp; updated each day
        </Typography>
      </Box>

      {/* ── Today highlight (always shown) ── */}
      <Box
        sx={{
          borderRadius: '16px',
          border: `1.5px solid ${todayMeta.isToday ? alpha('#0F5BFF', 0.35) : alpha(palette.divider, 1)}`,
          bgcolor: palette.background.paper,
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 2.5, py: 1.5,
            bgcolor: todayMeta.isToday ? alpha('#0F5BFF', 0.05) : alpha(palette.background.default, 0.6),
            borderBottom: `1px solid ${palette.divider}`,
            display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
          }}
        >
          {todayMeta.isToday && (
            <Chip label="TODAY" size="small" sx={{ height: 20, fontSize: '0.5625rem', fontWeight: 800, letterSpacing: '0.08em', bgcolor: '#0F5BFF', color: '#fff', borderRadius: '6px' }} />
          )}
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>
            {todayMeta.full}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, ml: 'auto', flexWrap: 'wrap' }}>
            <Chip label={`${todayDay.commits.length} commits`} size="small" sx={{ height: 18, fontSize: '0.5625rem', fontWeight: 700, bgcolor: alpha('#0F5BFF', 0.08), color: '#0F5BFF', borderRadius: '5px' }} />
            {todayFeat > 0 && <Chip label={`+${todayFeat} added`} size="small" sx={{ height: 18, fontSize: '0.5625rem', fontWeight: 700, bgcolor: alpha('#10B981', 0.1), color: '#10B981', borderRadius: '5px' }} />}
            {todayFix > 0 && <Chip label={`${todayFix} fixed`} size="small" sx={{ height: 18, fontSize: '0.5625rem', fontWeight: 700, bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B', borderRadius: '5px' }} />}
          </Box>
        </Box>
        <Box sx={{ p: 1.5 }}>
          <CommitSections commits={todayDay.commits} />
        </Box>
      </Box>

      {/* ── Past days carousel ── */}
      {pastDays.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Previous Days
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={() => scrollCarousel(-1)} sx={{ p: 0.5, color: 'text.secondary', border: `1px solid ${palette.divider}`, borderRadius: '8px', bgcolor: palette.background.paper }}>
                <ChevronLeft size={14} />
              </IconButton>
              <IconButton size="small" onClick={() => scrollCarousel(1)} sx={{ p: 0.5, color: 'text.secondary', border: `1px solid ${palette.divider}`, borderRadius: '8px', bgcolor: palette.background.paper }}>
                <ChevronRight size={14} />
              </IconButton>
            </Box>
          </Box>

          <Box
            ref={carouselRef}
            sx={{
              display: 'flex', gap: 1.25, overflowX: 'auto', pb: 1,
              scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {pastDays.map((day, i) => {
              const meta = getDayMeta(day.date)
              const dc = categorise(day.commits)
              const fc = dc.filter((c) => c.type === 'feature').length
              const fx = dc.filter((c) => c.type === 'fix').length
              const isExpanded = expandedPast === i
              return (
                <Box
                  key={day.date}
                  onClick={() => setExpandedPast(isExpanded ? null : i)}
                  sx={{
                    flexShrink: 0, width: 120, borderRadius: '14px', cursor: 'pointer', userSelect: 'none',
                    border: `1.5px solid ${isExpanded ? '#0F5BFF' : palette.divider}`,
                    bgcolor: isExpanded ? alpha('#0F5BFF', 0.05) : palette.background.paper,
                    p: 1.5, transition: 'all 150ms ease',
                    '&:hover': { borderColor: alpha('#0F5BFF', 0.4), bgcolor: alpha('#0F5BFF', 0.03) },
                  }}
                >
                  <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
                    {meta.weekday}
                  </Typography>
                  <Typography sx={{ fontSize: '1.375rem', fontWeight: 800, color: isExpanded ? '#0F5BFF' : 'text.primary', lineHeight: 1 }}>
                    {meta.dayNum}
                  </Typography>
                  <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', mb: 1 }}>
                    {meta.month}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                    <Typography sx={{ fontSize: '0.5625rem', color: '#6B7280' }}>
                      {day.commits.length} commit{day.commits.length !== 1 ? 's' : ''}
                    </Typography>
                    {fc > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.5625rem', color: '#10B981', fontWeight: 600 }}>+{fc} added</Typography>
                      </Box>
                    )}
                    {fx > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#F59E0B', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.5625rem', color: '#F59E0B', fontWeight: 600 }}>{fx} fixed</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>

          {/* Expanded past day detail — shown below carousel */}
          <Collapse in={expandedPast !== null} unmountOnExit>
            {expandedPast !== null && (
              <Box
                sx={{
                  mt: 1.5, borderRadius: '14px',
                  border: `1px solid ${alpha('#0F5BFF', 0.2)}`,
                  bgcolor: palette.background.paper, overflow: 'hidden',
                }}
              >
                <Box sx={{ px: 2, py: 1.25, bgcolor: alpha('#0F5BFF', 0.04), borderBottom: `1px solid ${palette.divider}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: 'text.primary' }}>
                    {getDayMeta(pastDays[expandedPast].date).full}
                  </Typography>
                  <Chip
                    label={`${pastDays[expandedPast].commits.length} commits`}
                    size="small"
                    sx={{ height: 17, fontSize: '0.5625rem', fontWeight: 700, bgcolor: alpha('#0F5BFF', 0.08), color: '#0F5BFF', borderRadius: '5px', ml: 'auto' }}
                  />
                </Box>
                <Box sx={{ p: 1.5 }}>
                  <CommitSections commits={pastDays[expandedPast].commits} />
                </Box>
              </Box>
            )}
          </Collapse>
        </Box>
      )}
    </Box>
  )
})

// ─── Today's module activity map ─────────────────────────────────────────────

// Maps commit scope/keyword → module id(s)
const SCOPE_TO_MODULE: Record<string, string[]> = {
  inbox:        ['inbox'],
  crm:          ['crm'],
  contacts:     ['crm'],
  channel:      ['channels'],
  channels:     ['channels'],
  calls:        ['calls'],
  call:         ['calls'],
  dashboard:    ['dashboard'],
  analytics:    ['dashboard'],
  automation:   ['automation'],
  flow:         ['automation', 'flow-builder'],
  flows:        ['automation', 'flow-builder'],
  keyword:      ['automation'],
  broadcast:    ['broadcasts'],
  broadcasts:   ['broadcasts'],
  marketing:    ['broadcasts'],
  campaign:     ['campaigns'],
  campaigns:    ['campaigns'],
  tools:        ['tools'],
  forms:        ['tools'],
  form:         ['tools'],
  qr:           ['tools'],
  widget:       ['tools'],
  zapier:       ['tools'],
  coupon:       ['tools'],
  ai:           ['ai'],
  chatbot:      ['ai'],
  'knowledge-base': ['ai'],
  kb:           ['ai'],
  appstore:     ['appstore'],
  app:          ['appstore'],
  shops:        ['shops'],
  shop:         ['shops'],
  orders:       ['shops'],
  products:     ['shops'],
  settings:     ['settings'],
  billing:      ['billing'],
  admin:        ['admin'],
  auth:         ['auth'],
  onboarding:   ['onboarding'],
  notifications: ['notifications'],
  notification: ['notifications'],
  webhook:      ['notifications'],
  i18n:         ['localization'],
  locale:       ['localization'],
}

function buildTodayActivityMap(): Map<string, number> {
  const map = new Map<string, number>()
  const todayCommits = liveMeta.commitsByDay[0]?.commits ?? []
  for (const c of todayCommits) {
    // extract scope from "feat(scope): ..." or fall back to scanning full message
    const scopeMatch = c.message.match(/^[a-z]+\(([^)]+)\):/i)
    const candidates: string[] = []
    if (scopeMatch) {
      candidates.push(scopeMatch[1].toLowerCase())
    } else {
      // scan message words for known module keywords
      const words = c.message.toLowerCase().replace(/[^a-z0-9-]/g, ' ').split(/\s+/)
      candidates.push(...words)
    }
    const hit = new Set<string>()
    for (const cand of candidates) {
      const mods = SCOPE_TO_MODULE[cand]
      if (mods) mods.forEach((m) => { if (!hit.has(m)) { hit.add(m); map.set(m, (map.get(m) ?? 0) + 1) } })
    }
  }
  return map
}

const todayActivityMap = buildTodayActivityMap()

// ─── StatPill ─────────────────────────────────────────────────────────────────

const StatPill = memo(function StatPill({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.25,
        px: 2.5,
        py: 1.5,
        borderRadius: '14px',
        bgcolor: alpha(color, 0.08),
        border: `1px solid ${alpha(color, 0.18)}`,
        minWidth: 80,
      }}
    >
      <Typography sx={{ fontSize: '1.625rem', fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography
        sx={{ fontSize: '0.6875rem', fontWeight: 600, color, opacity: 0.75, letterSpacing: '0.04em', textTransform: 'uppercase' }}
      >
        {label}
      </Typography>
    </Box>
  )
})

// ─── OverallProgress ──────────────────────────────────────────────────────────

const OverallProgress = memo(function OverallProgress() {
  const { palette } = useTheme()
  const { total, done, inProgress, notStarted, deferred, avgProgress, totalSubFeatures, doneSubFeatures } =
    getOverallStats()

  return (
    <Box sx={{ p: 3, borderRadius: '20px', border: `1px solid ${palette.divider}`, bgcolor: palette.background.paper, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F5BFF', mb: 0.5 }}>
            Phase 1
          </Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'text.primary', lineHeight: 1.1 }}>
            Rebuild Progress Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {doneSubFeatures} of {totalSubFeatures} sub-features shipped · {total} modules tracked
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            sx={{
              fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1,
              background: 'linear-gradient(135deg, #0F5BFF 0%, #6693FF 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            {avgProgress}%
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
            avg completion
          </Typography>
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={avgProgress}
        sx={{
          height: 10, borderRadius: 99, mb: 2.5,
          bgcolor: alpha('#0F5BFF', 0.1),
          '& .MuiLinearProgress-bar': { borderRadius: 99, background: 'linear-gradient(90deg, #0F5BFF 0%, #6693FF 100%)' },
        }}
      />

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <StatPill label="Total" value={total} color="#111827" />
        <StatPill label="Done" value={done} color="#10B981" />
        <StatPill label="In Progress" value={inProgress} color="#F59E0B" />
        <StatPill label="Not Started" value={notStarted} color="#EF4444" />
        <StatPill label="Deferred" value={deferred} color="#6B7280" />
      </Box>
    </Box>
  )
})

// ─── ModuleCard ───────────────────────────────────────────────────────────────

const ModuleCard = memo(function ModuleCard({ module: m, todayCount }: { module: TrackedModule; todayCount: number }) {
  const { palette } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const { label: statusLabel, color: statusColor } = STATUS_CONFIG[m.status]
  const doneSubs = m.subFeatures.filter((f) => f.done).length
  const hasActivity = todayCount > 0

  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: `1.5px solid ${hasActivity ? alpha('#F59E0B', 0.5) : palette.divider}`,
        bgcolor: palette.background.paper,
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderColor: hasActivity ? alpha('#F59E0B', 0.7) : alpha(statusColor, 0.35) },
      }}
    >
      <Box sx={{ height: 3, bgcolor: hasActivity ? '#F59E0B' : statusColor, opacity: m.status === 'not-started' && !hasActivity ? 0.4 : 1 }} />

      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
          <Typography sx={{ fontSize: '1.375rem', lineHeight: 1, flexShrink: 0 }}>{m.icon}</Typography>
          <Typography
            sx={{ flex: 1, fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.02em', color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {m.label}
          </Typography>
          {hasActivity && (
            <Tooltip title={`${todayCount} commit${todayCount !== 1 ? 's' : ''} today`} arrow>
              <Chip
                label={`+${todayCount}`}
                size="small"
                sx={{ height: 20, fontSize: '0.625rem', fontWeight: 800, bgcolor: '#F59E0B', color: '#fff', borderRadius: '6px', flexShrink: 0, cursor: 'default' }}
              />
            </Tooltip>
          )}
          <Chip
            label={statusLabel}
            size="small"
            sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 700, bgcolor: alpha(statusColor, 0.1), color: statusColor, border: `1px solid ${alpha(statusColor, 0.25)}`, borderRadius: '6px', flexShrink: 0 }}
          />
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 1.25 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary' }}>
              {doneSubs}/{m.subFeatures.length} sub-features
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: statusColor }}>
              {m.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={m.progress}
            sx={{ height: 6, borderRadius: 99, bgcolor: alpha(statusColor, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: statusColor } }}
          />
        </Box>

        {/* Live file stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.25, alignItems: 'center' }}>
          <Tooltip title="Files detected in v2 repo (live)" arrow>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', cursor: 'default' }}>
              <Box component="span" sx={{ fontWeight: 700, color: m.newFileCount > 0 ? 'text.primary' : 'text.secondary' }}>
                {m.newFileCount}
              </Box>{' '}v2 files
            </Typography>
          </Tooltip>
          <Tooltip title="Files in old V1 repo" arrow>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', cursor: 'default' }}>
              <Box component="span" sx={{ fontWeight: 600 }}>{m.oldFileCount}</Box> old
            </Typography>
          </Tooltip>
          <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
            {m.hasStore && (
              <Chip label="store" size="small" sx={{ height: 18, fontSize: '0.5625rem', fontWeight: 700, bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6', borderRadius: '5px' }} />
            )}
            {m.hasQueries && (
              <Chip label="queries" size="small" sx={{ height: 18, fontSize: '0.5625rem', fontWeight: 700, bgcolor: alpha('#0F5BFF', 0.1), color: '#0F5BFF', borderRadius: '5px' }} />
            )}
            {m.hasRoute && (
              <Chip label="routed" size="small" sx={{ height: 18, fontSize: '0.5625rem', fontWeight: 700, bgcolor: alpha('#10B981', 0.1), color: '#10B981', borderRadius: '5px' }} />
            )}
            {m.isEmpty && (
              <Chip label="empty" size="small" sx={{ height: 18, fontSize: '0.5625rem', fontWeight: 700, bgcolor: alpha('#EF4444', 0.1), color: '#EF4444', borderRadius: '5px' }} />
            )}
          </Box>
        </Box>

        {/* Expand toggle */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          onClick={() => setExpanded((v) => !v)}
        >
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {expanded ? 'Hide details' : 'Show details'}
          </Typography>
          <IconButton size="small" sx={{ p: 0.25 }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, pt: 1.5, borderTop: `1px solid ${palette.divider}`, bgcolor: alpha(palette.background.default, 0.5) }}>
          {m.subFeatures.length > 0 && (
            <>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>
                Sub-features
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
                {m.subFeatures.map((f) => (
                  <Box key={f.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 14, height: 14, borderRadius: '4px', flexShrink: 0,
                        bgcolor: f.done ? '#10B981' : alpha('#6B7280', 0.15),
                        border: `1.5px solid ${f.done ? '#10B981' : alpha('#6B7280', 0.3)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {f.done && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.8125rem', color: f.done ? 'text.primary' : 'text.secondary', fontWeight: f.done ? 500 : 400 }}>
                      {f.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {m.notes && (
            <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: alpha('#F59E0B', 0.06), border: `1px solid ${alpha('#F59E0B', 0.2)}` }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.5 }}>
                <Box component="span" sx={{ fontWeight: 700, color: '#F59E0B' }}>Note: </Box>
                {m.notes}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  )
})

// ─── Enhancement Roadmap ──────────────────────────────────────────────────────

const EnhancementItem = memo(function EnhancementItem({ item }: { item: Enhancement }) {
  const { palette } = useTheme()
  const priorityCfg = PRIORITY_CONFIG[item.priority]
  const phaseCfg = PHASE_CONFIG[item.phase]

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'flex-start', gap: 1.25, px: 1.75, py: 1.25,
        borderBottom: `1px solid ${alpha(palette.divider, 0.5)}`,
        '&:last-child': { borderBottom: 'none' },
        opacity: item.done ? 0.55 : 1,
        transition: 'opacity 150ms',
      }}
    >
      <Box sx={{ pt: '2px', flexShrink: 0, color: item.done ? '#10B981' : alpha('#6B7280', 0.5) }}>
        {item.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: item.done ? 400 : 600, color: 'text.primary', textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.4 }}>
          {item.title}
        </Typography>
        {item.description && (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25, lineHeight: 1.5 }}>
            {item.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 0.625, mt: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label={priorityCfg.label}
            size="small"
            sx={{ height: 17, fontSize: '0.5625rem', fontWeight: 700, bgcolor: alpha(priorityCfg.color, 0.1), color: priorityCfg.color, borderRadius: '4px' }}
          />
          <Chip
            label={phaseCfg.label}
            size="small"
            sx={{ height: 17, fontSize: '0.5625rem', fontWeight: 700, bgcolor: alpha(phaseCfg.color, 0.1), color: phaseCfg.color, borderRadius: '4px' }}
          />
          <Chip
            label={EFFORT_LABEL[item.effort]}
            size="small"
            sx={{ height: 17, fontSize: '0.5625rem', fontWeight: 600, bgcolor: alpha('#6B7280', 0.08), color: '#6B7280', borderRadius: '4px' }}
          />
          {item.tags?.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{ height: 17, fontSize: '0.5625rem', fontWeight: 600, bgcolor: alpha('#0F5BFF', 0.07), color: '#0F5BFF', borderRadius: '4px' }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  )
})

const EnhancementModuleCard = memo(function EnhancementModuleCard({ module: m }: { module: EnhancementModule }) {
  const { palette } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [phaseFilter, setPhaseFilter] = useState<EnhancementPhase | 'all'>('all')

  const totalItems = m.enhancements.length
  const doneItems = m.enhancements.filter((e) => e.done).length
  const progress = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100)

  const phases = ([1, 2, 3] as EnhancementPhase[]).filter((p) => m.enhancements.some((e) => e.phase === p))

  const visible = phaseFilter === 'all'
    ? m.enhancements
    : m.enhancements.filter((e) => e.phase === phaseFilter)

  const sorted = [...visible].sort((a, b) => {
    const pOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    if (a.phase !== b.phase) return a.phase - b.phase
    return pOrder[a.priority] - pOrder[b.priority]
  })

  const hasCritical = m.enhancements.some((e) => e.priority === 'critical' && !e.done)

  if (totalItems === 0) return null

  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: `1.5px solid ${hasCritical ? alpha('#EF4444', 0.35) : palette.divider}`,
        bgcolor: palette.background.paper,
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderColor: alpha('#0F5BFF', 0.3) },
      }}
    >
      <Box sx={{ height: 3, bgcolor: progress === 100 ? '#10B981' : hasCritical ? '#EF4444' : '#0F5BFF', opacity: 0.8 }} />

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
          <Typography sx={{ fontSize: '1.375rem', lineHeight: 1, flexShrink: 0 }}>{m.icon}</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.02em', color: 'text.primary' }}>
            {m.label}
          </Typography>
          {hasCritical && (
            <Chip label="Critical" size="small" sx={{ height: 20, fontSize: '0.5625rem', fontWeight: 800, bgcolor: '#EF4444', color: '#fff', borderRadius: '6px', flexShrink: 0 }} />
          )}
          <Chip
            label={`${doneItems}/${totalItems}`}
            size="small"
            sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 700, bgcolor: alpha(progress === 100 ? '#10B981' : '#0F5BFF', 0.1), color: progress === 100 ? '#10B981' : '#0F5BFF', borderRadius: '6px', flexShrink: 0 }}
          />
        </Box>

        <Box sx={{ mb: 1.25 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 6, borderRadius: 99, bgcolor: alpha('#0F5BFF', 0.1), '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: progress === 100 ? '#10B981' : '#0F5BFF' } }}
          />
        </Box>

        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          onClick={() => setExpanded((v) => !v)}
        >
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {expanded ? 'Hide enhancements' : `Show ${totalItems} enhancements`}
          </Typography>
          <IconButton size="small" sx={{ p: 0.25 }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ borderTop: `1px solid ${palette.divider}`, bgcolor: alpha(palette.background.default, 0.4) }}>
          {phases.length > 1 && (
            <Box sx={{ px: 1.75, pt: 1.25, pb: 0.75, display: 'flex', gap: 0.625, flexWrap: 'wrap' }}>
              {(['all', ...phases] as (EnhancementPhase | 'all')[]).map((p) => (
                <Chip
                  key={p}
                  label={p === 'all' ? 'All phases' : PHASE_CONFIG[p].label}
                  size="small"
                  onClick={() => setPhaseFilter(p)}
                  sx={{
                    height: 22, fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer',
                    borderRadius: '6px',
                    bgcolor: phaseFilter === p ? (p === 'all' ? alpha('#0F5BFF', 0.12) : alpha(PHASE_CONFIG[p].color, 0.12)) : 'transparent',
                    color: phaseFilter === p ? (p === 'all' ? '#0F5BFF' : PHASE_CONFIG[p].color) : 'text.secondary',
                    border: `1px solid ${phaseFilter === p ? (p === 'all' ? alpha('#0F5BFF', 0.3) : alpha(PHASE_CONFIG[p].color, 0.3)) : 'transparent'}`,
                    '&:hover': { bgcolor: alpha('#0F5BFF', 0.06) },
                  }}
                />
              ))}
            </Box>
          )}
          {sorted.map((item) => <EnhancementItem key={item.id} item={item} />)}
        </Box>
      </Collapse>
    </Box>
  )
})

const EnhancementRoadmap = memo(function EnhancementRoadmap() {
  const { palette } = useTheme()
  const stats = getEnhancementStats()
  const modulesWithItems = ENHANCEMENT_MODULES.filter((m) => m.enhancements.length > 0)

  if (modulesWithItems.length === 0) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📋</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', color: 'text.primary', mb: 0.75 }}>
          Roadmap is empty
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', maxWidth: 420, mx: 'auto', lineHeight: 1.6 }}>
          Drop your enhancement items per module into <strong>src/data/enhancements.ts</strong> and they'll appear here, auto-prioritized by phase and severity.
        </Typography>
      </Box>
    )
  }

  const overallPct = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100)

  return (
    <Box>
      {/* Summary card */}
      <Box sx={{ p: 3, borderRadius: '20px', border: `1px solid ${palette.divider}`, bgcolor: palette.background.paper, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B5CF6', mb: 0.5 }}>
              Phase 2
            </Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'text.primary', lineHeight: 1.1 }}>
              Enhancement Roadmap
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {stats.done} of {stats.total} enhancements shipped · {modulesWithItems.length} modules
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              sx={{
                fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #C084FC 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}
            >
              {overallPct}%
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
              shipped
            </Typography>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={overallPct}
          sx={{
            height: 10, borderRadius: 99, mb: 2.5,
            bgcolor: alpha('#8B5CF6', 0.1),
            '& .MuiLinearProgress-bar': { borderRadius: 99, background: 'linear-gradient(90deg, #8B5CF6 0%, #C084FC 100%)' },
          }}
        />

        {/* Phase breakdown */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {stats.byPhase.map(({ phase, total, done }) => {
            if (total === 0) return null
            const cfg = PHASE_CONFIG[phase as EnhancementPhase]
            const pct = Math.round((done / total) * 100)
            return (
              <Box
                key={phase}
                sx={{
                  flex: '1 1 140px', p: 1.5, borderRadius: '12px',
                  bgcolor: alpha(cfg.color, 0.06), border: `1px solid ${alpha(cfg.color, 0.18)}`,
                }}
              >
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: cfg.color, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.25 }}>
                  {cfg.label}
                </Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mb: 0.75 }}>
                  {cfg.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{done}/{total}</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: cfg.color }}>{pct}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{ height: 4, borderRadius: 99, bgcolor: alpha(cfg.color, 0.12), '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: cfg.color } }}
                />
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Module cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1.5 }}>
        {modulesWithItems.map((m) => (
          <EnhancementModuleCard key={m.id} module={m} />
        ))}
      </Box>
    </Box>
  )
})

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { palette } = useTheme()
  const [activeTab, setActiveTab] = useState(0)
  const [filter, setFilter] = useState<FilterValue>('all')

  const filtered = useMemo(
    () => (filter === 'all' ? TRACKED_MODULES : TRACKED_MODULES.filter((m) => m.status === filter)),
    [filter]
  )

  const filters: { value: FilterValue; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'done', label: 'Done' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'not-started', label: 'Not Started' },
    { value: 'deferred', label: 'Deferred' },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 6 }}>
      <Box sx={{ maxWidth: '72rem', mx: 'auto', px: { xs: 2, md: 3 }, py: 4 }}>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F5BFF', mb: 0.5 }}>
            Internal · ChatDaddy
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, color: 'text.primary' }}>
            V2 Dashboard<Box component="span" sx={{ color: '#0F5BFF' }}>.</Box>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 520, lineHeight: 1.6 }}>
            Auto-synced from <strong>chatdaddy/frontend-dashboard-v2@{liveMeta.branch}</strong> every 30 minutes.
          </Typography>
        </Box>

        {/* Tab switcher */}
        <Box sx={{ mb: 3, borderBottom: `1px solid ${palette.divider}` }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              minHeight: 42,
              '& .MuiTabs-indicator': { bgcolor: activeTab === 0 ? '#0F5BFF' : '#8B5CF6', borderRadius: '2px 2px 0 0', height: 2.5 },
              '& .MuiTab-root': {
                minHeight: 42, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none',
                color: 'text.secondary', px: 2.5, py: 0,
                '&.Mui-selected': { color: activeTab === 0 ? '#0F5BFF' : '#8B5CF6' },
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Zap size={14} />
                  Phase 1 — Rebuild
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <MapPin size={14} />
                  Phase 2 — Enhancements
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* ── Tab 0: Rebuild Tracker ── */}
        {activeTab === 0 && (
          <>
            <LiveBanner />
            <EodSummary />
            <OverallProgress />

            {/* Filter */}
            <Box sx={{ mb: 3 }}>
              <ToggleButtonGroup
                value={filter}
                exclusive
                onChange={(_, v) => v && setFilter(v)}
                size="small"
                sx={{
                  gap: 0.5, flexWrap: 'wrap',
                  '& .MuiToggleButton-root': {
                    border: `1px solid ${palette.divider}`,
                    borderRadius: '10px !important',
                    px: 1.75, py: 0.625,
                    fontSize: '0.8125rem', fontWeight: 600,
                    color: 'text.secondary', textTransform: 'none',
                    bgcolor: 'background.paper',
                    '&.Mui-selected': { bgcolor: alpha('#0F5BFF', 0.1), color: '#0F5BFF', borderColor: alpha('#0F5BFF', 0.3) },
                    '&:hover': { bgcolor: alpha('#0F5BFF', 0.05) },
                  },
                }}
              >
                {filters.map((f) => (
                  <ToggleButton key={f.value} value={f.value}>{f.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* Cards by category */}
            {CATEGORIES.map((cat) => {
              const mods = filtered.filter((m) => m.category === cat.id)
              if (!mods.length) return null
              const avg = Math.round(mods.reduce((s, m) => s + m.progress, 0) / mods.length)

              return (
                <Box key={cat.id} sx={{ mb: 3.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.75 }}>
                    <Typography sx={{ fontSize: '1rem' }}>{cat.icon}</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary', letterSpacing: '-0.01em' }}>
                      {cat.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', ml: 'auto' }}>
                      avg {avg}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1.5 }}>
                    {mods.map((m) => <ModuleCard key={m.id} module={m} todayCount={todayActivityMap.get(m.id) ?? 0} />)}
                  </Box>
                </Box>
              )
            })}
          </>
        )}

        {/* ── Tab 1: Enhancement Roadmap ── */}
        {activeTab === 1 && <EnhancementRoadmap />}

      </Box>
    </Box>
  )
}
