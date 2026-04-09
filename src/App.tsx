import { memo, useMemo, useState } from 'react'
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
} from '@mui/material'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  TRACKED_MODULES,
  getOverallStats,
  type TrackedModule,
  type ModuleStatus,
} from './data/modules'

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
] as const

type FilterValue = 'all' | ModuleStatus

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
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          color,
          opacity: 0.75,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
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
    <Box
      sx={{
        p: 3,
        borderRadius: '20px',
        border: `1px solid ${palette.divider}`,
        bgcolor: palette.background.paper,
        mb: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 2.5,
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#0F5BFF',
              mb: 0.5,
            }}
          >
            ChatDaddy V2
          </Typography>
          <Typography
            sx={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'text.primary', lineHeight: 1.1 }}
          >
            Rebuild Progress Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {doneSubFeatures} of {totalSubFeatures} sub-features shipped · {total} modules tracked
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            sx={{
              fontSize: '3rem',
              fontWeight: 900,
              letterSpacing: '-0.05em',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #0F5BFF 0%, #6693FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
          height: 10,
          borderRadius: 99,
          mb: 2.5,
          bgcolor: alpha('#0F5BFF', 0.1),
          '& .MuiLinearProgress-bar': {
            borderRadius: 99,
            background: 'linear-gradient(90deg, #0F5BFF 0%, #6693FF 100%)',
          },
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

const ModuleCard = memo(function ModuleCard({ module: m }: { module: TrackedModule }) {
  const { palette } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const { label: statusLabel, color: statusColor } = STATUS_CONFIG[m.status]
  const doneSubs = m.subFeatures.filter((f) => f.done).length

  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: `1px solid ${palette.divider}`,
        bgcolor: palette.background.paper,
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          borderColor: alpha(statusColor, 0.35),
        },
      }}
    >
      <Box sx={{ height: 3, bgcolor: statusColor, opacity: m.status === 'not-started' ? 0.4 : 1 }} />

      <Box sx={{ p: 2 }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
          <Typography sx={{ fontSize: '1.375rem', lineHeight: 1, flexShrink: 0 }}>{m.icon}</Typography>
          <Typography
            sx={{
              flex: 1,
              fontWeight: 700,
              fontSize: '0.9375rem',
              letterSpacing: '-0.02em',
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {m.label}
          </Typography>
          <Chip
            label={statusLabel}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.6875rem',
              fontWeight: 700,
              bgcolor: alpha(statusColor, 0.1),
              color: statusColor,
              border: `1px solid ${alpha(statusColor, 0.25)}`,
              borderRadius: '6px',
              flexShrink: 0,
            }}
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
            sx={{
              height: 6,
              borderRadius: 99,
              bgcolor: alpha(statusColor, 0.1),
              '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: statusColor },
            }}
          />
        </Box>

        {/* File counts + tags */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.25, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{m.newFileCount}</Box> v2 files
          </Typography>
          <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
            <Box component="span" sx={{ fontWeight: 600 }}>{m.oldFileCount}</Box> old
          </Typography>
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
          <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
            <IconButton size="small" sx={{ p: 0.25 }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Expanded details */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, pt: 1.5, borderTop: `1px solid ${palette.divider}`, bgcolor: alpha(palette.background.default, 0.5) }}>
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

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { palette } = useTheme()
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
            V2 Rebuild Tracker<Box component="span" sx={{ color: '#0F5BFF' }}>.</Box>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 520, lineHeight: 1.6 }}>
            Live view of the ChatDaddy frontend rebuild from V1 → V2. Track every module, sub-feature, and what's still missing.
          </Typography>
        </Box>

        {/* Overall stats */}
        <OverallProgress />

        {/* Filter */}
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, v) => v && setFilter(v)}
            size="small"
            sx={{
              gap: 0.5,
              flexWrap: 'wrap',
              '& .MuiToggleButton-root': {
                border: `1px solid ${palette.divider}`,
                borderRadius: '10px !important',
                px: 1.75,
                py: 0.625,
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'none',
                bgcolor: 'background.paper',
                '&.Mui-selected': {
                  bgcolor: alpha('#0F5BFF', 0.1),
                  color: '#0F5BFF',
                  borderColor: alpha('#0F5BFF', 0.3),
                },
                '&:hover': { bgcolor: alpha('#0F5BFF', 0.05) },
              },
            }}
          >
            {filters.map((f) => (
              <ToggleButton key={f.value} value={f.value}>
                {f.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Module cards by category */}
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
                {mods.map((m) => <ModuleCard key={m.id} module={m} />)}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
