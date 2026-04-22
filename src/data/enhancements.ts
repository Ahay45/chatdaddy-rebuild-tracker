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

// ─── Phase timeline config ────────────────────────────────────────────────────

export const PHASE1_TIMELINE = {
  startDate: '2026-04-06',
  // Estimated completion — update when Phase 1 ships
  estEndDate: '2026-05-07',
  // Flip to actual date when done
  actualEndDate: '2026-04-22' as string | null,
}

export const PHASE2_TIMELINE = {
  // Kicks off right after Phase 1 wraps
  estStartDate: '2026-04-22',
  // Estimated weeks: ~37 items, ~4 devs, mixed effort — Phase 1 quick wins ~3w, Phase 2 ~5w, Phase 3 ongoing
  estWeeks: 14,
  actualEndDate: null as string | null,
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
  // ─── Inbox ────────────────────────────────────────────────────────────────
  {
    id: 'inbox',
    icon: '💬',
    label: 'Inbox',
    category: 'core',
    enhancements: [
      {
        id: 'inbox-mark-read-unread',
        title: 'Mark as read / unread on chats',
        description: 'Allow agents to manually toggle read state on any chat from the chat list — critical for triage and workflow.',
        priority: 'high',
        effort: 'xs',
        phase: 1,
        done: false,
        tags: ['Chat', 'UX'],
      },
      {
        id: 'inbox-date-range-filter',
        title: 'Date range filter in chat list',
        description: 'Let agents filter the inbox by a custom date range so they can scope conversations by time period.',
        priority: 'high',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Filter', 'UX'],
      },
      {
        id: 'inbox-export-chat',
        title: 'Export chat function',
        description: 'Export a full conversation thread as PDF or CSV — needed for compliance, handoffs, and customer records.',
        priority: 'high',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Chat', 'Export'],
      },
      {
        id: 'inbox-custom-field-3dot',
        title: 'Manage custom fields via 3-dot menu in chat list',
        description: 'Quick access to view and edit contact custom fields directly from the chat list row without opening the full contact panel.',
        priority: 'medium',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Chat', 'CRM'],
      },
      {
        id: 'inbox-group-participants-guard',
        title: 'Group Participants panel: group chats only',
        description: 'The Group Participants section should be hidden for personal/1:1 chats. Currently shows incorrectly on non-group conversations.',
        priority: 'high',
        effort: 'xs',
        phase: 1,
        done: false,
        tags: ['Bug', 'Chat'],
      },
      {
        id: 'inbox-setting-incognito',
        title: 'Inbox setting — Incognito Mode',
        description: 'Toggle that hides the agent\'s online/read status from contacts — useful for agents who need to review chats privately.',
        priority: 'medium',
        effort: 's',
        phase: 2,
        done: false,
        tags: ['Settings', 'Privacy'],
      },
      {
        id: 'inbox-setting-flow-edit-warning',
        title: 'Inbox setting — Flow edit warning',
        description: 'Show a warning banner when an active automation flow is being edited live, so agents don\'t accidentally disrupt running flows.',
        priority: 'medium',
        effort: 'xs',
        phase: 1,
        done: false,
        tags: ['Settings', 'Safety'],
      },
      {
        id: 'inbox-setting-hide-scheduled',
        title: 'Inbox setting — Hide Scheduled Messages',
        description: 'Option to hide the scheduled messages section from the compose area for teams who don\'t use it, reducing clutter.',
        priority: 'low',
        effort: 'xs',
        phase: 1,
        done: false,
        tags: ['Settings', 'UX'],
      },
      {
        id: 'inbox-edit-email-right-panel',
        title: 'Edit Email in right panel',
        description: 'Allow agents to compose and edit email replies directly from the right panel without switching views — parity with WhatsApp compose UX.',
        priority: 'medium',
        effort: 'm',
        phase: 2,
        done: false,
        tags: ['Email', 'UX'],
      },
    ],
  },

  // ─── Channels ─────────────────────────────────────────────────────────────
  {
    id: 'channels',
    icon: '📡',
    label: 'Channels',
    category: 'core',
    enhancements: [
      {
        id: 'channels-raw-number-display',
        title: 'Fix raw WhatsApp JID display across platform',
        description: 'Phone numbers shown as raw JIDs (e.g. 6285228454057@s.whatsapp.net) instead of formatted numbers. Needs global fix across channel labels, inbox headers, and contact panels.',
        priority: 'critical',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Bug', 'Global'],
      },
      {
        id: 'channels-waba-402-error',
        title: 'Fix WABA setup 402 error',
        description: 'Setting up a WABA channel fails with "Request failed with status code 402". Likely a billing/subscription gate not being handled — needs proper error message and recovery path.',
        priority: 'critical',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Bug', 'WABA'],
      },
      {
        id: 'channels-instagram-connection',
        title: 'Fix Instagram connection flow',
        description: 'Instagram channel connection is not working. Debug OAuth flow, permissions, and Meta Graph API handshake. Add clear error states and retry guidance.',
        priority: 'critical',
        effort: 'm',
        phase: 1,
        done: false,
        tags: ['Bug', 'Instagram', 'OAuth'],
      },
      {
        id: 'channels-facebook-connection',
        title: 'Fix Facebook connection flow',
        description: 'Facebook channel connection is not working. Same root cause area as Instagram — Meta OAuth and page permissions. Fix and add error recovery UI.',
        priority: 'critical',
        effort: 'm',
        phase: 1,
        done: false,
        tags: ['Bug', 'Facebook', 'OAuth'],
      },
      {
        id: 'channels-no-channel-empty-inbox',
        title: 'Empty inbox when no channel is connected',
        description: 'When no channel is connected, the inbox should show an empty state with a CTA to connect a channel — not a broken or blank list.',
        priority: 'high',
        effort: 'xs',
        phase: 1,
        done: false,
        tags: ['UX', 'Empty State'],
      },
      {
        id: 'channels-email-domain-validation',
        title: 'Email channel: block personal email domains',
        description: 'Email channel connection should only allow company email domains (no gmail, yahoo, hotmail etc). Show a clear error when a personal address is entered, and explain why.',
        priority: 'high',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Email', 'Validation'],
      },
    ],
  },

  // ─── Calls ────────────────────────────────────────────────────────────────
  {
    id: 'calls',
    icon: '📞',
    label: 'Calls',
    category: 'core',
    enhancements: [
      {
        id: 'calls-note-log-history',
        title: 'Call note log: show who wrote what and when',
        description: 'Notes on test calls have no attribution. Each note entry should show the agent name, timestamp, and full note history log — critical for accountability and handoffs.',
        priority: 'high',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Calls', 'Notes', 'Audit'],
      },
      {
        id: 'calls-agent-id-readable',
        title: 'Replace agent IDs with readable agent names',
        description: 'Agent IDs appear as raw numeric/UUID strings in call details. Should resolve to the agent\'s display name using the team member store.',
        priority: 'high',
        effort: 'xs',
        phase: 1,
        done: false,
        tags: ['Bug', 'Calls'],
      },
      {
        id: 'calls-ai-insights',
        title: 'AI-powered call details: insights and action items',
        description: 'Enhance the call detail panel with AI-generated summary, sentiment, key topics mentioned, and suggested follow-up actions. Makes calls actionable, not just a log.',
        priority: 'medium',
        effort: 'l',
        phase: 3,
        done: false,
        tags: ['AI', 'Calls', 'Insights'],
      },
    ],
  },

  // ─── Automation ───────────────────────────────────────────────────────────
  {
    id: 'automation',
    icon: '⚡',
    label: 'Automation',
    category: 'engage',
    enhancements: [
      {
        id: 'automation-message-flow-builder-branch',
        title: 'Message Flow Builder: branch from PR #7',
        description: 'Take the flow builder implementation from github.com/chatdaddy/frontend-dashboard-v2/pull/7 and create a dedicated branch for the full message builder — isolating it from main V2 work.',
        priority: 'critical',
        effort: 'l',
        phase: 1,
        done: false,
        tags: ['Flows', 'Builder'],
      },
      {
        id: 'automation-manychat-template-builder',
        title: 'Manychat-style template builder for channel automation',
        description: 'Visual drag-and-drop automation template builder similar to Manychat: choose trigger → build message sequence → set conditions. Makes automation accessible to non-technical users.',
        priority: 'high',
        effort: 'xl',
        phase: 3,
        done: false,
        tags: ['Automation', 'Builder', 'UX'],
      },
      {
        id: 'automation-flow-analytics-detail',
        title: 'Detailed analytics on message flow',
        description: 'Add per-node analytics to the flow builder: how many contacts reached each step, drop-off rates, conversion at action nodes. Currently analytics are too surface-level.',
        priority: 'high',
        effort: 'l',
        phase: 2,
        done: false,
        tags: ['Analytics', 'Flows'],
      },
      {
        id: 'automation-keyword-channel-icons',
        title: 'Keyword reply: channel icons and smart create button state',
        description: 'In keyword reply creation, show proper channel icons next to each channel. Disable the Create button until all required fields (keyword, channel, reply) are filled — enable it dynamically.',
        priority: 'high',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Keyword', 'UX'],
      },
      {
        id: 'automation-keyword-right-preview',
        title: 'Keyword reply: live right-panel preview',
        description: 'Add a phone mockup preview on the right side of the keyword reply creation form showing exactly how the reply will appear to the end user, updating in real time as you type.',
        priority: 'medium',
        effort: 'm',
        phase: 2,
        done: false,
        tags: ['Keyword', 'Preview', 'UX'],
      },
      {
        id: 'automation-template-market-preview',
        title: 'Template market: enhanced preview popup',
        description: 'Replace the flat template preview with a modal showing the full flow canvas on the left and a phone mockup on the right. Users see the exact flow + how messages look before installing.',
        priority: 'medium',
        effort: 'm',
        phase: 2,
        done: false,
        tags: ['Templates', 'Preview', 'UX'],
      },
    ],
  },

  // ─── Broadcasts ───────────────────────────────────────────────────────────
  {
    id: 'broadcasts',
    icon: '📣',
    label: 'Broadcasts',
    category: 'engage',
    enhancements: [
      {
        id: 'broadcast-contact-health-filter',
        title: 'Contact health filter and audience quality summary',
        description: 'Bring back the V1 contact health filter (opt-out rate, message quality score) and audience quality summary card before sending — prevents sending to bad audiences.',
        priority: 'high',
        effort: 'm',
        phase: 2,
        done: false,
        tags: ['Broadcast', 'Audience'],
      },
      {
        id: 'broadcast-save-on-intent',
        title: 'Creation only triggers on explicit Save',
        description: 'Currently broadcast creation may fire prematurely. Creation should only happen when the user clicks Save. Disable Save until all required fields (audience, message, channel) are filled.',
        priority: 'high',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Broadcast', 'UX', 'Safety'],
      },
      {
        id: 'broadcast-channel-selection',
        title: 'Channel selection: WABA vs non-WABA',
        description: 'Add explicit channel selection step in broadcast creation — distinguish between WABA channels (with tier limits) and non-WABA (WhatsApp, Instagram, Facebook). Apply correct sending rules per channel.',
        priority: 'high',
        effort: 'm',
        phase: 2,
        done: false,
        tags: ['Broadcast', 'WABA', 'Channels'],
      },
      {
        id: 'broadcast-tier-upgrade-guide',
        title: 'WABA tier upgrade guidance in broadcast flow',
        description: 'Show current sending tier and limits inline in the broadcast creation flow with a link to upgrade, matching the V1 experience. Reduces confusion about why sends are throttled.',
        priority: 'medium',
        effort: 's',
        phase: 2,
        done: false,
        tags: ['Broadcast', 'WABA', 'Education'],
      },
      {
        id: 'broadcast-smart-timing',
        title: 'Smart Timing Recommendation',
        description: 'Suggest optimal send time based on historical open/response rates for the selected audience segment — ported from V1 with improved UI and confidence indicators.',
        priority: 'medium',
        effort: 'l',
        phase: 3,
        done: false,
        tags: ['Broadcast', 'AI', 'Timing'],
      },
      {
        id: 'broadcast-edit',
        title: 'Edit an existing broadcast',
        description: 'Allow editing of a scheduled or draft broadcast — change audience, message, timing, channel. Currently broadcasts are immutable after creation.',
        priority: 'high',
        effort: 'm',
        phase: 2,
        done: false,
        tags: ['Broadcast', 'CRUD'],
      },
    ],
  },

  // ─── Campaigns ────────────────────────────────────────────────────────────
  {
    id: 'campaigns',
    icon: '🎯',
    label: 'Campaigns',
    category: 'engage',
    enhancements: [
      {
        id: 'campaigns-tbd',
        title: 'Campaigns — scope TBD',
        description: 'Full campaigns module scope to be defined. Placeholder to track when planning begins.',
        priority: 'low',
        effort: 'xl',
        phase: 3,
        done: false,
        tags: ['TBD'],
      },
    ],
  },

  // ─── AI / Chatbot ─────────────────────────────────────────────────────────
  {
    id: 'ai',
    icon: '🤖',
    label: 'AI / Chatbot',
    category: 'engage',
    enhancements: [
      {
        id: 'ai-knowledge-base-fetch-fix',
        title: 'Fix knowledge base data fetching',
        description: 'Knowledge base currently fetches stale or incorrect data. Debug the query, ensure the correct team/channel scope is applied, and add loading/error states.',
        priority: 'critical',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Bug', 'AI', 'Knowledge Base'],
      },
      {
        id: 'ai-knowledge-base-rebuild',
        title: 'Rebuild Knowledge Base with improved UX',
        description: 'Implement the full knowledge base module from V1 but with a cleaner, more modern UI — better document management, search, status indicators, and training progress visibility.',
        priority: 'high',
        effort: 'l',
        phase: 2,
        done: false,
        tags: ['AI', 'Knowledge Base', 'UX'],
      },
      {
        id: 'ai-chatbot-builder',
        title: 'AI Chatbot builder — V1 parity',
        description: 'Rebuild the AI chatbot creation and management flow from V1: create chatbot, assign to channels, configure personality/tone, connect knowledge base, test responses.',
        priority: 'high',
        effort: 'l',
        phase: 2,
        done: false,
        tags: ['AI', 'Chatbot'],
      },
    ],
  },

  // ─── Settings & Admin ─────────────────────────────────────────────────────
  {
    id: 'settings',
    icon: '⚙️',
    label: 'Settings & Admin',
    category: 'admin',
    enhancements: [
      {
        id: 'settings-billing-rebuild-remainder',
        title: 'Ship remaining items from feat/settings-billing-rebuild',
        description: 'The settings-billing-rebuild branch has unmerged features not yet in main. Audit the branch, identify what\'s missing from main V2, and implement the remaining pieces.',
        priority: 'high',
        effort: 'l',
        phase: 2,
        done: false,
        tags: ['Settings', 'Billing', 'Admin'],
      },
    ],
  },

  // ─── Notifications ────────────────────────────────────────────────────────
  {
    id: 'notifications',
    icon: '🔔',
    label: 'Notifications',
    category: 'platform',
    enhancements: [
      {
        id: 'notifications-smart-alerts',
        title: 'Smart notifications: suggest what needs attention',
        description: 'Notifications should surface actionable items — disconnected channel alerts, failed broadcasts, expiring WABA templates, unread escalations. Proactively guide users to fix issues rather than just logging events.',
        priority: 'high',
        effort: 'm',
        phase: 2,
        done: false,
        tags: ['Notifications', 'UX', 'Alerts'],
      },
      {
        id: 'notifications-channel-disconnect-alert',
        title: 'Channel disconnected notification and recovery CTA',
        description: 'When a channel disconnects (QR expired, token revoked, API ban), show a persistent notification with the channel name, reason, and a direct "Reconnect" CTA — not just a generic alert.',
        priority: 'high',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Notifications', 'Channels', 'UX'],
      },
    ],
  },

  // ─── Platform / Global ────────────────────────────────────────────────────
  {
    id: 'platform',
    icon: '🌐',
    label: 'Platform-wide',
    category: 'platform',
    enhancements: [
      {
        id: 'platform-team-switcher-visible',
        title: 'Always-visible team name for multi-team accounts',
        description: 'For accounts with more than one team, show the active team name persistently in the top-right corner or pin the selected team to the first row of the team list — prevents agents working in the wrong team.',
        priority: 'high',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Navigation', 'Multi-team', 'UX'],
      },
      {
        id: 'platform-unsaved-changes-warning',
        title: 'Unsaved changes warning on navigation',
        description: 'When a user navigates away mid-creation (broadcast, chatbot, flow, keyword reply, etc.), show a warning modal: "You have unsaved changes — leave anyway?" Prevents accidental data loss.',
        priority: 'high',
        effort: 's',
        phase: 1,
        done: false,
        tags: ['Safety', 'UX', 'Global'],
      },
      {
        id: 'platform-phone-mockup-flow-previews',
        title: 'Phone mockup preview on all flow preview lists',
        description: 'Every place that previews a flow (message flows list, keyword reply, template market, broadcast preview) should show a phone frame mockup rendering the actual message output — consistent across the platform.',
        priority: 'medium',
        effort: 'm',
        phase: 2,
        done: false,
        tags: ['Preview', 'UX', 'Global'],
      },
      {
        id: 'platform-empty-states',
        title: 'Cinematic empty states across all modules',
        description: 'Replace blank/generic empty states with engaging, module-specific illustrations, clear headlines, and action CTAs. Clean, modern, fun — follows UX best practices (never a dead end, always guide the next action).',
        priority: 'medium',
        effort: 'l',
        phase: 2,
        done: false,
        tags: ['Empty State', 'UX', 'Design', 'Global'],
      },
    ],
  },

  // ─── TBD modules ──────────────────────────────────────────────────────────
  {
    id: 'tools',
    icon: '🔧',
    label: 'Tools',
    category: 'tools',
    enhancements: [
      {
        id: 'tools-tbd',
        title: 'Tools module — scope TBD',
        description: 'Forms, QR codes, widgets, Zapier integrations, coupons — full scope to be defined after Phase 1 ships.',
        priority: 'low',
        effort: 'xl',
        phase: 3,
        done: false,
        tags: ['TBD'],
      },
    ],
  },
  {
    id: 'shops',
    icon: '🛍️',
    label: 'Shops / Commerce',
    category: 'commerce',
    enhancements: [
      {
        id: 'shops-tbd',
        title: 'Shops / Commerce — scope TBD',
        description: 'Product catalogue, orders, payments — full scope to be defined after Phase 1 ships.',
        priority: 'low',
        effort: 'xl',
        phase: 3,
        done: false,
        tags: ['TBD'],
      },
    ],
  },
  {
    id: 'appstore',
    icon: '📦',
    label: 'App Store',
    category: 'platform',
    enhancements: [
      {
        id: 'appstore-tbd',
        title: 'App Store — scope TBD',
        description: 'Third-party integrations marketplace — full scope to be defined after Phase 1 ships.',
        priority: 'low',
        effort: 'xl',
        phase: 3,
        done: false,
        tags: ['TBD'],
      },
    ],
  },
  {
    id: 'ai-crm',
    icon: '🧠',
    label: 'AI CRM',
    category: 'engage',
    enhancements: [
      {
        id: 'ai-crm-tbd',
        title: 'AI CRM — scope TBD',
        description: 'AI-powered CRM features — lead scoring, conversation summaries, smart follow-ups. Full scope TBD.',
        priority: 'low',
        effort: 'xl',
        phase: 3,
        done: false,
        tags: ['TBD', 'AI', 'CRM'],
      },
    ],
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
