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
    progress: 75,
    oldFileCount: 14,
    subFeatures: [
      { name: 'Login page (email + password)', done: true },
      { name: 'Protected route guard', done: true },
      { name: 'Auth hydration on load', done: true },
      { name: 'OTP confirmation (SMS)', done: false },
      { name: 'Email OTP confirmation', done: false },
      { name: 'Password reset flow', done: false },
      { name: 'Signup / registration flow', done: false },
      { name: 'Scope-based permissions (feature locking)', done: false },
      { name: 'Role-based access (admin vs user)', done: false },
    ],
    notes: 'Login complete. Signup, OTP, reset password, and scoped access not rebuilt yet.',
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
    progress: 60,
    oldFileCount: 18,
    subFeatures: [
      { name: 'Call list view (DataGrid)', done: true },
      { name: 'Call stats cards', done: true },
      { name: 'Calls filter panel', done: true },
      { name: 'Call detail drawer', done: true },
      { name: 'Caller / recipient information display', done: false },
      { name: 'Call duration and status display', done: false },
      { name: 'Call popup modal (incoming/outgoing)', done: false },
      { name: 'Call using modal (select channel)', done: false },
      { name: 'Verify number dialog', done: false },
      { name: 'Manage channels for calls', done: false },
      { name: 'Mobile filter layout for calls', done: false },
      { name: 'Twilio SDK integration', done: false },
      { name: 'Live call UI (in-call controls)', done: false },
    ],
    notes: 'Call history, stats, filters, and detail drawer done. Live calling (Twilio), call popup, and verify number not yet integrated.',
  },

  dashboard: {
    label: 'Dashboard',
    icon: '📊',
    category: 'core',
    status: 'in-progress',
    progress: 40,
    oldFileCount: 22,
    subFeatures: [
      { name: 'Stats / KPI cards', done: true },
      { name: 'Onboarding / getting-started checklist', done: true },
      { name: 'Channel recommendation cards', done: true },
      { name: 'Add / edit dashboard widgets', done: false },
      { name: 'Dashboard layout manager (drag-and-drop widgets)', done: false },
      { name: 'Dashboard sharing', done: false },
      { name: 'New dashboard creation modal', done: false },
      { name: 'Time period / date range selector', done: false },
      { name: 'Line chart widget', done: false },
      { name: 'Pie chart widget', done: false },
      { name: 'Bar chart widget', done: false },
      { name: 'Funnel chart widget', done: false },
      { name: 'Snapshot / comparison chart', done: false },
      { name: 'Table / data grid chart', done: false },
      { name: 'Chart legends and tooltips', done: false },
      { name: 'Metric comparison view (period vs period)', done: false },
      { name: 'Team analytics view', done: false },
    ],
    notes: 'Getting-started version done. Full analytics with chart widgets, layout manager, and period comparison not yet ported.',
  },

  // ── Engage ───────────────────────────────────────────────────────────────────
  automation: {
    label: 'Automation',
    icon: '⚙️',
    category: 'engage',
    status: 'in-progress',
    progress: 55,
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
      { name: 'Keyword trigger configuration (type, match)', done: false },
      { name: 'Default reply option', done: false },
      { name: 'Keyword reply content editor', done: false },
      { name: 'Advanced settings — active/inactive toggle', done: false },
      { name: 'Advanced settings — time frame (day + hour ranges)', done: false },
      { name: 'Copy time frames between days', done: false },
      { name: 'Keyword execution history modal', done: false },

      // Visual flow builder (deferred to flow-builder module)
      { name: 'Visual flow builder canvas (ReactFlow)', done: false },
      { name: 'Message node', done: false },
      { name: 'Condition node (AND/OR groups, operators)', done: false },
      { name: 'Delay node (date / duration / weekday)', done: false },
      { name: 'Input / data collection node', done: false },
      { name: 'Email node', done: false },
      { name: 'Form embed node', done: false },
      { name: 'Webhook / URL node', done: false },
      { name: 'Bot target node', done: false },
      { name: 'Trigger node (frequency, throttle, audience)', done: false },
      { name: 'Node editor sidebar', done: false },
      { name: 'Node toolbar (copy, delete, edit)', done: false },
      { name: 'Helper lines / alignment', done: false },
      { name: 'Flow folder organization', done: false },
      { name: 'Flow import / export', done: false },
      { name: 'Unsaved changes tracking', done: false },
      { name: 'Conflict detection', done: false },
      { name: 'Flow analytics / performance metrics', done: false },
      { name: 'AI flow builder interface', done: false },
    ],
    notes: 'List panels and filter popovers done. Keyword reply details, visual flow builder, and all node types not yet rebuilt.',
  },

  broadcasts: {
    label: 'Marketing / Broadcasts',
    icon: '📢',
    category: 'engage',
    status: 'in-progress',
    progress: 65,
    oldFileCount: 19,
    subFeatures: [
      { name: 'Broadcasts list panel (cinematic redesign)', done: true },
      { name: 'Create broadcast dialog', done: true },
      { name: 'Create broadcast full page', done: true },
      { name: 'Broadcast progress dialog', done: true },
      { name: 'Campaigns tab (inside Marketing)', done: true },
      { name: 'Broadcast name and channel selection', done: false },
      { name: 'Message template selection in broadcast', done: false },
      { name: 'Recipient filter / audience selection', done: false },
      { name: 'View recipients modal (contact count)', done: false },
      { name: 'Schedule date and time picker', done: false },
      { name: 'Send now option', done: false },
      { name: 'Recurring broadcast settings', done: false },
      { name: 'Send interval / speed configuration', done: false },
      { name: 'WABA tier limit calculation', done: false },
      { name: 'Broadcast speed warning modal', done: false },
      { name: 'Broadcast analytics — KPI cards', done: false },
      { name: 'Broadcast analytics — trend mini charts', done: false },
      { name: 'Broadcast analytics — delivery heatmap', done: false },
      { name: 'Broadcast analytics — cost efficiency card', done: false },
      { name: 'Broadcast analytics — comparison view', done: false },
    ],
    notes: 'List, create dialog/page, and progress dialog done. Recipient filtering, scheduling, speed config, and analytics not yet rebuilt.',
  },

  campaigns: {
    label: 'Campaigns',
    icon: '🎯',
    category: 'engage',
    status: 'in-progress',
    progress: 75,
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
      { name: 'Campaign status tracking (Inactive / Scheduled / Progress / Completed)', done: false },
      { name: 'Campaign scheduling', done: false },
      { name: 'Campaign recipient selection / audience', done: false },
      { name: 'Campaign analytics', done: false },
    ],
    notes: 'Core list, create page, detail drawer, store, and queries done. Status tracking, scheduling, and analytics not yet wired.',
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
    status: 'in-progress',
    progress: 60,
    oldFileCount: 17,
    subFeatures: [
      // Knowledge base
      { name: 'Knowledge base list panel', done: true },
      { name: 'Create KB dialog', done: true },
      { name: 'KB detail panel', done: true },
      { name: 'KB data source upload (files)', done: false },
      { name: 'KB website crawl option', done: false },
      { name: 'KB source table (manage sources)', done: false },
      { name: 'KB test / query interface', done: false },

      // Chatbot
      { name: 'AI chatbot list panel', done: true },
      { name: 'Create chatbot dialog', done: true },
      { name: 'Chatbot settings / edit', done: false },
      { name: 'Link chatbot to channels', done: false },
      { name: 'Chatbot interactive demo / test chat', done: false },
      { name: 'AI agent templates modal', done: false },
      { name: 'Add data section (training data)', done: false },
      { name: 'File upload with progress tracking', done: false },

      // NLP / keyword
      { name: 'NLP / intent detection configuration', done: false },
      { name: 'AI CRM profile integration', done: false },

      // Offline bot
      { name: 'Offline bot auto-response configuration', done: false },
    ],
    notes: 'Chatbot list/create and KB list/create done. KB sources, website crawl, chatbot config, linking to channels, and offline bot not yet rebuilt.',
  },

  appstore: {
    label: 'App Store',
    icon: '🏪',
    category: 'tools',
    status: 'in-progress',
    progress: 50,
    oldFileCount: 8,
    subFeatures: [
      { name: 'App store browse list', done: true },
      { name: 'App store category filters', done: false },
      { name: 'Add / connect service dialog', done: true },
      { name: 'App installer stepper (multi-step setup)', done: false },
      { name: 'OAuth modal for app authorization', done: false },
      { name: 'App required permissions display', done: false },
      { name: 'Installed apps management', done: false },
      { name: 'App update checks', done: false },
      { name: 'App removal / disconnect', done: false },
      { name: 'Integration detail / deep config pages', done: false },
      { name: 'Payment integrations config', done: false },
      { name: 'Chrome extension login', done: false },
    ],
    notes: 'Basic browse list and connect dialog done. Full installer stepper, OAuth, and per-app config pages not yet rebuilt.',
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
