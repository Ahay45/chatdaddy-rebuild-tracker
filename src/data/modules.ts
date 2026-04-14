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
    progress: 85,
    oldFileCount: 62,
    subFeatures: [
      // ── Chat list ────────────────────────────────────────────────────────────
      { name: 'Chat list (virtualized scroll)', done: true },
      { name: 'Unread count badges', done: true },
      { name: 'Assignee display on chat row', done: true },
      { name: 'Tag chips on chat row', done: true },
      { name: 'Account / channel selector in header', done: true },
      { name: 'Search messages and contacts', done: true },
      { name: 'Pinned filter presets (top bar)', done: true },
      { name: 'Pin filter dialog (create / edit named filters)', done: true },
      { name: 'No channels empty state', done: true },
      { name: 'Feature carousel / onboarding tooltip', done: false },

      // ── Filters (left panel) ──────────────────────────────────────────────
      { name: 'Filter panel — channels', done: true },
      { name: 'Filter panel — tags (AND/OR)', done: true },
      { name: 'Filter panel — assignee', done: true },
      { name: 'Filter panel — date range', done: true },
      { name: 'Filter panel — unread / groups / individuals / archived quick filters', done: true },
      { name: 'Filter panel — ticket/CRM stage', done: false },
      { name: 'Filter panel — custom fields', done: false },
      { name: 'Active filter display chips', done: true },
      { name: 'Saved tag filter presets (useSavedTagFilters)', done: true },
      { name: 'Saved assignee filter presets (useSavedAssigneeFilters)', done: true },
      { name: 'Manage channels dialog from filter panel', done: false },

      // ── Message thread ────────────────────────────────────────────────────
      { name: 'Message thread (chronological)', done: true },
      { name: 'Date dividers in thread', done: true },
      { name: 'Auto-scroll to latest message', done: true },
      { name: 'Scroll-to-bottom button', done: true },
      { name: 'Load more messages (pagination)', done: true },
      { name: 'Quoted / reply message preview', done: true },
      { name: 'Message status indicators (sent/delivered/read)', done: true },
      { name: 'Search within conversation (FilteredMessages)', done: true },
      { name: 'Fetch messages from platform button (FetchMsgsFromPlatformView)', done: true },

      // ── Message types ─────────────────────────────────────────────────────
      { name: 'Text message bubble', done: true },
      { name: 'Image message', done: true },
      { name: 'Video message', done: true },
      { name: 'Audio / voice note player', done: true },
      { name: 'Document / file message', done: true },
      { name: 'Link preview', done: true },
      { name: 'Location message', done: true },
      { name: 'Contact card (vCard)', done: true },
      { name: 'Interactive buttons message', done: true },
      { name: 'Interactive list message (ListView)', done: true },
      { name: 'Poll message with options + voter tooltip', done: true },
      { name: 'Product / catalog message', done: true },
      { name: 'Order message with details', done: true },
      { name: 'Message reactions display', done: true },
      { name: 'Sticker message', done: true },
      { name: 'Voice-to-text transcription (TranscriptionView)', done: true },
      { name: 'Email subject line display (SubjectView)', done: true },
      { name: 'Unsupported message type fallback', done: true },
      { name: 'Deleted message reveal toggle', done: true },
      { name: 'AI clarify text view (ClarifyTextView)', done: true },
      { name: 'AOS eval popover (AI quality score per message)', done: true },

      // ── Compose ───────────────────────────────────────────────────────────
      { name: 'Compose bar (text input)', done: true },
      { name: 'File / attachment upload', done: true },
      { name: 'Attachment preview before send (AttachmentPreview)', done: true },
      { name: 'Message scheduling (date/time picker)', done: true },
      { name: 'Scheduled messages toggle/visibility', done: true },
      { name: 'Button builder in compose (up to 3)', done: true },
      { name: 'Template message selection', done: true },
      { name: 'Template variable input dialog (TemplateVariableInput)', done: true },
      { name: 'Signature editor and management', done: true },
      { name: 'Variable / dynamic text insertion', done: true },
      { name: 'Audio recording in compose', done: true },
      { name: 'Simple audio player in compose (SimpleAudioPlayer)', done: true },
      { name: 'Order message selector in compose (OrderMessageSelector)', done: true },
      { name: 'WhatsApp Pay / payment request (PaymentRequestor)', done: false },
      { name: 'WhatsApp Shop / catalog send', done: false },
      { name: 'WABA 24h messaging window status tooltip', done: true },
      { name: 'WABA Free Entry Point (FEP) window status tooltip', done: true },
      { name: 'Message window expired warning + template CTA', done: true },
      { name: 'Compose dropdown toolbar (emoji, attach, more options)', done: true },
      { name: 'Message flow warning modal (MsgFlowWarningModal)', done: true },
      { name: 'AI auto-suggest replies panel (useReplySuggestions)', done: true },
      { name: 'AI reply suggestion schedule option', done: true },
      { name: 'AI reply open chatbox action', done: true },

      // ── Message actions (per-message context menu) ────────────────────────
      { name: 'Message context menu', done: true },
      { name: 'Reply to message', done: true },
      { name: 'Forward message to other contacts', done: true },
      { name: 'Delete message (with confirmation)', done: true },
      { name: 'React to message', done: true },
      { name: 'Copy message text', done: true },
      { name: 'Star / bookmark message', done: true },
      { name: 'Reveal deleted message toggle', done: true },

      // ── Chat-level actions (profile actions menu) ─────────────────────────
      { name: 'Pin / unpin chat', done: true },
      { name: 'Mute / unmute notifications', done: true },
      { name: 'Mark as read / unread', done: true },
      { name: 'Archive / unarchive chat', done: true },
      { name: 'Clear all pending messages', done: true },
      { name: 'Clear all cancelled messages', done: true },
      { name: 'Refresh messages', done: true },
      { name: 'Export chat history (CSV)', done: true },
      { name: 'Export media of last 48 hours', done: true },
      { name: 'Export group members', done: false },
      { name: 'Delete chat', done: false },
      { name: 'Manage custom fields (from chat actions menu)', done: false },
      { name: 'Search within conversation toggle', done: false },

      // ── Bulk operations ───────────────────────────────────────────────────
      { name: 'Bulk action bar (select all)', done: true },
      { name: 'Bulk assign', done: true },
      { name: 'Bulk tag', done: true },
      { name: 'Bulk export', done: true },

      // ── Right panel — Contact profile (tabs) ──────────────────────────────
      { name: 'Contact profile side panel (collapsible)', done: true },
      { name: 'Profile tab — contact name (inline edit)', done: true },
      { name: 'Profile tab — phone number display', done: true },
      { name: 'Profile tab — assignee selector', done: true },
      { name: 'Profile tab — tag selector + add-to-contacts', done: true },
      { name: 'Profile tab — show all tags modal', done: true },
      { name: 'Profile tab — message metrics summary (MsgsMetricsView)', done: true },
      { name: 'Profile tab — custom fields accordion (display + edit)', done: true },
      { name: 'Profile tab — manage custom fields dialog', done: false },
      { name: 'Profile tab — active hours chart', done: true },
      { name: 'Profile tab — linked tickets / CRM board', done: true },
      { name: 'Profile tab — linked orders (EasySend)', done: true },
      { name: 'Profile tab — group participants list', done: true },
      { name: 'Profile tab — admin panel section (admin-only)', done: true },
      { name: 'Profile tab — drag-and-drop reorderable sections', done: false },
      { name: 'Notes tab (internal team notes)', done: true },
      { name: 'Automation tab — active automations list', done: true },
      { name: 'Automation tab — pending bot fire records', done: true },
      { name: 'Automation tab — pause / resume bot', done: true },
      { name: 'Automation tab — bot picker for manual trigger', done: true },

      // ── Compose extras ────────────────────────────────────────────────────
      { name: 'Internal note compose mode (toggle to send internal note vs message)', done: false },
      { name: 'Private reply action (reply privately to a comment/post)', done: false },

      // ── WA inline connection pages ────────────────────────────────────────
      { name: 'WA QR login page inline (scan QR inside inbox pane)', done: false },
      { name: 'WA phone + OTP login page inline', done: false },
      { name: 'WA connected success page inline', done: false },
      { name: 'WA creating / syncing account state inline', done: false },
      { name: 'TikTok login page inline (connect TikTok channel from inbox)', done: false },

      // ── Message extras ────────────────────────────────────────────────────
      { name: 'Note creator name display (show who wrote internal note)', done: false },
      { name: 'View-in-chat button on message (jump to message in full thread)', done: false },
      { name: 'Stop broadcast from chat actions menu', done: false },

      // ── Inbox Settings modal ──────────────────────────────────────────────
      { name: 'Inbox settings modal (gear icon)', done: true },
      { name: 'Setting — Incognito mode (read without marking read)', done: true },
      { name: 'Setting — Show channel name vs phone number', done: true },
      { name: 'Setting — Full date format toggle', done: true },
      { name: 'Setting — Hide scheduled messages toggle', done: true },
      { name: 'Setting — Include archived chats by default', done: true },
      { name: 'Setting — Warn on message flow edit', done: true },
      { name: 'Setting — AI auto-suggest replies toggle', done: true },

      // ── Misc ──────────────────────────────────────────────────────────────
      { name: 'Image lightbox / media viewer', done: true },
      { name: 'Message bubbles redesign (SaaS aesthetic)', done: true },
      { name: 'Profile image view', done: true },
    ],
    notes: 'Batch 2 complete (commit 8d6d2c6): Automation tab (active automations, scheduled bot actions, bot picker, pause/resume), InboxSettings (7 toggles: incognito, channel name, date format, hide scheduled, include archived, warn on flow edit, AI auto-suggest), Profile extras (show all tags modal, message metrics 2x2 grid, admin panel with copyable IDs + raw JSON). Remaining: WhatsApp Pay, catalog send, internal note compose mode, private reply, WA inline connection pages, profile drag-to-reorder.',
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
      { name: 'Linked messages / conversations on ticket', done: false },
      { name: 'Linked call logs on ticket', done: false },
      { name: 'AI analysis option on ticket', done: true },
      { name: 'Credit transaction history on ticket', done: true },
      { name: 'Stripe payment intents history on ticket (admin)', done: false },
      { name: 'Ticket more options menu (TicketMoreOptions)', done: false },
      { name: 'Stage update button (inline stage change on ticket)', done: false },
      { name: 'Board stage selector in ticket detail', done: false },
      { name: 'Contact selector in ticket detail', done: false },
      { name: 'Admin section on ticket (credit/Stripe/subscriptions, admin-only)', done: false },

      // Views (named saved views per board)
      { name: 'Multiple named views per board (create / rename / delete / duplicate)', done: false },
      { name: 'View settings dialog / slide-in panel', done: false },
      { name: 'View layout toggle (board vs list per view)', done: false },

      // Property management
      { name: 'Card property visibility management', done: true },
      { name: 'Table property visibility settings (column show/hide)', done: false },

      // Sorting / AI
      { name: 'Sort options (sort tickets by field)', done: false },
      { name: 'Assignee selector on ticket', done: true },
      { name: 'AI CRM profile integration (auto-fill contact data)', done: false },
      { name: 'AI CRM DISC profile breakdown (personality analysis per contact)', done: false },
      { name: 'Bulk move tickets bar (move selected tickets to stage)', done: false },
      { name: 'Ticket more-options menu (copy link, duplicate, delete)', done: false },
      { name: 'One-click next-stage arrow (inline advance ticket to next stage)', done: false },
      { name: 'Editable cells in list view (inline edit fields directly in table)', done: false },
      { name: 'Table sort via column headers (click header to sort)', done: false },
      { name: 'Message history bulk-patch (apply tag/assignee to past messages)', done: false },
      { name: 'Tag manager panel (create/edit/delete all tags globally)', done: false },
      { name: 'Custom fields manager panel (manage custom fields from CRM)', done: false },
      { name: 'Contact window (open contact details from contacts page)', done: false },
    ],
    notes: 'Contacts list, filters, active chips, bulk ops, export all done. Board/stage CRUD, drag-and-drop, ticket detail (5 tabs: notes, activity, AI, credits, assignee) all done. Missing: named views per board, ticket more-options menu, inline stage/contact selectors, admin section, table column visibility, AI CRM profile, bulk move bar, DISC analysis, tag/custom-field managers.',
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
      { name: 'Creating account modal (in-progress state during WABA setup)', done: false },
      { name: 'Advanced info section (channel metadata / debug info)', done: false },
      { name: 'Advanced info — copy channel ID', done: false },
      { name: 'Advanced info — sync past chats toggle', done: false },
      { name: 'Advanced info — unarchive on new message toggle', done: false },
      { name: 'Advanced info — auto-assign incoming (smart / round-robin / specific agent)', done: false },
      { name: 'Advanced info — auto-assign outgoing toggle', done: false },
      { name: 'Advanced info — auto transcribe voice messages toggle', done: false },
      { name: 'Advanced info — auto transcribe calls toggle', done: false },
      { name: 'Advanced info — send buttons as replies toggle', done: false },
      { name: 'Advanced info — welcome message config', done: false },
      { name: 'Advanced info — 24h window status display', done: false },
      { name: 'Advanced info — silence comments with category selector', done: false },
      { name: 'Advanced info — retain deleted team messages toggle', done: false },
      { name: 'Advanced info — nativeChatActionSync toggle', done: false },
      { name: 'Advanced info — WhatsApp Stories toggle', done: false },
      { name: 'Advanced info — geo location selector', done: false },
      { name: 'Advanced info — clear message queue action', done: false },
      { name: 'Advanced info — remove data (danger zone)', done: false },
      { name: 'Credit map display per channel type', done: false },
    ],
    notes: 'Full rebuild complete. Card grid with brand gradients, animated status dots, auto-polling, ConnectionAlertBanner, ReconnectModal (auto/QR/Facebook), ChannelStatusModal (Status/Limitations/Credits tabs), VerifyPhoneDialog, ChannelProfileDialog, IsvTermsDialog, SenderIdDialog, PendingMessagesModal all built. Missing: CreatingAccountModal, AdvancedInfo section (18 toggles/fields), credit map.',
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
      { name: 'Calls filter — My calls / Team calls toggle', done: false },
      { name: 'Calls filter — agent selector dropdown', done: false },
      { name: 'Calls filter — call type selector (inbound/outbound/missed)', done: false },
      { name: 'Calls filter — date range picker', done: false },
      { name: 'Twilio SDK integration', done: true },
      { name: 'Live call UI (in-call controls)', done: true },
      { name: 'Call from view — inline call initiation from contact profile (CallFromView)', done: false },
      { name: 'Calls card view — alternative card layout (CallsCardView)', done: false },
    ],
    notes: 'Full rebuild complete. CallPopup (dark floating overlay, mute/hold/hangup/timer/notes), CallUsingModal (channel selector + record toggle), VerifyNumberDialog (2-stage verification), ManageChannelsDialog (add/edit/delete channels), Zustand calls.store with Twilio Device lifecycle, quick-dial toolbar in list page. Missing: CallFromView (inline from contact profile), CallsCardView.',
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
      { name: 'Support analytics dialog (SupportAnalyticsDialog)', done: false },
      { name: 'WABA intro event listener (WABAIntroModal trigger on first WABA connect)', done: false },
    ],
    notes: 'Dashboard = the "getting-started" home page (route: /getting-started). Has header, trial banner, onboarding checklist, channel recs, exploring section, and quick KPI cards. Separate from the full Analytics page.',
  },

  analytics: {
    label: 'Analytics',
    icon: '📊',
    category: 'core',
    status: 'in-progress',
    progress: 95,
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
      { name: 'Request edit access (non-owner flow)', done: true },
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
      { name: 'Funnel chart widget', done: true },
      // Per-widget features
      { name: 'Per-widget metric breakdown (by user, tag, channel, automation)', done: true },
      { name: 'Per-widget filter popover', done: true },
      { name: 'Metric comparison: period vs previous period', done: true },
      { name: 'Per-widget CSV data export', done: true },
      { name: 'Widget-level error retry', done: true },
      // Performance tabs
      { name: 'Performance tabs header (Chat / Agent)', done: true },
      { name: 'Chat performance tab (widget grid)', done: true },
      { name: 'Agent performance tab (agent table)', done: true },
      { name: 'Marketing performance tab', done: true },
      { name: 'Sales performance tab', done: true },
      // Export / freshness
      { name: 'Dashboard PNG export (html-to-image)', done: true },
      { name: 'Last-refreshed live pulsating indicator (shows data freshness)', done: true },
      { name: 'Smart Analysis button (AI-driven insight generation per dashboard)', done: true },
      // Agent table columns
      { name: 'Agent performance table — agent name column', done: true },
      { name: 'Agent performance table — messages sent column', done: true },
      { name: 'Agent performance table — avg response time column', done: true },
      { name: 'Agent performance table — CSAT score column', done: true },
      { name: 'Agent performance table — resolved tickets column', done: true },
      { name: 'Agent performance table — active hours column', done: true },
      { name: 'Agent performance table — last active column', done: true },
      { name: 'Agent performance time period toggle (7d / 30d / custom)', done: true },
      // Metric tools
      { name: 'MetricTransformation view (derived/calculated metrics editor)', done: true },
      { name: 'AnalyticListLayoutViewer (table layout for list metrics)', done: true },
      { name: 'V1 → V2 migration dialog (migrate old dashboard configs)', done: true },
      { name: 'Unsupported viewport state (mobile/tablet warning overlay)', done: true },
      { name: 'Analytics filter popover (advanced filter for analytics data)', done: false },
    ],
    notes: 'Batch 2 complete (commit 3113746): funnel chart widget, PerformanceTabs (Chat/Marketing/Sales), SmartAnalysisPanel, LastRefreshedIndicator, RequestEditAccessBanner, MetricTransformationEditor, AnalyticListLayoutViewer, V1MigrationDialog, UnsupportedViewportOverlay, agent table rebuilt with 7 new columns + 7d/30d/custom period toggle. Remaining: analytics filter popover (advanced).',
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
      { name: 'Keyword reply — channel scope selector', done: false },
      { name: 'Keyword reply — row-level enable/disable toggle', done: false },
      { name: 'Keyword reply — detection mechanism selector (exact/contains/regex/NLP)', done: false },
      { name: 'Keyword reply — multi-keyword input (add multiple triggers)', done: false },
      { name: 'Keyword reply — flow picker (attach message flow to keyword)', done: false },
      { name: 'Default reply option', done: true },
      { name: 'Keyword reply content editor', done: true },
      { name: 'Advanced settings — active/inactive toggle', done: true },
      { name: 'Advanced settings — only respond to assigned chats toggle', done: false },
      { name: 'Advanced settings — ignore if bot active toggle', done: false },
      { name: 'Advanced settings — only if no team member replied toggle', done: false },
      { name: 'Advanced settings — include groups toggle', done: false },
      { name: 'Advanced settings — respond to groups only toggle', done: false },
      { name: 'Advanced settings — only if contact tag matches toggle', done: false },
      { name: 'Advanced settings — time frame (day + hour ranges)', done: true },
      { name: 'Copy time frames between days', done: true },
      { name: 'Keyword execution history modal', done: true },
      { name: 'Offline bot — same advanced settings as keyword reply', done: false },

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
      { name: 'Conflict detection (concurrent edit detection)', done: false },
      { name: 'Flow analytics / performance metrics', done: true },
      { name: 'Flow analytics — total triggered count', done: false },
      { name: 'Flow analytics — completion rate %', done: false },
      { name: 'Flow analytics — step-by-step drop-off funnel', done: false },
      { name: 'Flow analytics — per-instance run history', done: false },
      { name: 'Flow analytics — trigger history progress bar', done: false },
      { name: 'AI flow builder interface', done: true },
      { name: 'AI builder — generate flow from prompt action', done: false },
      { name: 'AI builder — regenerate / refine action', done: false },
      { name: 'AI builder — apply generated flow action', done: false },
      { name: 'AI builder — discard / cancel action', done: false },

      // Extra nodes
      { name: 'App integration node (connect external service action)', done: false },
      { name: 'Shape / annotation node (visual labels on canvas)', done: false },
      { name: 'Phone number node (EditPhoneNumberNode)', done: false },

      // Extra flow-level dialogs / modals
      { name: 'Share bot / flow modal (generate shareable link or QR)', done: false },
      { name: 'Flow metadata modal (name, industry, language, thumbnail)', done: false },
      { name: 'Global bot preview modal (preview flow response in-app)', done: false },
      { name: 'Flow save errors modal (validation summary before save)', done: false },
      { name: 'Create / rename bot modal', done: false },
      { name: 'Select existing form modal (attach form to flow node)', done: false },
      { name: 'Zapier automation modal (link Zap to flow action)', done: false },
      { name: 'Export flow confirmation modal', done: false },
      { name: 'Selection context menu (right-click multi-node operations)', done: false },

      // Collaboration / UX
      { name: 'Guided tour / onboarding tour for flow builder', done: false },
      { name: 'Comments / collaboration panel on flow', done: false },
      { name: 'Attachments and media effects panel (for message nodes)', done: false },
      { name: 'Customization menu (flow-level visual customization)', done: false },
      { name: 'Download flow as image (PNG export of canvas)', done: false },
      { name: 'Recipients list panel (contacts enrolled in flow)', done: false },
      { name: 'AutomationHub tab router (hub landing page with tabs)', done: false },
      { name: 'Flow category selector (assign category to flow)', done: false },
      { name: 'Manage categories dialog (CRUD flow categories)', done: false },
      { name: 'URL node distinct from webhook node (separate implementations)', done: false },

      // Template approval
      { name: 'Template approval flow (submit / approve WABA templates)', done: false },

      // Survey
      { name: 'Survey popup node (in-flow NPS / survey trigger, distinct from form node)', done: false },
    ],
    notes: 'Keyword reply, visual builder (9 nodes), AI builder all done. Missing: AppNode, ShapeNode, PhoneNumberNode, ShareBotModal, FlowMetaDataModal, GlobalPreviewModal, SaveErrorsModal, RenameBotModal, ZapierModal, GuidedTour, CommentsPanel, template approval flow, survey popup, recipients list, download-as-image, category manager, AutomationHub.',
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
      { name: 'Contact active hours section (best send time per contact)', done: false },
      { name: 'Advanced settings config (sender rotation, retry logic)', done: false },
      { name: 'Basic settings config (name, schedule, channel — step component)', done: false },
      { name: 'Select contacts section (audience builder with segment preview)', done: false },
      { name: 'Stop broadcast action (halt in-progress broadcast)', done: false },
      { name: 'Edit broadcast (modify a scheduled/pending broadcast)', done: false },
      { name: 'View broadcast overview nav button (jump to broadcast detail)', done: false },
      { name: 'Recipients modal — total recipient count', done: false },
      { name: 'Recipients modal — delivered count', done: false },
      { name: 'Recipients modal — failed count', done: false },
      { name: 'Recipients modal — contact list per status', done: false },
      { name: 'Pause / resume broadcast countdown timer', done: false },
      { name: 'WABA tier warning + live tier count display', done: false },
      { name: 'Timezone-aware send window (send within active hours per contact tz)', done: false },
    ],
    notes: 'All analytics and speed features done. Missing: contact active hours, advanced settings (sender rotation, retry), stop/edit/view broadcasts, recipients modal detail, pause/resume countdown, WABA tier warning, timezone-aware window.',
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
      // ── Forms ─────────────────────────────────────────────────────────────
      { name: 'Forms list panel', done: true },
      { name: 'Form detail dialog', done: true },
      { name: 'Create form dialog', done: true },
      { name: 'Form question add / edit (per-question type config)', done: false },
      { name: 'Form question types (text, multiple choice, rating, date)', done: false },
      { name: 'Form question type — NPS (net promoter score)', done: false },
      { name: 'Form question type — time picker', done: false },
      { name: 'Form auto-name on create (generate name from first question)', done: false },
      { name: 'Question type picker popover (visual type selector with icons)', done: false },
      { name: 'Auto-create flow on first form save (trigger flow from form)', done: false },
      { name: 'Form cover image upload', done: false },
      { name: 'Conditional question logic (ConditionsModal — show/hide based on answer)', done: false },
      { name: 'Form preview (live render before publish)', done: false },
      { name: 'View form submissions', done: true },
      { name: 'Form submissions CSV export', done: false },
      { name: 'Form submissions dynamic columns table', done: false },
      { name: 'Form submission analytics', done: false },
      { name: 'Share / embed form link (copy URL / embed snippet)', done: false },
      { name: 'Form template selection', done: false },
      { name: 'Submit form public page (Forms/SubmitForm — user-facing form fill)', done: false },

      // ── QR Code ───────────────────────────────────────────────────────────
      { name: 'QR code generator panel', done: true },
      { name: 'QR code type selector (default vs custom)', done: false },
      { name: 'QR promotional message input', done: false },
      { name: 'QR background photo upload', done: false },
      { name: 'QR dimension preset selector (Instagram post/story, Facebook post, custom)', done: false },
      { name: 'QR font / text color picker', done: false },
      { name: 'QR channel selector (pick which channel the QR links to)', done: false },
      { name: 'iOS QR code download', done: false },
      { name: 'Android QR code download', done: false },

      // ── Widget builder ────────────────────────────────────────────────────
      { name: 'Widget builder panel', done: true },
      { name: 'Widget basic settings (greeting text, position, brand color)', done: false },
      { name: 'Widget header content color picker', done: false },
      { name: 'Widget header background color picker', done: false },
      { name: 'Widget CTA text input', done: false },
      { name: 'Widget CTA text color picker', done: false },
      { name: 'Widget CTA background color picker', done: false },
      { name: 'Widget save-first state (must save before preview)', done: false },
      { name: 'Widget section validation checkmarks (visual tick per completed section)', done: false },
      { name: 'Widget channel selector (pick channels to show in widget)', done: false },
      { name: 'Widget brand icon upload', done: false },
      { name: 'Widget header caption text', done: false },
      { name: 'Widget pre-filled text (default message in chat input)', done: false },
      { name: 'Widget button text field', done: false },
      { name: 'Widget button icon color picker', done: false },
      { name: 'Widget button position selector (bottom-left / bottom-right)', done: false },
      { name: 'Widget button settings (CTA label, icon)', done: false },
      { name: 'Widget info / platform setup instructions', done: false },
      { name: 'Widget code preview / copy snippet', done: false },

      // ── Zapier ────────────────────────────────────────────────────────────
      { name: 'Zapier panel', done: true },
      { name: 'Zapier OAuth flow (TokenRedirectHandler)', done: false },
      { name: 'Zapier token management (revoke / refresh)', done: false },
      { name: 'Zapier full-experience web component embed', done: false },

      // ── Custom fields ─────────────────────────────────────────────────────
      { name: 'Custom fields manager (list + reorder)', done: false },
      { name: 'Add / edit custom field (AddEditCustomField — type, label, required)', done: false },
      { name: 'Custom field type components (text, number, date, select, checkbox)', done: false },
      { name: 'Custom field type — link (URL field)', done: false },
      { name: 'Custom field type — attachment (file upload field)', done: false },
      { name: 'Custom field type — team member (assignee field)', done: false },
      { name: 'Custom field type — phone number field', done: false },
      { name: 'Custom field type — timestamp field', done: false },
      { name: 'Custom field — allow decimals toggle (for number type)', done: false },
      { name: 'Custom field — options list editor (add/edit/delete options for select type)', done: false },
      { name: 'Custom field — name uniqueness validation', done: false },
      { name: 'Custom field — display layout toggle (inline vs block in profile)', done: false },
      { name: 'Custom field — pinned fields (pin to top of profile section)', done: false },
      { name: 'Custom field — inline add from contact profile panel', done: false },
      { name: 'Custom fields in inbox contact profile', done: false },
      { name: 'Custom fields in CRM tickets', done: false },

      // ── Coupon campaigns ──────────────────────────────────────────────────
      { name: 'Coupon campaigns list', done: false },
      { name: 'Create / edit coupon campaign (AddEditCouponCampaign)', done: false },
      { name: 'View coupon campaign detail (ViewCouponCampaign)', done: false },
      { name: 'Coupon display / card view (CouponDisplay)', done: false },
      { name: 'Coupon display mode — barcode', done: false },
      { name: 'Coupon display mode — QR code', done: false },
      { name: 'Coupon serial number toggle', done: false },
      { name: 'Coupon expiry date picker', done: false },
      { name: 'Coupon limit to contacts (upload CSV of eligible contacts)', done: false },
      { name: 'Coupon import codes from CSV', done: false },
      { name: 'Coupon redemption URL per code', done: false },
      { name: 'Coupon export redemption URLs as CSV', done: false },
      { name: 'Coupon hero image upload', done: false },
      { name: 'Coupon background color picker', done: false },
      { name: 'Coupon description text', done: false },
      { name: 'Coupon redeem button CTA', done: false },
      { name: 'Coupon view codes dialog (list all generated codes)', done: false },
      { name: 'Coupon redemption settings', done: false },
      { name: 'Coupon terms and conditions config', done: false },
      { name: 'Redeem coupon interface (public redemption page)', done: false },
    ],
    notes: 'Forms, QR, Widget, Zapier panels exist as shells. All sub-feature detail (form question types/conditions/preview/analytics, QR type/promo/dimensions/colors, widget config 15 fields, Zapier OAuth+embed, custom field CRUD+7 types+pin/layout, coupon CRUD+display modes+CSV+redemption) not yet rebuilt.',
  },

  ai: {
    label: 'AI / Chatbot',
    icon: '🤖',
    category: 'tools',
    status: 'done',
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
      { name: 'KB test — text input field', done: false },
      { name: 'KB test — response display panel', done: false },
      { name: 'KB source table — file sources vs URL sources split view', done: false },
      { name: 'KB source — upload status indicator (uploading / ready / failed)', done: false },
      { name: 'KB source — retry failed upload button', done: false },
      { name: 'KB source — creation date display', done: false },
      { name: 'KB source — supported extensions list', done: false },
      { name: 'KB source — drag-and-drop dropzone', done: false },
      { name: 'KB source — storage size display', done: false },
      { name: 'KB — collapsible sections layout', done: false },

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

      { name: 'Chatbot system prompt textarea', done: false },
      { name: 'Chatbot fallback message config', done: false },
      { name: 'Chatbot AI assistant toggle (enable/disable AI responses)', done: false },
      { name: 'Chatbot ID display (copy chatbot ID)', done: false },
      { name: 'Link chatbot — auto-reply toggle per channel', done: false },
      { name: 'Link chatbot — include sources in reply toggle', done: false },
      { name: 'Link chatbot — assign to teammate option', done: false },
      { name: 'Chatbot training status badge (training / ready / failed)', done: false },
      { name: 'Chatbot website crawl URL validation', done: false },

      // Extra
      { name: 'KB test / query interface (test KB with sample questions)', done: false },
      { name: 'Enhanced intro — sticky CTA (EnhancedIntro StickyCTA)', done: false },
      { name: 'Enhanced intro — setup flow compact view (SetupFlowCompact)', done: false },
      { name: 'AI chatbot provider context (multi-bot session management)', done: false },
    ],
    notes: 'Full rebuild complete. KB: sources table, file upload with progress, website crawl with depth selector. Chatbot: card grid, edit drawer (5 tabs: data sources, settings, link channels, test chat, offline bot), NLP/intent config, channel linking, team assignment, offline schedule. AI CRM panel with GPT model selector. 8 agent templates modal. Missing: KB test interface, EnhancedIntro, multi-bot provider context.',
  },

  appstore: {
    label: 'App Store',
    icon: '🏪',
    category: 'tools',
    status: 'done',
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
      { name: 'Integration detail / deep config pages (per-app custom settings)', done: false },
      { name: 'App store — All / Installed tab toggle', done: false },
      { name: 'App store — list / card view toggle', done: false },
      { name: 'App store — search bar', done: false },
      { name: 'App store — country filter sidebar', done: false },
      { name: 'App store — filter toggle (show/hide filter panel)', done: false },
      { name: 'App store — sort-by selector', done: false },
      { name: 'App service list — service name display', done: false },
      { name: 'App service list — service description', done: false },
      { name: 'App service list — service icon', done: false },
      { name: 'App service list — service category tag', done: false },
      { name: 'App service list — connect / disconnect button', done: false },
      { name: 'Notifications live preview panel (real-time webhook event log)', done: false },
      { name: 'Notification service category filter', done: false },
      { name: 'Service setup instructions — step-by-step guide', done: false },
      { name: 'Service setup instructions — copy webhook URL step', done: false },
      { name: 'Service setup instructions — test connection step', done: false },
      { name: 'EasySend show data points toggle', done: false },
      { name: 'Chrome extension — logged out state', done: false },
      { name: 'Chrome extension — logging in state', done: false },
      { name: 'Chrome extension — logged in state (token display)', done: false },
      { name: 'OAuth modal error state (failed authorization message)', done: false },
      { name: 'Trigger condition diagnostics test panel', done: false },
      { name: 'Trigger condition — add condition group button', done: false },
      { name: 'Payment integrations config', done: true },
      { name: 'EasySend records view (order/payment record history)', done: false },
      { name: 'Add default trigger for notification services', done: false },
    ],
    notes: 'Full rebuild complete. 18-app catalog with category + country filters, 5-step installer drawer (overview, permissions, config, OAuth, complete), OAuth modal with callback URL handler, installed apps card list with toggle/remove/update checks, payment integrations grid (15 providers, country flags, connect/toggle), Chrome extension panel with masked token + copy + install steps. Missing: deep config pages, EasySend records view, default trigger setup, All/Installed tabs, list/card toggle, search bar, country filter, service list details, notification preview panel, condition diagnostics.',
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
      // ── Orders ───────────────────────────────────────────────────────────
      { name: 'Orders list panel', done: true },
      { name: 'Order detail drawer', done: true },
      { name: 'Order detail — order info section (items, quantities, prices)', done: false },
      { name: 'Order detail — shipping info section (address, method)', done: false },
      { name: 'Order detail — payment info section (method, status)', done: false },
      { name: 'Order detail — payment status chip (paid/pending/failed)', done: false },
      { name: 'Order detail — order total display', done: false },
      { name: 'Order detail — order note popover', done: false },
      { name: 'Order status chips display (visual status tags per order)', done: false },
      { name: 'Order filter — status filter', done: false },
      { name: 'Order filter — date range filter', done: false },
      { name: 'Order filter — channel filter', done: false },
      { name: 'Order filter — assignee filter', done: false },
      { name: 'Order active filter chips display', done: false },
      { name: 'Order status tracking workflow', done: false },
      { name: 'Custom order menu (custom order type configuration)', done: false },
      { name: 'Order table item row (OrderTableItem — compact row renderer)', done: false },

      // ── Products ──────────────────────────────────────────────────────────
      { name: 'Products list panel', done: true },
      { name: 'Create / edit product dialog', done: true },
      { name: 'Product image / media upload', done: false },
      { name: 'Product categories management (ManageCategories)', done: false },
      { name: 'Product category selector (ProductCategorySelect)', done: false },
      { name: 'Product pricing and currency selector', done: false },
      { name: 'Product import from CSV (ProductImportCsv)', done: false },
      { name: 'Product starting stock vs current stock label', done: false },
      { name: 'Product import from outside platform (OutsidePlatformImport)', done: false },
      { name: 'Product Shopify import', done: false },
      { name: 'Product WooCommerce import', done: false },
      { name: 'Product visibility / status toggle', done: false },

      // ── Shop setup ────────────────────────────────────────────────────────
      { name: 'Shop setup / onboarding wizard (multi-step stepper)', done: false },
      { name: 'Shop setup — start screen with platform comparison', done: false },
      { name: 'Shop setup — differences info boxes (native vs external)', done: false },
      { name: 'Shop setup — success screen after setup complete', done: false },
      { name: 'Shop profile / settings modal (ShopSettingsModal)', done: false },
      { name: 'Shop type selection (ProductShopType)', done: false },
      { name: 'Create shop metadata (initial store config — name, logo, description)', done: false },
      { name: 'Shop dashboard with URL display + copy', done: false },
      { name: 'Shop dashboard — embedded storefront iframe preview', done: false },
      { name: 'Shop management panel (payments, products, shipping, details tabs)', done: false },
      { name: 'Shop management — save + image upload button', done: false },
      { name: 'Shop management — shop notice text field', done: false },
      { name: 'Shop management — shop phone number selector', done: false },
      { name: 'Shop details section (ShopDetails — logo, name, description edit)', done: false },
      { name: 'Shipping — enable shipping toggle', done: false },
      { name: 'Shipping — fee options list (free/flat/per-item/by-weight)', done: false },
      { name: 'Shipping — per-fee config (name, price, conditions)', done: false },
      { name: 'Payments — country selector', done: false },
      { name: 'Payments — gateway logo + name list', done: false },
      { name: 'Payments — connect / remove per gateway', done: false },
      { name: 'Products onboarding step (ProductsOnboarding)', done: false },

      // ── Payments ──────────────────────────────────────────────────────────
      { name: 'Payments panel', done: true },
      { name: 'Payment processing setup (provider selection + credentials)', done: false },
      { name: 'Stripe integration', done: false },

      // ── Shipping ──────────────────────────────────────────────────────────
      { name: 'Shipping panel', done: true },
      { name: 'Shipping details configuration (ShippingDetails)', done: false },

      // ── Subscriptions ─────────────────────────────────────────────────────
      { name: 'Subscriptions / billing cycles (Subscriptions module)', done: false },
      { name: 'Subscriptions — credit vs non-credit billing routing', done: false },
      { name: 'Subscriptions — billing tabs (usage-plan / purchase-history / transactions)', done: false },
      { name: 'Subscriptions — CSV export', done: false },
      { name: 'Subscriptions — filter popover', done: false },
      { name: 'Subscriptions — credit details card', done: false },
      { name: 'Subscriptions — cancel plan button', done: false },
      { name: 'Subscriptions — payment settings link', done: false },
      { name: 'Subscriptions — refresh credits button', done: false },
      { name: 'Subscriptions — auto-renewal status display', done: false },
      { name: 'Subscriptions — coupon savings display', done: false },
      { name: 'Subscriptions — top-up link', done: false },
      { name: 'Subscriptions — view recurring link', done: false },
      { name: 'Subscriptions — support plan card', done: false },
      { name: 'Subscriptions — schedule training button', done: false },
      { name: 'Subscriptions — coupon details display', done: false },
      { name: 'Subscriptions — subscription data table', done: false },
      { name: 'Subscriptions — non-credit billing view', done: false },
      { name: 'Subscriptions — plan state chip (active/trial/expired/cancelled)', done: false },
      { name: 'Subscriptions — features card (per-feature limits)', done: false },
      { name: 'Subscriptions — marquee plan card', done: false },
      { name: 'Subscriptions — invoice URL link', done: false },
      { name: 'Subscriptions — credit gain status chip', done: false },
    ],
    notes: 'Orders, products (basic), payments, shipping panels exist as shells. Missing: full order workflow (status chips, 4 filters, detail sections, note popover), product categories, CSV import, Shopify/WooCommerce import, shop onboarding wizard (start/differences/success screens), ShopSettingsModal, shop management (save button, notice, phone selector, shipping fees, payment gateways), subscriptions (23 sub-features).',
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
      { name: 'Generate API token modal (GenerateTokenModal)', done: false },
      { name: 'API token list (show / copy / revoke tokens)', done: false },
      { name: 'Add / edit API token drawer (ApiToken/AddEdit)', done: false },
      { name: 'Webhook URL display and management (Developer → Webhooks tab)', done: false },
      { name: 'Developer — webhooks sub-tab', done: false },
      { name: 'Developer — API Docs button (link to API documentation)', done: false },
      { name: 'Developer — responsive dropdown (mobile-friendly tab nav)', done: false },
      { name: 'Create / edit webhook modal (UpsertWebhookModal)', done: false },
      { name: 'Webhook credentials management', done: false },
      { name: 'OAuth modal for external apps', done: false },
      { name: 'App notifications settings (nested notification table with per-event toggles)', done: false },
      { name: 'App notifications — 6 event category sections', done: false },
      { name: 'App notifications — per-event destination toggles (push/email/in-app)', done: false },
      { name: 'App notifications — per-event account selector', done: false },
      { name: 'App notifications — 3 push/browser permission warnings', done: false },
      { name: 'App notifications — non-member notice (if not in team)', done: false },
      { name: 'Notification walkthrough / setup guide (NotificationWalkThrough)', done: false },
      { name: 'Quick replies management (Settings/QuickReplies — create / edit / delete)', done: false },
      { name: 'Reset password modal', done: false },
      { name: 'Credit display / credit map', done: false },
      { name: 'External platform manager (e-commerce platform connections)', done: false },
      { name: 'Support service setup', done: false },
      { name: 'Billing version switch toggle (switch between billing v1 and v2)', done: false },
      { name: 'Plan migration modal (migrate to new credit-based billing)', done: false },
      { name: 'Subscriptions tab (non-credit billing view)', done: false },
    ],
    notes: 'All 6 main tabs exist. Missing detail: token generation + list + drawer, webhook CRUD, notification walkthrough, quick replies, reset password, credit map, external platform manager, plan migration modal.',
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
      // Announcements detail
      { name: 'Announcements — markdown editor (MarkdownEditor)', done: false },
      { name: 'Announcements — action button config (ActionButton)', done: false },
      { name: 'Announcements — more settings section (MoreSettings)', done: false },
      { name: 'Announcements — preview modal (PreviewModal)', done: false },

      // Users detail
      { name: 'Users — edit team membership dialog (EditTeamMembership)', done: false },
      { name: 'Users — partnership selector dropdown', done: false },
      { name: 'Users — contact details view (ContactDetails)', done: false },
      { name: 'Users — team selector dropdown (TeamSelector)', done: false },

      // Coupons detail
      { name: 'Coupons — add coupon form (AddCoupon)', done: false },
      { name: 'Coupons — redemption list view', done: false },

      // Credits detail
      { name: 'Credits — credit details card (CreditDetailsCard)', done: false },
      { name: 'Credits — manage support plan (ManageSupportPlan)', done: false },
      { name: 'Credits — migrate credits modal (MigrateModal)', done: false },

      // Preferences detail
      { name: 'Preferences — notification preference table', done: false },
      { name: 'Preferences — Stripe preferences panel', done: false },
      { name: 'Preferences — purchase tier preferences', done: false },
      { name: 'Preferences — recurring consumption preferences', done: false },
      { name: 'Preferences — single consumption preferences', done: false },
      { name: 'Preferences — unlock preferences', done: false },
      { name: 'Preferences — misc preferences section', done: false },

      // Teams detail
      { name: 'Teams — add/edit dialog (Details tab)', done: false },
      { name: 'Teams — add/edit dialog (Members tab)', done: false },
      { name: 'Teams — add/edit dialog (Subscriptions tab)', done: false },
      { name: 'Teams — add/edit dialog (Features tab)', done: false },
      { name: 'Teams — add/edit dialog (Onboarding tab)', done: false },
      { name: 'Teams — resubmit templates card', done: false },
      { name: 'Teams — make / downgrade partner admin', done: false },
      { name: 'Teams — credit customer info panel', done: false },

      // Admin Channels detail
      { name: 'Admin Channels — team filter dropdown', done: false },
      { name: 'Admin Channels — account type filter', done: false },
      { name: 'Admin Channels — WABA quality rating display', done: false },
      { name: 'Admin Channels — channel state badge', done: false },
      { name: 'Admin Channels — CSV export', done: false },

      // Standalone panels
      { name: 'Plan tracking panel (new — monitor plan usage across teams)', done: false },
      { name: 'Plan tracking — total plans active count', done: false },
      { name: 'Plan tracking — plans expiring soon count', done: false },
      { name: 'Plan tracking — trial to paid conversion rate', done: false },
      { name: 'Plan tracking — plan tier distribution chart', done: false },
      { name: 'Plan tracking — team list with plan state', done: false },
      { name: 'Plan tracking — filter by plan type', done: false },
      { name: 'Plan tracking — CSV export', done: false },

      // Company analytics
      { name: 'Company analytics — paid teams count', done: false },
      { name: 'Company analytics — WABA teams table', done: false },
      { name: 'Company analytics — CSV export', done: false },
      { name: 'Company analytics — date range filter', done: false },

      // Company insights
      { name: 'Company insights — region breakdown', done: false },
      { name: 'Company insights — industry breakdown', done: false },
      { name: 'Company insights — team size distribution', done: false },
      { name: 'Company insights — growth trend chart', done: false },
      { name: 'Company insights — top teams list', done: false },

      // Pricing editor
      { name: 'Pricing editor (plan JSON management, sections)', done: false },
      { name: 'Pricing editor — 7 section tabs', done: false },
      { name: 'Pricing editor — tier selector', done: false },
      { name: 'Pricing editor — save action', done: false },
      { name: 'Pricing editor — reset to default action', done: false },
      { name: 'Pricing editor — preview action', done: false },
      { name: 'Pricing editor — publish action', done: false },

      // Surveys
      { name: 'Survey management (list + add/edit surveys)', done: false },
      { name: 'Survey — question list', done: false },
      { name: 'Survey — add/edit question dialog', done: false },
      { name: 'Survey — response list view', done: false },
      { name: 'Survey — CSV export responses', done: false },

      // Template approval detail
      { name: 'Template approval — pending list', done: false },
      { name: 'Template approval — approve/reject action', done: false },
      { name: 'Template approval — rejection reason input', done: false },
      { name: 'Template approval — batch approve', done: false },

      // Preferences detail
      { name: 'Preferences — tier tabs (tier1/tier2/tier3/custom)', done: false },
      { name: 'Preferences — inline edit fields', done: false },
      { name: 'Preferences — grouped layout sections', done: false },
      { name: 'Preferences — credit limits dialog', done: false },
      { name: 'Preferences — message rate dialog', done: false },
      { name: 'Preferences — feature flags dialog', done: false },
      { name: 'Preferences — storage limits dialog', done: false },
      { name: 'Preferences — custom plan dialog', done: false },

      // Announcements extra
      { name: 'Announcements — basic settings section (title, type, visibility)', done: false },

      // Feature updates
      { name: 'Feature updates panel (FeatureUpdates)', done: false },
      { name: 'Team data analytics (benchmarks, export modal, filters)', done: false },
    ],
    notes: 'All 10 base panels present. Missing detail: Announcements (markdown, action button, more settings, preview, basic settings), Users (membership edit, partnership, contact details, team selector), Credits (details card, support plan, migrate modal), Preferences (tier tabs, inline edit, 5 dialog types), Teams (5 add/edit tabs, resubmit templates, partner admin, credit info), Admin Channels (5 filters/badges), Plan Tracking (7 items, entirely new), Company Analytics (4), Company Insights (5), Pricing Editor (7 tabs+4 actions), Surveys (5), Template Approval (4).',
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
      // Notification list + detail
      { name: 'Notification / webhook service list (ListLayout with tracked services)', done: false },
      { name: 'View notification / webhook detail (ViewNotifications)', done: false },
      // Add / edit flow
      { name: 'Add / edit notification container (multi-step setup)', done: false },
      { name: 'Add / edit notification sections (NotificationSettingsRender)', done: false },
      { name: 'Shop selection render (ShopSelectionRender — link to shop)', done: false },
      // Triggers
      { name: 'Trigger accordion (expand event types per service)', done: false },
      { name: 'Trigger condition section (add / edit condition groups)', done: false },
      { name: 'Condition row (field / operator / value per rule)', done: false },
      { name: 'Condition diagnostics (test / validate conditions)', done: false },
      { name: 'Add default trigger (auto-populate default events on create)', done: false },
      // Credentials / URL
      { name: 'Show webhook URL dialog (copy webhook endpoint)', done: false },
      { name: 'Update credentials dialog (enter API keys for service)', done: false },
      { name: 'Service setup instructions modal (per-platform setup guide)', done: false },
      { name: 'Add supported service dialog', done: false },
      // Platform integrations
      { name: 'Shopify integration', done: false },
      { name: 'WooCommerce integration', done: false },
      { name: 'Shopee integration', done: false },
      { name: 'Shopline integration', done: false },
      { name: 'Shopage integration', done: false },
      { name: 'Mshop integration', done: false },
      { name: 'Tayarlo integration', done: false },
      { name: 'Tokopedia integration', done: false },
      { name: 'Hotmart integration', done: false },
      { name: 'Lazada integration', done: false },
      { name: 'ShoplineGlobal integration', done: false },
      { name: 'Google Form integration', done: false },
      { name: 'Stripe via webhooks integration', done: false },
      { name: 'Razorpay integration', done: false },
      { name: 'Google Calendar integration', done: false },
      { name: 'Calendly integration', done: false },
      { name: 'Booknetic integration', done: false },
      { name: 'Hostex integration', done: false },
      { name: 'Add/edit notification — credentials section', done: false },
      { name: 'Add/edit notification — event type selector', done: false },
      { name: 'Add/edit notification — message template config', done: false },
      { name: 'Add/edit notification — test send button', done: false },
      { name: 'Add/edit notification — contact tag filter', done: false },
      { name: 'Add/edit notification — assignee filter', done: false },
      { name: 'Add/edit notification — channel selector', done: false },
      { name: 'Notification list — last triggered date', done: false },
      { name: 'Notification list — event type badge', done: false },
      { name: 'Notification list — status badge (active/paused)', done: false },
      { name: 'Notification list — trigger count display', done: false },
      { name: 'Notification list — quick toggle (enable/disable row)', done: false },
      { name: 'Chrome extension login component (from notifications page)', done: false },
      { name: 'EasySend records view (order/payment log)', done: false },
      { name: 'OAuth callback handler (external service auth redirect)', done: false },
      { name: 'Shop images management (ShopImages)', done: false },
      // App-wide
      { name: 'Real-time notification badge (app-wide unread count)', done: false },
      { name: 'External platform manager banner', done: false },
    ],
    notes: 'Only app notification settings tab built. Full e-commerce webhook module (service list, add/edit flow, trigger/condition UI, 18 platform integrations, credentials dialogs, OAuth handler, notification list extras) not started.',
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
      // Signup / auth scenes
      { name: 'Signup phone scene (enter phone number)', done: false },
      { name: 'Signup OTP scene (SignupOtpScene — verify phone)', done: false },
      { name: 'OTP verification (SMS + email)', done: false },
      { name: 'Forget password flow', done: false },
      // Onboarding wizard scenes
      { name: 'Onboarding role scene (what is your role)', done: false },
      { name: 'Onboarding goals scene (what do you want to achieve)', done: false },
      { name: 'Onboarding business — company name scene', done: false },
      { name: 'Onboarding business — industry scene', done: false },
      { name: 'Onboarding business — team size scene', done: false },
      { name: 'Onboarding business — website scene', done: false },
      { name: 'Onboarding channels scene (connect first channel step)', done: false },
      { name: 'Onboarding sources scene (how did you hear about us)', done: false },
      { name: 'Onboarding team invite scene', done: false },
      { name: 'Onboarding customising scene (personalisation step)', done: false },
      { name: 'Company information setup (CompanyInformation.tsx)', done: false },
      { name: 'Get phone number modal (GetPhoneNumberModal)', done: false },
      { name: 'Notification setup step (NotificationSetup)', done: false },
      // Onboardingv2 wizard
      { name: 'Onboardingv2 — scene 1: welcome / intro', done: false },
      { name: 'Onboardingv2 — scene 2: signup / account creation', done: false },
      { name: 'Onboardingv2 — scene 3: company details', done: false },
      { name: 'Onboardingv2 — scene 4: team size', done: false },
      { name: 'Onboardingv2 — scene 5: industry selection', done: false },
      { name: 'Onboardingv2 — scene 6: goals selection', done: false },
      { name: 'Onboardingv2 — scene 7: connect first channel', done: false },
      { name: 'Onboardingv2 — scene 8: invite teammates', done: false },
      { name: 'Onboardingv2 — scene 9: completion / success', done: false },
      { name: 'Onboardingv2 — layout: scene progress indicator', done: false },
      { name: 'Onboardingv2 — layout: back / next navigation', done: false },
      { name: 'Onboardingv2 — layout: step skip option', done: false },
      { name: 'Onboardingv2 — layout: scene animation system', done: false },
      { name: 'Onboardingv2 — layout: mobile connection popup', done: false },
      { name: 'Onboardingv2 — layout: scene director (orchestrates scene order)', done: false },

      // Legacy AuthOnboarding
      { name: 'AuthOnboarding animation system (framer-motion scene transitions)', done: false },
      { name: 'AuthOnboarding MobileConnectionPopup', done: false },
      { name: 'AuthOnboarding SceneDirector', done: false },

      // Legacy 3-step Onboarding
      { name: 'Legacy onboarding step 1 (channel connect)', done: false },
      { name: 'Legacy onboarding step 2 (invite team)', done: false },
      { name: 'Legacy onboarding step 3 (trial summary)', done: false },

      // Coexist extras
      { name: 'Coexist — progress indicator between scenes', done: false },
      { name: 'Coexist — error handling per scene', done: false },
      { name: 'Coexist — back navigation between steps', done: false },
      { name: 'Coexist — resume interrupted migration session', done: false },

      // Coexist / migration
      { name: 'Coexist landing scene (migration entry point)', done: false },
      { name: 'Coexist platform scene (pick source platform)', done: false },
      { name: 'Coexist API question scene (enter old API credentials)', done: false },
      { name: 'Coexist verify scene (validate migration credentials)', done: false },
      { name: 'Coexist connect Meta scene (Facebook re-auth for migration)', done: false },
      { name: 'Coexist confirm scene (review and confirm migration)', done: false },
      { name: 'Coexist congratulations scene (migration success)', done: false },
      // Gamified onboarding
      { name: 'Gamified onboarding Stage 1 (GamifiedOnboarding)', done: false },
      { name: 'Gamified onboarding Stage 2', done: false },
      // AI onboarding
      { name: 'AI agent builder onboarding (AgentBuilder entry point)', done: false },
      // Progress / banner
      { name: 'Trial achievement banner (credits + progress ring)', done: false },
      { name: 'Onboarding progress tracking (team-wide step completion)', done: false },
    ],
    notes: 'Channel and dashboard onboarding done. Missing: full signup flow (phone, OTP, forget password), onboarding wizard (10 scenes), coexist migration (7 scenes), gamified onboarding (2 stages), AI agent builder onboarding, trial banner.',
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
      // Billing page tabs / navigation
      { name: 'Billing tabs menu (usage-plan / purchase-history / transaction-history)', done: false },
      // Usage plan scenes
      { name: 'Current usage plan scene (active plan card)', done: false },
      { name: 'Current usage plan scene — mobile layout', done: false },
      { name: 'Manage plan scene (plan comparison + upgrade / downgrade)', done: false },
      { name: 'Manage plan scene — mobile layout', done: false },
      { name: 'Plan migration wizard (migrate to credit billing)', done: false },
      { name: 'Power-ups scene (add-ons: extra channels, teammates, messages)', done: false },
      { name: 'Power-ups scene — mobile layout', done: false },
      { name: 'Add credits scene (top-up credit balance)', done: false },
      { name: 'Annual vs monthly billing toggle', done: false },
      { name: 'Plan state chip (active / trial / expired / cancelled badge)', done: false },
      { name: 'Plan / addon card display (MarqueePlanCard)', done: false },
      { name: 'Features and usage card (per-feature limit display)', done: false },
      { name: 'Auto top-up card (automatic credit refill config)', done: false },
      // Purchase / transaction history
      { name: 'Credit purchase history scene', done: false },
      { name: 'Credit purchase history — mobile layout', done: false },
      { name: 'Credit transaction history scene', done: false },
      { name: 'Credit transaction history — mobile layout', done: false },
      { name: 'Charge filter popover (filter by charge type)', done: false },
      { name: 'Service filter popover (filter by service/channel)', done: false },
      { name: 'Status filter popover (filter by payment status)', done: false },
      { name: 'Invoice history', done: false },
      // Credits
      { name: 'Buy credits interface (credit package picker)', done: false },
      { name: 'Credit step card (step-by-step purchase flow)', done: false },
      { name: 'Zero credits upsell page (ran out of credits CTA)', done: false },
      { name: 'Credit billing view (usage-based billing details)', done: false },
      { name: 'Non-credit billing view (legacy flat billing)', done: false },
      // Subscriptions
      { name: 'Subscription data table (list current subscriptions)', done: false },
      { name: 'Subscriptions layout manager', done: false },
      { name: 'Payment methods management', done: false },
      // Stripe / checkout
      { name: 'Stripe checkout integration (redirectToCheckout)', done: false },
      { name: 'Coupon / discount code entry + validation', done: false },
      { name: 'Usage plan components (Stripe extra-channel/teammate cards)', done: false },
      // Feature gating
      { name: 'Feature-locked page (FeatureLockedPage — paywall for plan-gated features)', done: false },
      // Billing flow extras
      { name: 'Billing flow — step 1: select plan', done: false },
      { name: 'Billing flow — step 2: billing cycle (annual/monthly)', done: false },
      { name: 'Billing flow — step 3: payment method', done: false },
      { name: 'Billing flow — step 4: confirmation', done: false },
      { name: 'Billing URL deep-link support (?plan=X&addon=Y)', done: false },
      { name: 'Regional pricing (price display by user country)', done: false },
      // Power-ups add-on items
      { name: 'Power-ups — extra channels add-on', done: false },
      { name: 'Power-ups — extra teammates add-on', done: false },
      { name: 'Power-ups — extra messages add-on', done: false },
      { name: 'Power-ups — extra AI credits add-on', done: false },
      { name: 'Power-ups — extra broadcasts add-on', done: false },
      { name: 'Power-ups — extra contacts add-on', done: false },
      { name: 'Power-ups — extra storage add-on', done: false },
      { name: 'Power-ups — priority support add-on', done: false },
      { name: 'Power-ups — dedicated IP add-on', done: false },
      { name: 'Power-ups — white-label add-on', done: false },
      { name: 'Power-ups — custom domain add-on', done: false },
      { name: 'Power-ups — SLA add-on', done: false },
      { name: 'Power-ups — training sessions add-on', done: false },
      // Guided tour
      { name: 'Billing guided tour (step-by-step walkthrough of billing page)', done: false },
      { name: 'Billing tour — step 1: overview', done: false },
      { name: 'Billing tour — step 2: current plan', done: false },
      { name: 'Billing tour — step 3: upgrade plan', done: false },
      { name: 'Billing tour — step 4: add-ons', done: false },
      { name: 'Billing tour — step 5: credits', done: false },
      { name: 'Billing tour — step 6: transaction history', done: false },
      { name: 'Billing tour — step 7: invoices', done: false },
      { name: 'Billing tour — step 8: completion + confetti', done: false },
      { name: 'Billing tour — trigger tour button', done: false },
      { name: 'Billing tour — enhanced variant (richer tour UI)', done: false },
      // Credits detail
      { name: 'Credits — credit slider (pick top-up amount)', done: false },
      { name: 'Credits — pricing list (packages + per-unit cost)', done: false },
      { name: 'Credits — usage calculator (estimate cost from usage)', done: false },
      { name: 'Credits — unlock rows (per-feature unlock display)', done: false },
      { name: 'Credits — grouped rows (grouped feature display)', done: false },
      { name: 'Credits — current plan card', done: false },
      { name: 'Credits — admin tier selector', done: false },
      { name: 'Credits — buy header (top section with total)', done: false },
      { name: 'Credits — coupon applied dialog', done: false },
      { name: 'Credits — pending payment state', done: false },
      { name: 'Credits — unlock list display', done: false },
      { name: 'Credits — discount chip (savings badge)', done: false },
      { name: 'Credits — custom pricing dialog', done: false },
      { name: 'Credits — FAQs section', done: false },
      { name: 'Credits — formik coupon field', done: false },
      { name: 'Credits — pretty slider (styled range input)', done: false },
      { name: 'Credit flow demo (interactive demo for new users)', done: false },
      // Mobile layouts
      { name: 'Billing — mobile layout: usage plan', done: false },
      { name: 'Billing — mobile layout: manage plan', done: false },
      { name: 'Billing — mobile layout: power-ups', done: false },
      { name: 'Billing — mobile layout: purchase history', done: false },
      { name: 'Billing — mobile layout: transaction history', done: false },
    ],
    notes: 'Only billing settings tab exists. Full billing module is a complex 80+ item build: usage plan scenes, power-ups (13 add-ons), credit top-up (16 sub-components), purchase/transaction history, Stripe checkout, subscriptions table, feature-gating pages, guided tour (8 steps + confetti), billing flow steps, regional pricing, URL deep-links, 5 mobile layouts.',
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
