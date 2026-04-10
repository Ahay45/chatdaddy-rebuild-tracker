import liveData from './live-data.json'

export type ModuleStatus = 'done' | 'in-progress' | 'not-started' | 'deferred'

export interface SubFeature {
  name: string
  done: boolean
}

export interface TrackedModule {
  id: string
  label: string
  icon: string
  category: 'core' | 'engage' | 'tools' | 'commerce' | 'admin' | 'missing'
  status: ModuleStatus
  /** 0–100 */
  progress: number
  oldFileCount: number
  /** Auto-filled from live GitHub scan */
  newFileCount: number
  hasStore: boolean
  hasQueries: boolean
  hasRoute: boolean
  /** true if module folder exists but is empty (just .gitkeep) */
  isEmpty: boolean
  subFeatures: SubFeature[]
  notes: string
}

export interface RecentCommit {
  sha: string
  message: string
  date: string
  author: string
}

export interface CommitDay {
  date: string // "YYYY-MM-DD"
  commits: RecentCommit[]
}

export interface LiveMeta {
  fetchedAt: string | null
  branch: string
  commit: {
    sha: string
    shortSha: string
    message: string
    date: string
  }
  recentCommits: RecentCommit[]
  commitsByDay: CommitDay[]
  registeredRoutes: string[]
}

// ─── Live data from GitHub scan ───────────────────────────────────────────────

export const liveMeta: LiveMeta = {
  fetchedAt: liveData.fetchedAt,
  branch: liveData.branch,
  commit: liveData.commit,
  recentCommits: (liveData.recentCommits as RecentCommit[]) ?? [],
  commitsByDay: ((liveData as unknown as { commitsByDay?: CommitDay[] }).commitsByDay) ?? [],
  registeredRoutes: liveData.registeredRoutes,
}

// Keyed by module id — filled by the GitHub Actions fetch script
const liveModules = liveData.modules as Record<
  string,
  {
    fileCount: number
    hasStore: boolean
    hasQueries: boolean
    hasRoute: boolean
    isEmpty: boolean
  }
>

// ─── Static config (sub-features, notes, categories — updated manually) ──────

interface StaticConfig {
  label: string
  icon: string
  category: TrackedModule['category']
  status: ModuleStatus
  progress: number
  oldFileCount: number
  subFeatures: SubFeature[]
  notes: string
}

const STATIC: Record<string, StaticConfig> = {
  // ── Core ─────────────────────────────────────────────────────────────────────
  auth: {
    label: 'Auth',
    icon: '🔐',
    category: 'core',
    status: 'done',
    progress: 95,
    oldFileCount: 14,
    subFeatures: [
      { name: 'Login page', done: true },
      { name: 'Protected route guard', done: true },
      { name: 'Auth hydration', done: true },
      { name: 'Signup flow', done: false },
    ],
    notes: 'Login complete. Signup/onboarding not rebuilt yet.',
  },
  inbox: {
    label: 'Inbox',
    icon: '💬',
    category: 'core',
    status: 'done',
    progress: 97,
    oldFileCount: 62,
    subFeatures: [
      { name: 'Chat list (virtualized)', done: true },
      { name: 'Message thread', done: true },
      { name: 'Filter panel (channels, tags, assignee, date)', done: true },
      { name: 'Compose bar', done: true },
      { name: 'Bulk action bar', done: true },
      { name: 'Message context menu', done: true },
      { name: 'Voice player', done: true },
      { name: 'Image lightbox', done: true },
      { name: 'Quoted message / reply', done: true },
      { name: 'Message bubbles redesign', done: true },
      { name: 'Notes tab', done: false },
      { name: 'Search across messages', done: false },
    ],
    notes: 'Filter panel fully wired (channels, tags AND/OR, assignee, date range). Voice player and compose bar added today.',
  },
  crm: {
    label: 'Contacts / CRM',
    icon: '👥',
    category: 'core',
    status: 'done',
    progress: 95,
    oldFileCount: 34,
    subFeatures: [
      { name: 'Contacts list', done: true },
      { name: 'Contact detail panel', done: true },
      { name: 'Filter panel — tags (AND/OR)', done: true },
      { name: 'Filter panel — assignee', done: true },
      { name: 'Filter panel — channels', done: true },
      { name: 'Filter panel — contact type', done: true },
      { name: 'Filter panel — date range', done: true },
      { name: 'Import contacts dialog', done: true },
      { name: 'Delete contacts dialog', done: true },
      { name: 'Board / kanban view', done: true },
      { name: 'Create ticket dialog', done: true },
      { name: 'Ticket card', done: true },
      { name: 'Bulk operations', done: false },
      { name: 'Pipeline stages config', done: false },
    ],
    notes: 'Two-panel filter popover added today — tags, assignee, channels, type, date range all wired.',
  },
  channels: {
    label: 'Channels',
    icon: '🔌',
    category: 'core',
    status: 'done',
    progress: 98,
    oldFileCount: 28,
    subFeatures: [
      { name: 'Channels list', done: true },
      { name: 'Add channel dialog (cinematic redesign)', done: true },
      { name: 'Channel settings dialog', done: true },
      { name: 'Delete channel dialog', done: true },
      { name: 'QR scan onboarding dialog', done: true },
      { name: 'WABA onboarding dialog', done: true },
      { name: 'Instagram onboarding dialog', done: true },
      { name: 'Messenger onboarding dialog', done: true },
      { name: 'Messenger page select dialog', done: true },
      { name: 'SMS onboarding dialog', done: true },
      { name: 'Email onboarding dialog', done: true },
    ],
    notes: 'All 7 onboarding dialogs added today. Add Channel modal redesigned with cinematic tiles matching dashboard cards.',
  },
  calls: {
    label: 'Calls',
    icon: '📞',
    category: 'core',
    status: 'done',
    progress: 85,
    oldFileCount: 18,
    subFeatures: [
      { name: 'Call list (DataGrid)', done: true },
      { name: 'Call stats', done: true },
      { name: 'Calls filter', done: true },
      { name: 'Call detail drawer', done: true },
      { name: 'Twilio SDK integration', done: false },
      { name: 'Live call UI', done: false },
    ],
    notes: 'Call history and stats done. Live calling (Twilio) not integrated yet.',
  },
  dashboard: {
    label: 'Dashboard',
    icon: '📊',
    category: 'core',
    status: 'done',
    progress: 80,
    oldFileCount: 22,
    subFeatures: [
      { name: 'Stats cards', done: true },
      { name: 'Onboarding checklist', done: true },
      { name: 'Channel recommendation cards', done: true },
      { name: 'Analytics charts', done: false },
      { name: 'Date range filter', done: false },
    ],
    notes: 'Getting-started version built. Full analytics charts not yet ported.',
  },
  // ── Engage ────────────────────────────────────────────────────────────────────
  automation: {
    label: 'Automation',
    icon: '⚙️',
    category: 'engage',
    status: 'in-progress',
    progress: 80,
    oldFileCount: 31,
    subFeatures: [
      { name: 'Message flows panel (bulk checkboxes + columns)', done: true },
      { name: 'Message flows filter popover', done: true },
      { name: 'Keyword reply panel', done: true },
      { name: 'Offline bot panel', done: true },
      { name: 'Trigger history panel', done: true },
      { name: 'Trigger history filter popover', done: true },
      { name: 'Template market panel', done: true },
      { name: 'Template market filter popover', done: true },
      { name: 'Create flow dialog', done: true },
      { name: 'Flow detail drawer', done: true },
      { name: 'Visual flow builder canvas', done: false },
      { name: 'Node editor', done: false },
      { name: 'Flow analytics', done: false },
    ],
    notes: 'Filter popovers added today for message flows, trigger history, and template market. Bulk checkboxes and column headers restored.',
  },
  broadcasts: {
    label: 'Marketing / Broadcasts',
    icon: '📢',
    category: 'engage',
    status: 'done',
    progress: 92,
    oldFileCount: 19,
    subFeatures: [
      { name: 'Broadcasts panel (cinematic redesign)', done: true },
      { name: 'Create broadcast dialog', done: true },
      { name: 'Create broadcast full page', done: true },
      { name: 'Broadcast progress dialog', done: true },
      { name: 'Campaigns tab (moved from standalone)', done: true },
      { name: 'Broadcast analytics', done: false },
    ],
    notes: 'Broadcasts page redesigned with cinematic SaaS aesthetic. Campaigns consolidated into Marketing tab today.',
  },
  campaigns: {
    label: 'Campaigns',
    icon: '🎯',
    category: 'engage',
    status: 'done',
    progress: 90,
    oldFileCount: 0,
    subFeatures: [
      { name: 'Campaign list (card rows + pill status badges)', done: true },
      { name: 'Campaign row component', done: true },
      { name: 'Campaign progress bar', done: true },
      { name: 'Campaign detail drawer', done: true },
      { name: 'Create campaign full page', done: true },
      { name: 'Delete campaign dialog', done: true },
      { name: 'Campaign store', done: true },
      { name: 'Campaign queries', done: true },
      { name: 'Campaign analytics', done: false },
    ],
    notes: 'Full campaigns module built today — list, create page, detail drawer, delete dialog, store, queries. Moved into Marketing tab.',
  },
  // ── Tools ─────────────────────────────────────────────────────────────────────
  tools: {
    label: 'Tools',
    icon: '🔧',
    category: 'tools',
    status: 'done',
    progress: 85,
    oldFileCount: 22,
    subFeatures: [
      { name: 'Forms panel', done: true },
      { name: 'Form detail dialog', done: true },
      { name: 'Create form dialog', done: true },
      { name: 'Submissions dialog', done: true },
      { name: 'QR code generator', done: true },
      { name: 'Widget builder', done: true },
      { name: 'Zapier panel', done: true },
      { name: 'Custom fields', done: false },
    ],
    notes: 'Forms + QR + Widget + Zapier consolidated from 4 old modules.',
  },
  ai: {
    label: 'AI / Chatbot',
    icon: '🤖',
    category: 'tools',
    status: 'done',
    progress: 80,
    oldFileCount: 17,
    subFeatures: [
      { name: 'AI chatbot panel', done: true },
      { name: 'Knowledge base panel', done: true },
      { name: 'KB detail panel', done: true },
      { name: 'Create chatbot dialog', done: true },
      { name: 'Create KB dialog', done: true },
      { name: 'AI profile / CRM integration', done: false },
      { name: 'NLP / intent detection', done: false },
    ],
    notes: 'Core chatbot + knowledge base done. NLP and AI CRM profile pending.',
  },
  appstore: {
    label: 'App Store',
    icon: '🏪',
    category: 'tools',
    status: 'done',
    progress: 75,
    oldFileCount: 8,
    subFeatures: [
      { name: 'App store list', done: true },
      { name: 'Add service dialog', done: true },
      { name: 'Integration detail / config', done: false },
      { name: 'Payment integrations', done: false },
    ],
    notes: 'Marketplace listing done. Deep integration config pages not built.',
  },
  // ── Commerce ──────────────────────────────────────────────────────────────────
  shops: {
    label: 'Shops / Commerce',
    icon: '🛍️',
    category: 'commerce',
    status: 'done',
    progress: 85,
    oldFileCount: 38,
    subFeatures: [
      { name: 'Orders panel', done: true },
      { name: 'Order detail drawer', done: true },
      { name: 'Products panel', done: true },
      { name: 'Create/edit product dialog', done: true },
      { name: 'Payments panel', done: true },
      { name: 'Shipping panel', done: true },
      { name: 'Subscriptions / billing cycles', done: false },
      { name: 'Shop onboarding flow', done: false },
    ],
    notes: 'Orders + Products + Payments + Shipping consolidated. Subscriptions pending.',
  },
  // ── Admin ─────────────────────────────────────────────────────────────────────
  settings: {
    label: 'Settings',
    icon: '⚙️',
    category: 'admin',
    status: 'done',
    progress: 95,
    oldFileCount: 14,
    subFeatures: [
      { name: 'Profile settings', done: true },
      { name: 'Team settings', done: true },
      { name: 'Members settings', done: true },
      { name: 'Notifications settings', done: true },
      { name: 'Billing settings tab', done: true },
      { name: 'Developer / API settings', done: true },
    ],
    notes: 'All 6 tabs complete. Billing moved here from standalone module.',
  },
  admin: {
    label: 'Admin Panel',
    icon: '🛡️',
    category: 'admin',
    status: 'done',
    progress: 95,
    oldFileCount: 31,
    subFeatures: [
      { name: 'Teams panel', done: true },
      { name: 'Users panel', done: true },
      { name: 'Products panel', done: true },
      { name: 'Template approval panel', done: true },
      { name: 'Announcements panel', done: true },
      { name: 'Coupons panel', done: true },
      { name: 'Channels panel', done: true },
      { name: 'Preferences panel', done: true },
      { name: 'Team data panel', done: true },
      { name: 'Credits panel', done: true },
    ],
    notes: 'All 10 admin panels present and wired.',
  },
  // ── Missing / Deferred ────────────────────────────────────────────────────────
  'flow-builder': {
    label: 'Visual Flow Builder',
    icon: '🗺️',
    category: 'missing',
    status: 'deferred',
    progress: 0,
    oldFileCount: 198,
    subFeatures: [
      { name: 'Canvas / ReactFlow integration', done: false },
      { name: 'Node types (message, condition, delay…)', done: false },
      { name: 'Node editor sidebar', done: false },
      { name: 'Flow validation', done: false },
      { name: 'Flow analytics', done: false },
      { name: 'Template import/export', done: false },
    ],
    notes: 'Intentionally deferred (P3). Largest old module (198 files). Empty stub only.',
  },
  notifications: {
    label: 'Notifications Center',
    icon: '🔔',
    category: 'missing',
    status: 'not-started',
    progress: 15,
    oldFileCount: 27,
    subFeatures: [
      { name: 'Notification settings (in Settings)', done: true },
      { name: 'Notification center / inbox', done: false },
      { name: 'OAuth callback handler', done: false },
      { name: 'Real-time notification badge', done: false },
    ],
    notes: 'Only notification settings built. Full notification center not started.',
  },
  onboarding: {
    label: 'Onboarding Flows',
    icon: '🚀',
    category: 'missing',
    status: 'not-started',
    progress: 20,
    oldFileCount: 32,
    subFeatures: [
      { name: 'Channel onboarding dialogs (in Channels)', done: true },
      { name: 'Signup / registration flow', done: false },
      { name: 'Team setup wizard', done: false },
      { name: 'Getting started checklist (in Dashboard)', done: true },
      { name: 'Coexist / migration flow', done: false },
    ],
    notes: 'AuthOnboarding + Onboarding + Onboardingv2 from old repo not rebuilt.',
  },
  billing: {
    label: 'Billing / Subscriptions',
    icon: '💳',
    category: 'missing',
    status: 'in-progress',
    progress: 30,
    oldFileCount: 23,
    subFeatures: [
      { name: 'Billing settings tab (in Settings)', done: true },
      { name: 'Subscription management', done: false },
      { name: 'Invoice history', done: false },
      { name: 'Payment methods', done: false },
      { name: 'Plan upgrade / downgrade', done: false },
      { name: 'Stripe integration', done: false },
    ],
    notes: 'Standalone /billing route redirects to Settings. Full billing module not built.',
  },
}

// ─── Merge static config + live data ─────────────────────────────────────────

export const TRACKED_MODULES: TrackedModule[] = Object.entries(STATIC).map(([id, cfg]) => {
  const live = liveModules[id]
  return {
    id,
    ...cfg,
    newFileCount: live?.fileCount ?? 0,
    hasStore: live?.hasStore ?? false,
    hasQueries: live?.hasQueries ?? false,
    hasRoute: live?.hasRoute ?? false,
    isEmpty: live?.isEmpty ?? true,
  }
})

// Also surface any NEW modules detected in live data that aren't in STATIC yet
const unknownModules = Object.keys(liveModules).filter((id) => !STATIC[id])
for (const id of unknownModules) {
  const live = liveModules[id]
  if (!live.isEmpty) {
    TRACKED_MODULES.push({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
      icon: '🆕',
      category: 'core',
      status: 'in-progress',
      progress: 0,
      oldFileCount: 0,
      newFileCount: live.fileCount,
      hasStore: live.hasStore,
      hasQueries: live.hasQueries,
      hasRoute: live.hasRoute,
      isEmpty: live.isEmpty,
      subFeatures: [],
      notes: 'New module detected from live scan — add to static config to track sub-features.',
    })
  }
}

// ─── Derived stats ────────────────────────────────────────────────────────────

export function getOverallStats() {
  const total = TRACKED_MODULES.length
  const done = TRACKED_MODULES.filter((m) => m.status === 'done').length
  const inProgress = TRACKED_MODULES.filter((m) => m.status === 'in-progress').length
  const notStarted = TRACKED_MODULES.filter((m) => m.status === 'not-started').length
  const deferred = TRACKED_MODULES.filter((m) => m.status === 'deferred').length
  const avgProgress = Math.round(TRACKED_MODULES.reduce((s, m) => s + m.progress, 0) / total)
  const totalSubFeatures = TRACKED_MODULES.flatMap((m) => m.subFeatures).length
  const doneSubFeatures = TRACKED_MODULES.flatMap((m) => m.subFeatures).filter((f) => f.done).length
  return { total, done, inProgress, notStarted, deferred, avgProgress, totalSubFeatures, doneSubFeatures }
}
