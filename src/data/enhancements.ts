export type EnhancementPriority = 'critical' | 'high' | 'medium' | 'low'
export type EnhancementEffort = 'xs' | 's' | 'm' | 'l' | 'xl'
export type EnhancementPhase = 1 | 2 | 3

export interface Enhancement {
  id: string
  title: string
  description: string
  priority: EnhancementPriority
  effort: EnhancementEffort
  phase: EnhancementPhase
  done: boolean
  tags?: string[]
}

export interface EnhancementModule {
  id: string
  icon: string
  label: string
  category: 'core' | 'engage' | 'tools' | 'commerce' | 'admin' | 'platform'
  enhancements: Enhancement[]
}

export const EFFORT_LABEL: Record<EnhancementEffort, string> = {
  xs: '< 1 day',
  s:  '2–3 days',
  m:  '1 week',
  l:  '2 weeks',
  xl: '1 month+',
}

export const PHASE_CONFIG: Record<EnhancementPhase, { label: string; color: string; description: string }> = {
  1: { label: 'Phase 1', color: '#10B981', description: 'Quick Wins — high impact, low effort' },
  2: { label: 'Phase 2', color: '#F59E0B', description: 'Core Enhancements — key UX improvements' },
  3: { label: 'Phase 3', color: '#8B5CF6', description: 'Advanced — complex, high-value features' },
}

export const PRIORITY_CONFIG: Record<EnhancementPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#EF4444' },
  high:     { label: 'High',     color: '#F59E0B' },
  medium:   { label: 'Medium',   color: '#0F5BFF' },
  low:      { label: 'Low',      color: '#6B7280' },
}

// ─── Roadmap data ─────────────────────────────────────────────────────────────
// Drop enhancement items per module below. Each item needs:
//   id        — unique slug (kebab-case)
//   title     — short feature name
//   description — what it does and why it matters
//   priority  — critical | high | medium | low
//   effort    — xs | s | m | l | xl
//   phase     — 1 (quick win) | 2 (core) | 3 (advanced)
//   done      — false (flip to true when shipped)
//   tags      — optional labels e.g. ['UX', 'performance']

export const ENHANCEMENT_MODULES: EnhancementModule[] = [
  {
    id: 'inbox',
    icon: '💬',
    label: 'Inbox',
    category: 'core',
    enhancements: [],
  },
  {
    id: 'crm',
    icon: '🗂️',
    label: 'CRM',
    category: 'core',
    enhancements: [],
  },
  {
    id: 'channels',
    icon: '📡',
    label: 'Channels',
    category: 'core',
    enhancements: [],
  },
  {
    id: 'dashboard',
    icon: '📊',
    label: 'Dashboard',
    category: 'core',
    enhancements: [],
  },
  {
    id: 'automation',
    icon: '⚡',
    label: 'Automation',
    category: 'engage',
    enhancements: [],
  },
  {
    id: 'broadcasts',
    icon: '📣',
    label: 'Broadcasts',
    category: 'engage',
    enhancements: [],
  },
  {
    id: 'campaigns',
    icon: '🎯',
    label: 'Campaigns',
    category: 'engage',
    enhancements: [],
  },
  {
    id: 'ai',
    icon: '🤖',
    label: 'AI / Chatbot',
    category: 'engage',
    enhancements: [],
  },
  {
    id: 'calls',
    icon: '📞',
    label: 'Calls',
    category: 'core',
    enhancements: [],
  },
  {
    id: 'contacts',
    icon: '👥',
    label: 'Contacts',
    category: 'core',
    enhancements: [],
  },
  {
    id: 'tools',
    icon: '🔧',
    label: 'Tools',
    category: 'tools',
    enhancements: [],
  },
  {
    id: 'shops',
    icon: '🛍️',
    label: 'Shops / Commerce',
    category: 'commerce',
    enhancements: [],
  },
  {
    id: 'settings',
    icon: '⚙️',
    label: 'Settings',
    category: 'admin',
    enhancements: [],
  },
  {
    id: 'billing',
    icon: '💳',
    label: 'Billing',
    category: 'admin',
    enhancements: [],
  },
  {
    id: 'auth',
    icon: '🔐',
    label: 'Auth / Onboarding',
    category: 'admin',
    enhancements: [],
  },
  {
    id: 'notifications',
    icon: '🔔',
    label: 'Notifications',
    category: 'platform',
    enhancements: [],
  },
]

// ─── Derived helpers ──────────────────────────────────────────────────────────

export function getEnhancementStats() {
  const all = ENHANCEMENT_MODULES.flatMap((m) => m.enhancements)
  const total = all.length
  const done = all.filter((e) => e.done).length
  const byPhase = ([1, 2, 3] as EnhancementPhase[]).map((p) => ({
    phase: p,
    total: all.filter((e) => e.phase === p).length,
    done: all.filter((e) => e.phase === p && e.done).length,
  }))
  const byPriority = (['critical', 'high', 'medium', 'low'] as EnhancementPriority[]).map((pr) => ({
    priority: pr,
    total: all.filter((e) => e.priority === pr).length,
    done: all.filter((e) => e.priority === pr && e.done).length,
  }))
  return { total, done, byPhase, byPriority }
}
