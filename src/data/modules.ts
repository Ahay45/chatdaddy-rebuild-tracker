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
  category: 'core' | 'engage' | 'tools' | 'commerce' | 'admin' | 'missing' | 'platform'
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
    componentCount: number
    hasStore: boolean
    hasQueries: boolean
    hasRoute: boolean
    isEmpty: boolean
    files: string[]
  }
>

// ─── Auto-derive sub-feature done state from live file scan ──────────────────

function contentWords(s: string): string[] {
  return (s.toLowerCase().replace(/\(.*?\)/g, '').match(/[a-z]{3,}/g) ?? [])
}

function normaliseBasename(filePath: string): string {
  return (filePath.split('/').pop() ?? '')
    .replace(/\.(tsx?|jsx?)$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function fileMatchesSubFeature(featureName: string, fileBasename: string): boolean {
  const fw = contentWords(featureName)
  const fb = fileBasename // already normalised
  if (!fw.length) return false
  const hits = fw.filter((w) => fb.includes(w)).length
  return hits >= Math.min(2, fw.length)
}

function autoCheckSubFeatures(
  subFeatures: SubFeature[],
  live: { files: string[]; hasStore: boolean; hasQueries: boolean; hasRoute: boolean },
): SubFeature[] {
  const componentBasenames = live.files
    .filter((p) => (p.endsWith('.tsx') || p.endsWith('.ts')) && p.includes('/components/'))
    .map(normaliseBasename)

  return subFeatures.map((f) => {
    if (f.done) return f // already confirmed done manually — keep
    const norm = contentWords(f.name).join('')
    // Special structural signals
    if (norm.includes('store') && live.hasStore) return { ...f, done: true }
    if ((norm.includes('quer') || norm.includes('api')) && live.hasQueries) return { ...f, done: true }
    if ((norm.includes('route') || norm.includes('page')) && live.hasRoute) return { ...f, done: true }
    // Component file match
    const matched = componentBasenames.some((bn) => fileMatchesSubFeature(f.name, bn))
    return matched ? { ...f, done: true } : f
  })
}

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
    progress: 100,
    oldFileCount: 14,
    subFeatures: [
      { name: 'Login page (email + password)', done: true },
      { name: 'Protected route guard', done: true },
      { name: 'Auth hydration on load', done: true },
      { name: 'OTP confirmation (SMS)', done: true },
      { name: 'Email OTP confirmation', done: true },
      { name: 'Password reset flow', done: true },
      { name: 'Signup / registration flow', done: true },
      { name: 'Scope-based permissions (feature locking)', done: true },
      { name: 'Role-based access (admin vs user)', done: true },
    ],
    notes: 'All auth features complete: login, signup wizard, OTP (SMS + email), password reset, scope gates, role gates.',
  },

  inbox: {
    label: 'Inbox',
    icon: '💬',
    category: 'core',
    status: 'in-progress',
    progress: 91,
    oldFileCount: 62,
    subFeatures: [
      // Chat list
      { name: 'Chat list (virtualized scroll)', done: true },
      { name: 'Unread count badges', done: true },
      { name: 'Assignee display on chat row', done: true },
      { name: 'Tag chips on chat row', done: true },
      { name: 'Account / channel selector in header', done: true },
      { name: 'Search messages and contacts', done: true },
      { name: 'Pinned filter presets', done: true },

      // Filters
      { name: 'Filter panel — channels', done: true },
      { name: 'Filter panel — tags (AND/OR)', done: true },
      { name: 'Filter panel — assignee', done: true },
      { name: 'Filter panel — date range', done: true },
      { name: 'Filter panel — ticket/CRM stage', done: false },
      { name: 'Filter panel — custom fields', done: false },
      { name: 'Active filter display chips', done: true },

      // Message thread
      { name: 'Message thread (chronological)', done: true },
      { name: 'Date dividers in thread', done: true },
      { name: 'Auto-scroll to latest message', done: true },
      { name: 'Scroll-to-bottom button', done: true },
      { name: 'Load more messages (pagination)', done: true },
      { name: 'Quoted / reply message preview', done: true },
      { name: 'Message status indicators (sent/delivered/read)', done: true },

      // Message types
      { name: 'Text message bubble', done: true },
      { name: 'Image message', done: true },
      { name: 'Video message', done: true },
      { name: 'Audio / voice note player', done: true },
      { name: 'Document / file message', done: true },
      { name: 'Link preview', done: true },
      { name: 'Location message', done: true },
      { name: 'Contact card (vCard)', done: true },
      { name: 'Interactive buttons message', done: true },
      { name: 'Poll message with options', done: true },
      { name: 'Product / catalog message', done: true },
      { name: 'Order message with details', done: true },
      { name: 'Message reactions display', done: true },
      { name: 'Sticker message', done: true },
      { name: 'Voice-to-text transcription', done: true },
      { name: 'Unsupported message type fallback', done: true },

      // Compose
      { name: 'Compose bar (text input)', done: true },
      { name: 'File / attachment upload', done: true },
      { name: 'Message scheduling (date/time picker)', done: true },
      { name: 'Scheduled messages toggle/visibility', done: false },
      { name: 'Button builder in compose (up to 3)', done: true },
      { name: 'Template message selection', done: true },
      { name: 'Signature editor and management', done: true },
      { name: 'Variable / dynamic text insertion', done: true },
      { name: 'Audio recording in compose', done: true },
      { name: 'WhatsApp Pay / payment request', done: false },
      { name: 'WhatsApp Shop / catalog send', done: false },

      // Message actions
      { name: 'Message context menu', done: true },
      { name: 'Forward message to other contacts', done: true },
      { name: 'Delete message (with confirmation)', done: true },
      { name: 'React to message', done: true },

      // Bulk operations
      { name: 'Bulk action bar (select all)', done: true },
      { name: 'Bulk assign', done: true },
      { name: 'Bulk tag', done: true },
      { name: 'Bulk export', done: true },

      // Right panel — Contact profile
      { name: 'Contact profile side panel', done: true },
      { name: 'Custom fields display and edit', done: true },
      { name: 'Contact active-hours chart', done: true },
      { name: 'Contact notes (CRUD)', done: true },
      { name: 'Contact tags management', done: true },
      { name: 'Linked tickets / CRM board', done: true },
      { name: 'Linked orders in profile', done: true },
      { name: 'Group participants list', done: true },
      { name: 'Drag-and-drop reorderable profile sections', done: false },

      // Inbox settings / config
      { name: 'Inbox settings modal (auto-assign, working hours)', done: true },
      { name: 'Notes tab (internal team notes)', done: true },
      { name: 'Image lightbox / media viewer', done: true },
      { name: 'Message bubbles redesign (SaaS aesthetic)', done: true },
    ],
    notes: 'Inbox is nearly complete. Added: file/attachment upload, scheduling, template picker, audio recording. Remaining: scheduled messages view, WhatsApp Pay, catalog send, drag-and-drop profile sections.',
  },

  crm: {
    label: 'Contacts / CRM',
    icon: '👥',
    category: 'core',
    status: 'in-progress',
    progress: 90,
    oldFileCount: 34,
    subFeatures: [
      // Contacts list
      { name: 'Contacts list view', done: true },
      { name: 'Contact detail panel', done: true },
      { name: 'Create contact dialog', done: true },
      { name: 'Import contacts dialog', done: true },
      { name: 'Delete contacts dialog', done: true },
      { name: 'Bulk contact operations', done: true },
      { name: 'Export contacts', done: true },
      { name: 'Contact search', done: true },

      // Filters
      { name: 'Filter panel — tags (AND/OR)', done: true },
      { name: 'Filter panel — assignee', done: true },
      { name: 'Filter panel — channels', done: true },
      { name: 'Filter panel — contact type', done: true },
      { name: 'Filter panel — date range', done: true },
      { name: 'Filter panel — custom fields', done: false },
      { name: 'Active filters display', done: true },

      // Board / kanban
      { name: 'Board / kanban view', done: true },
      { name: 'Create ticket dialog', done: true },
      { name: 'Ticket card (kanban)', done: true },
      { name: 'Create / edit / delete boards', done: true },
      { name: 'Board dropdown selector', done: true },
      { name: 'Pipeline stages CRUD (add/edit/delete)', done: true },
      { name: 'Stage drag-and-drop reordering', done: true },
      { name: 'Stage color customization', done: true },
      { name: 'Ticket drag-and-drop between stages', done: true },
      { name: 'Ticket reordering within stage', done: false },
      { name: 'Ticket list / table view', done: true },

      // Ticket detail
      { name: 'Ticket detail panel / drawer', done: true },
      { name: 'Ticket title editing', done: true },
      { name: 'Activity timeline on ticket', done: true },
      { name: 'Notes on ticket', done: true },
      { name: 'Custom fields on ticket', done: true },
      { name: 'Linked messages / conversations', done: false },
      { name: 'Linked call logs', done: false },
      { name: 'AI analysis option on ticket', done: true },
      { name: 'Credit transaction history on ticket', done: true },

      // Property management
      { name: 'Card property visibility management', done: true },
      { name: 'Table property visibility settings', done: false },

      // Sorting
      { name: 'Sort options', done: false },
      { name: 'Assignee selector on ticket', done: true },
    ],
    notes: 'Contacts list, filters, active chips, bulk ops, export all done. Board/stage CRUD, drag-and-drop, ticket detail (5 tabs: notes, activity, AI, credits, assignee) all done.',
  },

  channels: {
    label: 'Channels',
    icon: '🔌',
    category: 'core',
    status: 'in-progress',
    progress: 95,
    oldFileCount: 28,
    subFeatures: [
      { name: 'Channels list view', done: true },
      { name: 'Add channel dialog (cinematic redesign)', done: true },
      { name: 'Channel settings dialog', done: true },
      { name: 'Delete channel dialog', done: true },
      { name: 'Delete WhatsApp channel specific flow', done: false },
      { name: 'QR scan onboarding (WhatsApp web)', done: true },
      { name: 'WABA onboarding dialog', done: true },
      { name: 'Instagram onboarding dialog', done: true },
      { name: 'Messenger onboarding dialog', done: true },
      { name: 'Messenger page select dialog', done: true },
      { name: 'SMS onboarding dialog', done: true },
      { name: 'Email onboarding dialog (sender config)', done: true },
      { name: 'Channel connection status display', done: true },
      { name: 'Broken connection detection + alert popup', done: true },
      { name: 'Rescan / reconnect flow', done: true },
      { name: 'Reload channel modal', done: true },
      { name: 'Pending messages confirmation modal', done: true },
      { name: 'Verify phone number dialog', done: true },
      { name: 'Channel profile update', done: true },
      { name: 'ISV terms submission', done: true },
      { name: 'Sender ID submission', done: true },
      { name: 'Channel limitations info modal', done: true },
      { name: 'Credit requirements display per channel', done: true },
    ],
    notes: 'Full rebuild complete. Card grid with brand gradients, animated status dots, auto-polling, ConnectionAlertBanner, ReconnectModal (auto/QR/Facebook), ChannelStatusModal (Status/Limitations/Credits tabs), VerifyPhoneDialog, ChannelProfileDialog, IsvTermsDialog, SenderIdDialog, PendingMessagesModal all built.',
  },

  calls: {
    label: 'Calls',
    icon: '📞',
    category: 'core',
    status: 'in-progress',
    progress: 92,
    oldFileCount: 18,
    subFeatures: [
      { name: 'Call list view (DataGrid)', done: true },
      { name: 'Call stats cards', done: true },
      { name: 'Calls filter panel', done: true },
      { name: 'Call detail drawer', done: true },
      { name: 'Caller / recipient information display', done: true },
      { name: 'Call duration and status display', done: true },
      { name: 'Call popup modal (incoming/outgoing)', done: true },
      { name: 'Call using modal (select channel)', done: true },
      { name: 'Verify number dialog', done: true },
      { name: 'Manage channels for calls', done: true },
      { name: 'Mobile filter layout for calls', done: false },
      { name: 'Twilio SDK integration', done: true },
      { name: 'Live call UI (in-call controls)', done: true },
    ],
    notes: 'Full rebuild complete. CallPopup (dark floating overlay, mute/hold/hangup/timer/notes), CallUsingModal (channel selector + record toggle), VerifyNumberDialog (2-stage verification), ManageChannelsDialog (add/edit/delete channels), Zustand calls.store with Twilio Device lifecycle, quick-dial toolbar in list page.',
  },

  dashboard: {
    label: 'Dashboard',
    icon: '🏠',
    category: 'core',
    status: 'in-progress',
    progress: 0,
    oldFileCount: 12,
    subFeatures: [
      // Header / summary cards
      { name: 'Dashboard header with team name and greeting', done: true },
      { name: 'Summary KPI cards (contacts, channels, bots, credits)', done: true },
      { name: 'Trial achievement banner (credits + progress ring)', done: true },
      // Onboarding checklist
      { name: 'Onboarding / getting-started checklist (accordion)', done: true },
      { name: 'Onboarding progress bar and step completion', done: true },
      { name: 'Onboarding steps team-wide tracking', done: false },
      // Channel recommendations
      { name: 'Channel recommendation cards (connect first channel)', done: true },
      { name: 'Initial landing page (no channels connected state)', done: true },
      // Exploring / feature discovery
      { name: 'Exploring / feature discovery section (ExploringCard grid)', done: false },
      // Quick metrics (GettingStarted metrics section)
      { name: 'Quick metric cards (messages sent/received, reply speed, time saved)', done: true },
      // Mobile
      { name: 'Mobile view buttons (View Inbox shortcut)', done: false },
      // Feature announcements
      { name: 'Feature update announcement modal (auto-show once per session)', done: false },
    ],
    notes: 'Dashboard = the "getting-started" home page (route: /getting-started). Has header, trial banner, onboarding checklist, channel recs, exploring section, and quick KPI cards. Separate from the full Analytics page.',
  },

  analytics: {
    label: 'Analytics',
    icon: '📊',
    category: 'core',
    status: 'in-progress',
    progress: 0,
    oldFileCount: 22,
    subFeatures: [
      // Widget grid
      { name: 'Dashboard layout manager (drag-and-drop, resize widgets)', done: true },
      { name: 'Add widget dialog (searchable metric picker + viz selector)', done: true },
      // Dashboard management
      { name: 'New dashboard creation modal (with default widgets toggle)', done: true },
      { name: 'Dashboard delete', done: true },
      { name: 'Dashboard rename (inline edit)', done: true },
      { name: 'Dashboard sharing (per-user and team-level permissions)', done: true },
      { name: 'Request edit access (non-owner flow)', done: false },
      // Time / grouping controls
      { name: 'Time period / date range selector', done: true },
      { name: 'Aggregate selector (day / week / month grouping)', done: true },
      { name: 'Dashboard channel and tag filters bar', done: true },
      // Chart widget types
      { name: 'Line chart widget', done: true },
      { name: 'Pie chart widget', done: true },
      { name: 'Bar chart widget', done: true },
      { name: 'Snapshot / KPI comparison widget', done: true },
      { name: 'Table / data grid widget', done: true },
      { name: 'Funnel chart widget', done: false },
      // Per-widget features
      { name: 'Per-widget metric breakdown (by user, tag, channel, automation)', done: true },
      { name: 'Per-widget filter popover', done: true },
      { name: 'Metric comparison: period vs previous period', done: true },
      { name: 'Per-widget CSV data export', done: true },
      { name: 'Widget-level error retry', done: true },
      // Performance tabs
      { name: 'Performance tabs header (Chat / Agent)', done: false },
      { name: 'Chat performance tab (widget grid)', done: true },
      { name: 'Agent performance tab (agent table)', done: true },
      { name: 'Marketing performance tab', done: false },
      { name: 'Sales performance tab', done: false },
      // Export
      { name: 'Dashboard PNG export (html-to-image)', done: true },
    ],
    notes: 'Analytics = the full chart dashboard page (route: /analytics). Separate from the home Dashboard page. All core features shipped: drag-drop grid, 5 widget types, per-widget breakdown/filter/CSV/retry, aggregate pills, period comparison, sharing, export. Remaining: funnel chart, request-edit-access, marketing/sales performance tabs.',
  },

  // ── Engage ───────────────────────────────────────────────────────────────────
  automation: {
    label: 'Automation',
    icon: '⚙️',
    category: 'engage',
    status: 'in-progress',
    progress: 88,
    oldFileCount: 31,
    subFeatures: [
      // Panels (list views)
      { name: 'Message flows panel (list + bulk checkboxes)', done: true },
      { name: 'Message flows filter popover', done: true },
      { name: 'Keyword reply panel', done: true },
      { name: 'Offline bot panel', done: true },
      { name: 'Trigger history panel', done: true },
      { name: 'Trigger history filter popover', done: true },
      { name: 'Template market panel', done: true },
      { name: 'Template market filter popover', done: true },
      { name: 'Create flow dialog', done: true },
      { name: 'Flow detail drawer', done: true },

      // Keyword reply — detail
      { name: 'Keyword trigger configuration (type, match)', done: true },
      { name: 'Default reply option', done: true },
      { name: 'Keyword reply content editor', done: true },
      { name: 'Advanced settings — active/inactive toggle', done: true },
      { name: 'Advanced settings — time frame (day + hour ranges)', done: true },
      { name: 'Copy time frames between days', done: true },
      { name: 'Keyword execution history modal', done: true },

      // Visual flow builder
      { name: 'Visual flow builder canvas (ReactFlow)', done: true },
      { name: 'Message node', done: true },
      { name: 'Condition node (AND/OR groups, operators)', done: true },
      { name: 'Delay node (date / duration / weekday)', done: true },
      { name: 'Input / data collection node', done: true },
      { name: 'Email node', done: true },
      { name: 'Form embed node', done: false },
      { name: 'Webhook / URL node', done: true },
      { name: 'Bot target node', done: true },
      { name: 'Trigger node (frequency, throttle, audience)', done: true },
      { name: 'Node editor sidebar', done: true },
      { name: 'Node toolbar (copy, delete, edit)', done: true },
      { name: 'Helper lines / alignment', done: true },
      { name: 'Flow folder organization', done: true },
      { name: 'Flow import / export', done: true },
      { name: 'Unsaved changes tracking', done: true },
      { name: 'Conflict detection', done: false },
      { name: 'Flow analytics / performance metrics', done: true },
      { name: 'AI flow builder interface', done: true },
    ],
    notes: 'Full rebuild complete. Keyword reply: trigger config, time frames per day, copy-to-all, execution history. Flow builder: ReactFlow canvas, 9 node types (Trigger/Message/Condition/Delay/Input/Email/Webhook/BotTarget/End), node editor panel, sidebar palette, toolbar (save/undo/export/import), flow analytics, unsaved tracking. AI Builder: plain-English flow generation, 4-step wizard, cinematic dark UI.',
  },

  broadcasts: {
    label: 'Marketing / Broadcasts',
    icon: '📢',
    category: 'engage',
    status: 'in-progress',
    progress: 75,
    oldFileCount: 19,
    subFeatures: [
      { name: 'Broadcasts list panel (cinematic redesign)', done: true },
      { name: 'Create broadcast dialog', done: true },
      { name: 'Create broadcast full page', done: true },
      { name: 'Broadcast progress dialog', done: true },
      { name: 'Campaigns tab (inside Marketing)', done: true },
      { name: 'Broadcast name and channel selection', done: true },
      { name: 'Message template / flow selection in broadcast', done: true },
      { name: 'Recipient filter / audience selection', done: true },
      { name: 'Schedule date and time picker', done: true },
      { name: 'Send now option', done: true },
      { name: 'Channel type selection (WABA / non-WABA / all)', done: true },
      { name: 'Broadcast analytics — KPI cards', done: true },
      { name: 'Broadcast analytics — delivery trend chart', done: true },
      { name: 'Broadcast analytics — per-broadcast breakdown', done: true },
      { name: 'Broadcast analytics drawer (per-broadcast detail)', done: true },
      { name: 'View recipients modal (contact count)', done: true },
      { name: 'Recurring broadcast settings', done: true },
      { name: 'Send interval / speed configuration', done: true },
      { name: 'WABA tier limit calculation', done: true },
      { name: 'Broadcast speed warning modal', done: true },
      { name: 'Broadcast analytics — delivery heatmap', done: true },
      { name: 'Broadcast analytics — cost efficiency card', done: true },
    ],
    notes: 'All 7 missing features implemented: view recipients modal (with status filter + search), recurring settings (daily/weekly/monthly), speed config cards (Safest/Safe/Normal/Fast), WABA Tier 250 restriction on Fast, speed warning modal with risk list, delivery heatmap (7×24 grid), and cost efficiency card with RadialBar ring + sparkline.',
  },

  campaigns: {
    label: 'Campaigns',
    icon: '🎯',
    category: 'engage',
    status: 'in-progress',
    progress: 90,
    oldFileCount: 0,
    subFeatures: [
      { name: 'Campaign list (card rows + pill status badges)', done: true },
      { name: 'Campaign row component', done: true },
      { name: 'Campaign progress bar', done: true },
      { name: 'Campaign detail drawer', done: true },
      { name: 'Create campaign full page', done: true },
      { name: 'Delete campaign dialog', done: true },
      { name: 'Campaign store (Zustand)', done: true },
      { name: 'Campaign queries (TanStack)', done: true },
      { name: 'Campaign status tracking (Inactive / Scheduled / Progress / Completed)', done: true },
      { name: 'Campaign scheduling (send now / schedule later)', done: true },
      { name: 'Campaign recipient selection / tag-based audience', done: true },
      { name: 'Campaign send speed options (Safest / Safe / Normal / Fast)', done: true },
      { name: 'Campaign send settings (typing indicator, cancel on reply, randomize)', done: true },
      { name: 'Campaign analytics', done: false },
    ],
    notes: 'Core list, create page, detail drawer, store, queries, status tracking, scheduling, tag-based audience, speed config, and send settings all done. Campaign analytics not yet built.',
  },

  // ── Tools ────────────────────────────────────────────────────────────────────
  tools: {
    label: 'Tools',
    icon: '🔧',
    category: 'tools',
    status: 'in-progress',
    progress: 60,
    oldFileCount: 22,
    subFeatures: [
      // Forms
      { name: 'Forms list panel', done: true },
      { name: 'Form detail dialog', done: true },
      { name: 'Create form dialog', done: true },
      { name: 'Form question types (text, choice, etc.)', done: false },
      { name: 'Conditional question logic', done: false },
      { name: 'Form preview', done: false },
      { name: 'View form submissions', done: true },
      { name: 'Form submission analytics', done: false },
      { name: 'Share / embed form link', done: false },
      { name: 'Form template selection', done: false },

      // QR Code
      { name: 'QR code generator panel', done: true },
      { name: 'iOS QR code download', done: false },
      { name: 'Android QR code download', done: false },

      // Widget builder
      { name: 'Widget builder panel', done: true },
      { name: 'Widget basic settings', done: false },
      { name: 'Widget button settings', done: false },
      { name: 'Widget code preview / copy', done: false },

      // Zapier
      { name: 'Zapier panel', done: true },
      { name: 'Zapier OAuth flow', done: false },
      { name: 'Zapier token management', done: false },

      // Custom fields
      { name: 'Custom fields manager', done: false },
      { name: 'Custom field types configuration', done: false },
      { name: 'Custom fields in inbox contact profile', done: false },
      { name: 'Custom fields in CRM tickets', done: false },

      // Coupon campaigns
      { name: 'Coupon campaigns list', done: false },
      { name: 'Create / edit coupon campaign', done: false },
      { name: 'Coupon redemption tracking', done: false },
      { name: 'Coupon terms and conditions', done: false },
      { name: 'Coupon redeem interface', done: false },
    ],
    notes: 'Forms, QR, Widget, Zapier panels exist. Conditional form logic, widget customization, Zapier OAuth, custom fields, and coupon campaigns not yet rebuilt.',
  },

  ai: {
    label: 'AI / Chatbot',
    icon: '🤖',
    category: 'tools',
    status: 'complete',
    progress: 95,
    oldFileCount: 17,
    subFeatures: [
      // Knowledge base
      { name: 'Knowledge base list panel', done: true },
      { name: 'Create KB dialog', done: true },
      { name: 'KB detail panel', done: true },
      { name: 'KB data source upload (files)', done: true },
      { name: 'KB website crawl option', done: true },
      { name: 'KB source table (manage sources)', done: true },
      { name: 'KB test / query interface', done: false },

      // Chatbot
      { name: 'AI chatbot list panel', done: true },
      { name: 'Create chatbot dialog', done: true },
      { name: 'Chatbot settings / edit', done: true },
      { name: 'Link chatbot to channels', done: true },
      { name: 'Chatbot interactive demo / test chat', done: true },
      { name: 'AI agent templates modal', done: true },
      { name: 'Add data section (training data)', done: true },
      { name: 'File upload with progress tracking', done: true },

      // NLP / keyword
      { name: 'NLP / intent detection configuration', done: true },
      { name: 'AI CRM profile integration', done: true },

      // Offline bot
      { name: 'Offline bot auto-response configuration', done: true },
    ],
    notes: 'Full rebuild complete. KB: sources table, file upload with progress, website crawl with depth selector. Chatbot: card grid, edit drawer (5 tabs: data sources, settings, link channels, test chat, offline bot), NLP/intent config, channel linking, team assignment, offline schedule. AI CRM panel with GPT model selector. 8 agent templates modal. One remaining: KB test/query interface.',
  },

  appstore: {
    label: 'App Store',
    icon: '🏪',
    category: 'tools',
    status: 'complete',
    progress: 92,
    oldFileCount: 8,
    subFeatures: [
      { name: 'App store browse list', done: true },
      { name: 'App store category filters', done: true },
      { name: 'Add / connect service dialog', done: true },
      { name: 'App installer stepper (multi-step setup)', done: true },
      { name: 'OAuth modal for app authorization', done: true },
      { name: 'App required permissions display', done: true },
      { name: 'Installed apps management', done: true },
      { name: 'App update checks', done: true },
      { name: 'App removal / disconnect', done: true },
      { name: 'Integration detail / deep config pages', done: false },
      { name: 'Payment integrations config', done: true },
      { name: 'Chrome extension login', done: true },
    ],
    notes: 'Full rebuild complete. 18-app catalog with category + country filters, 5-step installer drawer (overview, permissions, config, OAuth, complete), OAuth modal with callback URL handler, installed apps card list with toggle/remove/update checks, payment integrations grid (15 providers, country flags, connect/toggle), Chrome extension panel with masked token + copy + install steps. Remaining: integration deep config pages (per-app custom settings).',
  },

  // ── Commerce ─────────────────────────────────────────────────────────────────
  shops: {
    label: 'Shops / Commerce',
    icon: '🛍️',
    category: 'commerce',
    status: 'in-progress',
    progress: 65,
    oldFileCount: 38,
    subFeatures: [
      // Orders
      { name: 'Orders list panel', done: true },
      { name: 'Order detail drawer', done: true },
      { name: 'Order status chips display', done: false },
      { name: 'Order filter / search', done: false },
      { name: 'Order status tracking', done: false },
      { name: 'Custom order menu', done: false },

      // Products
      { name: 'Products list panel', done: true },
      { name: 'Create / edit product dialog', done: true },
      { name: 'Product image / media upload', done: false },
      { name: 'Product categories management', done: false },
      { name: 'Product category selector', done: false },
      { name: 'Product pricing and currency selector', done: false },
      { name: 'Product import from CSV', done: false },
      { name: 'Product visibility / status toggle', done: false },

      // Payments
      { name: 'Payments panel', done: true },
      { name: 'Payment processing setup', done: false },
      { name: 'Stripe integration', done: false },

      // Shipping
      { name: 'Shipping panel', done: true },
      { name: 'Shipping details configuration', done: false },

      // Shop setup
      { name: 'Shop setup / onboarding wizard', done: false },
      { name: 'Shop profile / settings modal', done: false },
      { name: 'Shop type selection', done: false },

      // Subscriptions
      { name: 'Subscriptions / billing cycles', done: false },
      { name: 'Shop onboarding product step', done: false },
    ],
    notes: 'Orders, products (basic), payments, and shipping panels exist. Product categories, CSV import, shop setup wizard, Stripe, and subscriptions not yet rebuilt.',
  },

  // ── Admin ────────────────────────────────────────────────────────────────────
  settings: {
    label: 'Settings',
    icon: '⚙️',
    category: 'admin',
    status: 'in-progress',
    progress: 70,
    oldFileCount: 14,
    subFeatures: [
      { name: 'Profile settings', done: true },
      { name: 'Team settings', done: true },
      { name: 'Members settings', done: true },
      { name: 'Notifications settings (app alerts)', done: true },
      { name: 'Billing settings tab', done: true },
      { name: 'Developer / API token management', done: true },
      { name: 'Generate API token modal', done: false },
      { name: 'Webhook URL display and management', done: false },
      { name: 'Webhook credentials management', done: false },
      { name: 'OAuth modal for external apps', done: false },
      { name: 'Reset password modal', done: false },
      { name: 'Credit display / credit map', done: false },
      { name: 'External platform manager (e-commerce)', done: false },
      { name: 'Support service setup', done: false },
    ],
    notes: 'All 6 main tabs exist. Webhook management, OAuth, token generation modal, and credit display not yet rebuilt.',
  },

  admin: {
    label: 'Admin Panel',
    icon: '🛡️',
    category: 'admin',
    status: 'in-progress',
    progress: 75,
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
      { name: 'Announcements — markdown editor', done: false },
      { name: 'Announcements — action button config', done: false },
      { name: 'Announcements — preview modal', done: false },
      { name: 'Users — edit team membership', done: false },
      { name: 'Users — partnership selector', done: false },
      { name: 'Coupons — redemption list view', done: false },
      { name: 'Credits — manage support plan', done: false },
      { name: 'Credits — migrate credits modal', done: false },
      { name: 'Preferences — notification preference table', done: false },
      { name: 'Preferences — Stripe preferences', done: false },
      { name: 'Pricing editor (plan JSON management)', done: false },
      { name: 'Survey management', done: false },
      { name: 'Company analytics dashboard', done: false },
      { name: 'Company insights / BI data', done: false },
      { name: 'Plan tracking / usage monitoring', done: false },
    ],
    notes: 'All 10 base panels present. Detail features within each panel (markdown editor, redemption lists, pricing editor, surveys, company analytics) not yet rebuilt.',
  },

  // ── Missing / Deferred ───────────────────────────────────────────────────────
  'flow-builder': {
    label: 'Visual Flow Builder',
    icon: '🗺️',
    category: 'missing',
    status: 'deferred',
    progress: 0,
    oldFileCount: 198,
    subFeatures: [
      { name: 'Canvas with ReactFlow (drag-and-drop)', done: false },
      { name: 'Message node', done: false },
      { name: 'Condition node (AND/OR groups, operators)', done: false },
      { name: 'Delay node (date / duration / weekday)', done: false },
      { name: 'Input / data collection node', done: false },
      { name: 'Email node', done: false },
      { name: 'Form embed node', done: false },
      { name: 'Webhook / URL node', done: false },
      { name: 'Bot target node', done: false },
      { name: 'App integration nodes', done: false },
      { name: 'Trigger node (frequency, throttle, audience, time zone)', done: false },
      { name: 'Node editor sidebar', done: false },
      { name: 'Node toolbar (copy, delete, edit)', done: false },
      { name: 'Helper lines for alignment', done: false },
      { name: 'Flow folder organization', done: false },
      { name: 'Flow import / export', done: false },
      { name: 'Unsaved changes tracking', done: false },
      { name: 'Conflict detection', done: false },
      { name: 'Flow analytics / performance metrics', done: false },
      { name: 'AI flow builder interface', done: false },
      { name: 'Template import / export', done: false },
    ],
    notes: 'Intentionally deferred (P3). Largest old module (198 files). Empty stub only in v2.',
  },

  notifications: {
    label: 'Webhooks / Notifications',
    icon: '🔔',
    category: 'missing',
    status: 'not-started',
    progress: 10,
    oldFileCount: 27,
    subFeatures: [
      { name: 'Notifications settings tab (in Settings)', done: true },
      { name: 'E-commerce webhook service list', done: false },
      { name: 'Add / edit notification webhook', done: false },
      { name: 'Notification trigger accordion', done: false },
      { name: 'Trigger condition rows and groups', done: false },
      { name: 'Condition diagnostics', done: false },
      { name: 'Webhook URL display + copy', done: false },
      { name: 'Shopify integration', done: false },
      { name: 'WooCommerce integration', done: false },
      { name: 'Shopee integration', done: false },
      { name: 'Shopline integration', done: false },
      { name: 'Shopage integration', done: false },
      { name: 'Webhook credentials management', done: false },
      { name: 'Service setup instructions modal', done: false },
      { name: 'OAuth callback handler (for external services)', done: false },
      { name: 'Real-time notification badge (app-wide)', done: false },
    ],
    notes: 'Only app notification settings tab built. Full e-commerce webhook integrations (Shopify, WooCommerce, Shopee, Shopline) not started.',
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
      { name: 'Getting started checklist (in Dashboard)', done: true },
      { name: 'Signup / registration flow', done: false },
      { name: 'OTP verification (SMS + email)', done: false },
      { name: 'Team setup wizard', done: false },
      { name: 'Company information setup step', done: false },
      { name: 'Phone number setup step', done: false },
      { name: 'Notification setup step', done: false },
      { name: 'Coexist / migration flow', done: false },
      { name: 'Trial achievement banner', done: false },
      { name: 'Onboarding progress tracking (team-wide)', done: false },
    ],
    notes: 'Channel and dashboard onboarding done. Full signup, OTP, team setup wizard, and coexist flow not started.',
  },

  billing: {
    label: 'Billing / Subscriptions',
    icon: '💳',
    category: 'missing',
    status: 'not-started',
    progress: 10,
    oldFileCount: 23,
    subFeatures: [
      { name: 'Billing settings tab (in Settings)', done: true },
      { name: 'Plan selection / comparison table', done: false },
      { name: 'Addon purchases', done: false },
      { name: 'Plan / addon card display', done: false },
      { name: 'Plan state chip (active / trial / expired)', done: false },
      { name: 'Subscription list', done: false },
      { name: 'Subscription data table', done: false },
      { name: 'Invoice history', done: false },
      { name: 'Payment methods management', done: false },
      { name: 'Plan upgrade / downgrade flow', done: false },
      { name: 'Feature-locked pages (plan gating)', done: false },
      { name: 'Buy credits interface', done: false },
      { name: 'Zero credits upsell page', done: false },
      { name: 'Credit transaction tracking', done: false },
      { name: 'Stripe checkout integration', done: false },
      { name: 'Credit billing view', done: false },
      { name: 'Non-credit billing view', done: false },
    ],
    notes: 'Only billing settings tab exists. Full billing module (plans, addons, invoices, credits, Stripe) not started.',
  },

  localization: {
    label: 'Localization',
    icon: '🌐',
    category: 'missing',
    status: 'not-started',
    progress: 0,
    oldFileCount: 8,
    subFeatures: [
      { name: 'English (en) locale', done: false },
      { name: 'Traditional Chinese (cht) locale', done: false },
      { name: 'Simplified Chinese (chs) locale', done: false },
      { name: 'Portuguese (ptg) locale', done: false },
      { name: 'Language selector UI', done: false },
      { name: 'Locale context provider', done: false },
    ],
    notes: 'Old app supports 4 languages. V2 has no i18n wired yet.',
  },

  'help-support': {
    label: 'Help & Support',
    icon: '🆘',
    category: 'missing',
    status: 'not-started',
    progress: 0,
    oldFileCount: 1,
    subFeatures: [
      { name: 'Help center iframe embed (chatdaddy-helpcenter.chatdaddy.tech)', done: false },
      { name: 'Help support route (/help-support)', done: false },
    ],
    notes: 'Simple iframe embedding the ChatDaddy help center. Old app: src/HelpSupport/index.tsx. Not started in v2.',
  },

  // ── Platform / Infrastructure ────────────────────────────────────────────────
  'analytics-ux-checklist': {
    label: 'Analytics & UX Checklist',
    icon: '🔬',
    category: 'platform',
    status: 'not-started',
    progress: 0,
    oldFileCount: 0,
    subFeatures: [
      // 1. Adoption Tracking
      { name: 'feature_viewed event', done: false },
      { name: 'feature_clicked event', done: false },
      { name: 'Unique users using feature tracked', done: false },
      { name: 'First-time usage tracked', done: false },

      // 2. Interaction Tracking
      { name: 'Click events tracked', done: false },
      { name: 'Dead clicks detected', done: false },
      { name: 'Rage clicks detected', done: false },
      { name: 'Hover tracking', done: false },
      { name: 'Scroll depth tracking', done: false },

      // 3. Engagement Metrics
      { name: 'Time spent per session tracked', done: false },
      { name: 'Time to complete task tracked', done: false },
      { name: 'Idle vs active time tracked', done: false },
      { name: 'Number of steps taken tracked', done: false },

      // 4. Funnel Tracking (CRITICAL)
      { name: 'Funnel steps defined per module', done: false },
      { name: 'Step-by-step conversion tracked', done: false },
      { name: 'Drop-off points identified', done: false },
      { name: 'Completion rate tracked', done: false },

      // 5. Errors & Friction
      { name: 'Error messages tracked', done: false },
      { name: 'Validation failures tracked', done: false },
      { name: 'API failures tracked', done: false },
      { name: 'Loading time tracked', done: false },
      { name: 'User exits tracked', done: false },

      // 6. UX Quality Signals
      { name: 'Rage click rate surfaced per module', done: false },
      { name: 'Dead click rate surfaced per module', done: false },
      { name: 'Backtracking behavior tracked', done: false },
      { name: 'Repeated attempts tracked', done: false },

      // 7. Derived Metrics
      { name: 'Task success rate calculated', done: false },
      { name: 'Avg completion time calculated', done: false },
      { name: 'Drop-off rate calculated', done: false },
      { name: 'UX difficulty score calculated', done: false },

      // Visual Indicators (per-module status display)
      { name: 'Per-module tracking status badge (✅ / ⚠️ / ❌)', done: false },
      { name: 'Checklist completion % per module', done: false },
      { name: 'Critical missing items highlighted (red)', done: false },

      // Smart Insights Layer
      { name: 'Auto-generated insight: high drop-off detection', done: false },
      { name: 'Auto-generated insight: clicks without completion', done: false },
      { name: 'Auto-generated insight: high rage click rate warning', done: false },

      // Data Source Integration
      { name: 'PostHog / Mixpanel / Amplitude integration ready', done: false },
      { name: 'Event naming convention enforced (module_feature_action)', done: false },
      { name: 'Custom event tracking system hookup', done: false },

      // UI / Checklist Shell
      { name: 'Collapsible category panels UI', done: false },
      { name: 'Progress bars per checklist category', done: false },
      { name: 'Color-coded health status (green / yellow / red)', done: false },
      { name: 'Per-module analytics readiness dashboard view', done: false },
    ],
    notes: 'New platform module — no equivalent in old app. Answers: Are we tracking this feature properly? Do users actually use it? Where do they struggle? Is the UX good or broken? Per-module checklist with smart insights layer and data source integration (PostHog/Mixpanel/Amplitude).',
  },
}

// ─── Derive progress + status from sub-features ──────────────────────────────

function deriveProgress(subFeatures: SubFeature[]): number {
  if (!subFeatures.length) return 0
  const done = subFeatures.filter((f) => f.done).length
  return Math.round((done / subFeatures.length) * 100)
}

function deriveStatus(progress: number, previousStatus: ModuleStatus): ModuleStatus {
  // Deferred is a deliberate decision — never auto-change it
  if (previousStatus === 'deferred') return 'deferred'
  if (progress === 0) return 'not-started'
  if (progress === 100) return 'done'
  return 'in-progress'
}

// ─── Merge static config + live data ─────────────────────────────────────────

export const TRACKED_MODULES: TrackedModule[] = Object.entries(STATIC).map(([id, cfg]) => {
  const live = liveModules[id]
  const subFeatures = live ? autoCheckSubFeatures(cfg.subFeatures, live) : cfg.subFeatures
  const progress = deriveProgress(subFeatures)
  const status = deriveStatus(progress, cfg.status)
  return {
    id,
    ...cfg,
    status,
    progress,
    subFeatures,
    newFileCount: live?.fileCount ?? 0,
    hasStore: live?.hasStore ?? false,
    hasQueries: live?.hasQueries ?? false,
    hasRoute: live?.hasRoute ?? false,
    isEmpty: live?.isEmpty ?? true,
  }
})

// Internal v2 modules that are tooling, not product features — skip them
const INTERNAL_MODULE_IDS = new Set(['rebuild-tracker'])

// Also surface any NEW modules detected in live data that aren't in STATIC yet
const unknownModules = Object.keys(liveModules).filter((id) => !STATIC[id] && !INTERNAL_MODULE_IDS.has(id))
for (const id of unknownModules) {
  const live = liveModules[id]
  if (!live.isEmpty) {
    TRACKED_MODULES.push({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
      icon: '🆕',
      category: 'core',
      status: live.hasRoute ? 'in-progress' : 'not-started',
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
