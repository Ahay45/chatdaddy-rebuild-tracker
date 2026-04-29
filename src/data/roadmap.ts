// ─── ChatDaddy Future Roadmap ─────────────────────────────────────────────────
// Authored as Senior PM / PO strategic breakdown
// Last updated: 2026-04-29

export type RoadmapPriority = 'p0' | 'p1' | 'p2' | 'p3'
export type RoadmapHorizon = 'now' | 'next' | 'later' | 'future'
export type RoadmapStatus = 'not-started' | 'in-progress' | 'done'

export interface RoadmapInitiative {
  id: string
  title: string
  description?: string
  done: boolean
}

export interface RoadmapPillar {
  id: string
  icon: string
  label: string
  tagline: string
  priority: RoadmapPriority
  horizon: RoadmapHorizon
  /** Duration estimate e.g. "4–6 weeks" */
  duration: string
  /** Impact score 1-10 */
  impact: number
  /** Effort score 1-10 */
  effort: number
  /** The core problem statement */
  problem: string
  /** Root causes (bullet points) */
  rootCauses: string[]
  /** Key initiatives to tackle this pillar */
  initiatives: RoadmapInitiative[]
  /** Success metrics */
  successMetrics: string[]
  /** Team / owner hint */
  owner: string
}

export const PRIORITY_LABEL: Record<RoadmapPriority, { label: string; color: string }> = {
  p0: { label: 'P0 — Critical', color: '#EF4444' },
  p1: { label: 'P1 — High',     color: '#F97316' },
  p2: { label: 'P2 — Medium',   color: '#F59E0B' },
  p3: { label: 'P3 — Nice-to-have', color: '#6B7280' },
}

export const HORIZON_CONFIG: Record<RoadmapHorizon, { label: string; color: string; description: string; range: string }> = {
  now:    { label: 'Now',    color: '#EF4444', description: 'Immediate — ship within 8 weeks',       range: 'Apr – Jun 2026' },
  next:   { label: 'Next',   color: '#F97316', description: 'Short-term — ship within Q3 2026',      range: 'Jul – Sep 2026' },
  later:  { label: 'Later',  color: '#F59E0B', description: 'Medium-term — ship in Q4 2026',         range: 'Oct – Dec 2026' },
  future: { label: 'Future', color: '#8B5CF6', description: 'Long-term — 2027 and beyond',           range: '2027+' },
}

export const ROADMAP_PILLARS: RoadmapPillar[] = [
  // ── P0: NOW ───────────────────────────────────────────────────────────────

  {
    id: 'stability',
    icon: '🔒',
    label: 'Platform Stability',
    tagline: 'Stop the bleeding — make ChatDaddy reliable enough to trust',
    priority: 'p0',
    horizon: 'now',
    duration: '4–6 weeks',
    impact: 10,
    effort: 7,
    problem:
      'Users frequently hit the "Oops!" error page, disconnected channels, and unexpected logouts. Stability issues are the #1 churn driver — no feature matters if the platform crashes.',
    rootCauses: [
      'Single root-level ErrorBoundary takes down entire app on any crash',
      'Bare JSON.parse() in 30+ places throws on corrupted localStorage / malformed API data',
      'WebSocket handler in WABAStore.ts and AiCrmProfileStore.ts crash on malformed server messages',
      'TypeScript non-null assertions (!) bypass runtime safety — undefined access causes silent crashes',
      'Unhandled Promise.all rejections propagate and kill React trees',
      '59 lazy-loaded chunks with no cache-busting strategy cause chunk failures after every deploy',
      'No component-level isolation — one bad component destroys the whole page',
    ],
    initiatives: [
      { id: 'stab-1', title: 'Deploy FeatureErrorBoundary on all 59 lazy routes (PR #3415 baseline)', done: true },
      { id: 'stab-2', title: 'Fix remaining 71 bare throw statements — replace with graceful inline error UI', done: false },
      { id: 'stab-3', title: 'Wrap WABAStore.ts:280 and AiCrmProfileStore.ts:91 WebSocket parse in try-catch', done: false },
      { id: 'stab-4', title: 'Migrate all 30+ JSON.parse calls to safeJsonParse utility (PR #3415 covers 9)', done: false },
      { id: 'stab-5', title: 'Replace TypeScript ! non-null assertions with optional chaining across 12 critical files', done: false },
      { id: 'stab-6', title: 'Add .catch() handlers to unhandled Promise.all chains (InvitePopup, Products, FlowAnalytics)', done: false },
      { id: 'stab-7', title: 'Nginx cache-control: hashed chunks → 1yr immutable, index.html → no-cache', done: true },
      { id: 'stab-8', title: 'Add CI error-boundary audit gate — block PRs with new HIGH-severity crash patterns', done: true },
      { id: 'stab-9', title: 'Add Sentry alerting thresholds — auto-create Lark task when error rate spikes', done: false },
      { id: 'stab-10', title: 'Weekly stability scorecard published to Tech Team Lark group', done: false },
    ],
    successMetrics: [
      'Oops page occurrences reduced by 80% (measured via Sentry error rate)',
      'Zero unhandled WebSocket crash reports in Lark CS channel for 2 consecutive weeks',
      'error-boundary-audit HIGH findings drop from 71 → < 10',
      'Average session length increases by 15%',
    ],
    owner: 'Frontend Team (Piyush + Ai Li)',
  },

  {
    id: 'performance',
    icon: '⚡',
    label: 'Performance & Speed',
    tagline: 'Every second of load time costs us users — make ChatDaddy feel instant',
    priority: 'p0',
    horizon: 'now',
    duration: '6–8 weeks',
    impact: 9,
    effort: 8,
    problem:
      'Users consistently report that ChatDaddy feels slow — especially the Inbox and Dashboard. Slow load times directly correlate with abandonment and reduce daily active usage.',
    rootCauses: [
      'All 59 pages lazy-loaded but Suspense fallbacks are basic — perceived load feels unpolished',
      'No API response caching or stale-while-revalidate strategy — every navigation hits the server fresh',
      'MobX stores hold entire message history in memory — large teams hit memory limits',
      'Dashboard metrics recalculate on every render without memoization',
      'No virtual scrolling in Inbox chat list — 1000+ chats cause DOM bloat',
      'Image attachments not lazy-loaded or compressed client-side before upload',
      'WebSocket reconnects trigger full state re-fetch instead of incremental updates',
      'Bundle size: no per-route code-split analysis, some routes bundle heavy libs unnecessarily',
    ],
    initiatives: [
      { id: 'perf-1', title: 'Audit and fix top 5 slowest pages with React Profiler + Lighthouse CI baseline', done: false },
      { id: 'perf-2', title: 'Implement TanStack Query in V2 — automatic caching, background refetch, stale-while-revalidate', done: true },
      { id: 'perf-3', title: 'Add virtual scrolling (TanStack Virtual) to Inbox chat list and message thread', done: false },
      { id: 'perf-4', title: 'Implement skeleton loaders on Inbox, Dashboard, CRM — eliminate blank flash', done: false },
      { id: 'perf-5', title: 'Bundle analysis: identify and code-split heavy third-party libs (Twilio, Stripe, PDF.js)', done: false },
      { id: 'perf-6', title: 'Image lazy loading + WebP conversion for media attachments in Inbox', done: false },
      { id: 'perf-7', title: 'Add React.memo and useMemo to top 10 most frequently re-rendering components', done: false },
      { id: 'perf-8', title: 'Lighthouse CI gate in GitHub Actions — fail PR if LCP > 3s or TTI > 5s', done: false },
      { id: 'perf-9', title: 'Incremental WebSocket state sync — diff updates instead of full re-fetch on reconnect', done: true },
      { id: 'perf-10', title: 'CDN edge caching for static assets via Cloudflare or AWS CloudFront', done: false },
    ],
    successMetrics: [
      'Inbox first-load LCP < 2.5s (from current ~5s)',
      'Dashboard initial render < 1.5s',
      'Lighthouse Performance score > 80 on all core pages',
      'CS complaint tickets about slowness reduce by 60%',
    ],
    owner: 'Frontend Team + Aseem (Backend API caching)',
  },

  {
    id: 'data-sync',
    icon: '🔄',
    label: 'Data Sync & Real-time Accuracy',
    tagline: 'Inbox must be the source of truth — not WhatsApp itself',
    priority: 'p0',
    horizon: 'now',
    duration: '4–6 weeks',
    impact: 10,
    effort: 8,
    problem:
      'Users report that their ChatDaddy inbox does not reflect what they see in WhatsApp — messages appear late, read status is wrong, contacts show as unread after being read, and message ordering is inconsistent.',
    rootCauses: [
      'WebSocket event processing drops messages silently when parse fails (WABAStore unfixed)',
      'Race conditions between HTTP API fetch and WebSocket push — last-write-wins causes ordering bugs',
      'No message deduplication logic — duplicate events create ghost messages',
      'Read status synced optimistically but not confirmed by backend ACK',
      'Contact sync runs on page load only — new WABA contacts missing until refresh',
      'Inbox pagination doesn\'t handle mid-session inserts — new messages push scroll position',
      'No offline queue — messages sent while disconnected may silently fail without user feedback',
    ],
    initiatives: [
      { id: 'sync-1', title: 'Fix WABAStore.ts:280 and AiCrmProfileStore.ts:91 — wrap all WebSocket parse in try-catch', done: false },
      { id: 'sync-2', title: 'Implement message deduplication by messageId before inserting into store', done: true },
      { id: 'sync-3', title: 'Add sequence numbers / timestamps to WebSocket events for deterministic ordering', done: false },
      { id: 'sync-4', title: 'Read-status confirmed ACK flow — only mark read when backend confirms', done: true },
      { id: 'sync-5', title: 'Incremental contact sync via webhook — update store on new WABA contact event', done: false },
      { id: 'sync-6', title: 'Offline send queue with IndexedDB — retry on reconnect, show pending status badge', done: false },
      { id: 'sync-7', title: 'Inbox scroll anchor preservation during WebSocket inserts', done: true },
      { id: 'sync-8', title: 'Add "last sync time" indicator in Inbox header — surface sync health to user', done: false },
      { id: 'sync-9', title: 'Automated sync accuracy test: send message via WhatsApp API, assert it appears in inbox within 2s', done: false },
    ],
    successMetrics: [
      'Message delivery to Inbox < 2s from WhatsApp send (P95)',
      'Zero duplicate message reports in CS tickets for 4 consecutive weeks',
      'Read-status accuracy 99%+ (verified by automated test suite)',
      'CS sync-related complaint tickets reduce by 70%',
    ],
    owner: 'Backend (Aseem) + Frontend (Piyush)',
  },

  // ── P1: NEXT ──────────────────────────────────────────────────────────────

  {
    id: 'product-led-growth',
    icon: '🎓',
    label: 'Product-Led Growth & User Education',
    tagline: 'Users should learn ChatDaddy from the product itself, not from CS',
    priority: 'p1',
    horizon: 'next',
    duration: '8–12 weeks',
    impact: 8,
    effort: 6,
    problem:
      'The CS team spends the majority of their time teaching users how to use features that already exist. This is a product failure — not a CS failure. Users who don\'t discover value within their first week churn.',
    rootCauses: [
      'No onboarding checklist or guided setup flow after signup',
      'Features are discoverable only by exploration — no contextual help, tooltips, or in-app hints',
      'No empty-state guidance — new users see blank pages without knowing what to do next',
      'No in-app product tour or feature spotlight for major releases',
      'Help documentation is external and disconnected from the UI context',
      'No usage analytics to identify where users get stuck (activation funnel gaps)',
    ],
    initiatives: [
      { id: 'plg-1', title: 'Onboarding checklist widget — 6-step setup guide visible on first login (connect channel, import contacts, send first broadcast, set up automation, invite team, configure AI)', done: false },
      { id: 'plg-2', title: 'Interactive product tour on first visit to Inbox, FlowBuilder, and Dashboard', done: false },
      { id: 'plg-3', title: 'Empty state redesign — every blank page gets a clear CTA and example/template', done: false },
      { id: 'plg-4', title: 'Contextual help tooltips on complex UI elements (FlowBuilder nodes, CRM columns, Broadcast settings)', done: false },
      { id: 'plg-5', title: '"What\'s New" in-app changelog panel — surface new features without requiring users to check docs', done: false },
      { id: 'plg-6', title: 'Feature spotlight banners for major releases (dismiss-able, not intrusive)', done: false },
      { id: 'plg-7', title: 'Activation funnel analytics — Amplitude events for key milestones (first message sent, first flow activated, first broadcast sent)', done: false },
      { id: 'plg-8', title: 'In-app video walkthroughs embedded in empty states and onboarding flow', done: false },
      { id: 'plg-9', title: 'Progress nudges — email/in-app prompts when users have incomplete setup steps', done: false },
    ],
    successMetrics: [
      'Time to first value (first message sent) < 10 minutes from signup',
      'Onboarding completion rate > 60%',
      'CS ticket volume for "how do I use X" reduced by 50%',
      'Week-1 retention increases by 20%',
    ],
    owner: 'Product (Akil) + Frontend (Ai Li)',
  },

  {
    id: 'trust-retention',
    icon: '❤️',
    label: 'Trust & Long-term Retention',
    tagline: 'Users stay for reliability and value — make ChatDaddy indispensable',
    priority: 'p1',
    horizon: 'next',
    duration: '8–10 weeks (cross-cutting)',
    impact: 9,
    effort: 7,
    problem:
      'Platform instability, data sync issues, and lack of transparency have eroded user trust. Long-term retention requires that users feel ChatDaddy is a platform they can depend on daily. Trust is built through consistency, communication, and delivered promises.',
    rootCauses: [
      'No status page or incident communication — users find out about outages from each other',
      'No SLA visibility — users don\'t know what uptime they can expect',
      'Feature promises announced but shipped late — expectation gap',
      'Mobile experience lags behind desktop — power users on mobile feel abandoned',
      'No loyalty program or acknowledgement for long-term customers',
      'Refund and support resolution processes feel opaque to users',
    ],
    initiatives: [
      { id: 'trust-1', title: 'Public status page (statuspage.io or similar) — real-time uptime visibility', done: false },
      { id: 'trust-2', title: 'Proactive incident communication — Lark/WhatsApp broadcast to affected teams during outages', done: false },
      { id: 'trust-3', title: 'In-app system health banner — non-intrusive indicator when a known issue is being resolved', done: false },
      { id: 'trust-4', title: 'Mobile web optimization pass — fix top 10 mobile UX friction points in Inbox and Dashboard', done: false },
      { id: 'trust-5', title: 'Customer health score dashboard (internal) — flag at-risk accounts before they churn', done: false },
      { id: 'trust-6', title: 'NPS survey flow built into the app — collect feedback quarterly, route detractors to CS immediately', done: false },
      { id: 'trust-7', title: 'Power user recognition — in-app badge or milestone celebration for 1 year / 10k messages', done: false },
      { id: 'trust-8', title: 'Release cadence transparency — public roadmap that matches actual shipping dates', done: false },
    ],
    successMetrics: [
      'NPS increases from current baseline by +15 points in 6 months',
      'Monthly churn rate decreases by 25%',
      '12-month retention increases by 30%',
      'Support CSAT score > 4.5 / 5',
    ],
    owner: 'Product + CS (David)',
  },

  {
    id: 'ai-native',
    icon: '🤖',
    label: 'AI-Native Product',
    tagline: 'ChatDaddy should feel like it was built for the AI era, not retrofitted into it',
    priority: 'p1',
    horizon: 'next',
    duration: '12–16 weeks',
    impact: 9,
    effort: 9,
    problem:
      'Competitors are shipping AI-first features that make their products feel intelligent. ChatDaddy has some AI features (AI chatbot, flow builder AI) but they feel bolted-on. The core product doesn\'t leverage AI to reduce user effort and amplify results.',
    rootCauses: [
      'AI features are isolated modules, not woven into the core workflows',
      'No AI-assisted inbox — agents spend time on routine replies that could be AI-suggested',
      'FlowBuilder requires technical knowledge — AI could generate flows from plain English',
      'Broadcast copy still written manually — AI could draft and personalize at scale',
      'Contact segmentation is manual — AI could auto-segment based on behavior',
      'No AI analytics insights — dashboard shows data but doesn\'t surface "what to do next"',
    ],
    initiatives: [
      { id: 'ai-1', title: 'AI reply suggestions in Inbox — one-click suggested responses based on conversation context', done: false },
      { id: 'ai-2', title: 'AI flow generator — describe automation in plain English, AI creates the flow (AiChatbotNode + AiChatbotV2Node added to FlowBuilder)', done: false },
      { id: 'ai-3', title: 'AI broadcast copywriter — generate personalized message variants from a brief', done: false },
      { id: 'ai-4', title: 'Smart contact segmentation — AI-powered auto-tagging and audience creation from behavior', done: false },
      { id: 'ai-5', title: 'AI analytics insights — plain-English summary of dashboard data with actionable recommendations', done: false },
      { id: 'ai-6', title: 'AI-powered FAQ auto-responder — learns from past CS conversations to handle common queries', done: false },
      { id: 'ai-7', title: 'Sentiment analysis on incoming messages — flag angry / urgent conversations for priority routing', done: false },
      { id: 'ai-8', title: 'AI CRM enrichment — auto-fill contact profiles from conversation history', done: false },
      { id: 'ai-9', title: 'AI onboarding assistant — chat-based setup guide using Claude/GPT to walk new users through configuration', done: false },
    ],
    successMetrics: [
      'AI reply suggestions used in > 30% of agent responses within 3 months of launch',
      'AI flow generator reduces average flow creation time from 45min → 10min',
      'Chatbot deflection rate increases by 40% after AI FAQ improvements',
      'User survey: "ChatDaddy feels modern and AI-powered" rated > 4 / 5',
    ],
    owner: 'AI Team + Backend (Aseem)',
  },

  // ── P2: LATER ─────────────────────────────────────────────────────────────

  {
    id: 'free-tier',
    icon: '🆓',
    label: 'Free Tier & User Acquisition',
    tagline: 'The free tier is our top-of-funnel — it must convert, not frustrate',
    priority: 'p2',
    horizon: 'later',
    duration: '6–8 weeks',
    impact: 8,
    effort: 5,
    problem:
      'Free users experience a confusing, limited product that doesn\'t showcase ChatDaddy\'s value. Instead of converting free users to paid, the current free tier frustrates them into leaving. This blocks user acquisition and organic growth.',
    rootCauses: [
      'Free tier limits are hit without clear messaging about what\'s included vs paid',
      'No guided "aha moment" for free users — they don\'t experience the core value proposition',
      'Upgrade prompts are intrusive and appear too early in the user journey',
      'Free tier lacks enough features to generate word-of-mouth referrals',
      'No viral mechanism — users can\'t share or invite others through the product',
      'Onboarding doesn\'t route free vs paid users differently',
    ],
    initiatives: [
      { id: 'free-1', title: 'Free tier redesign — clear value showcase with generous limits on core features (inbox, 1 channel, basic automation)', done: false },
      { id: 'free-2', title: 'Usage-based upgrade prompts — only show upgrade CTA when user naturally hits a meaningful limit', done: false },
      { id: 'free-3', title: 'Feature preview mode — let free users see locked features with a clear "unlock" CTA', done: false },
      { id: 'free-4', title: 'Free tier "aha moment" flow — guide free users to send their first automated message within 5 minutes', done: false },
      { id: 'free-5', title: 'Referral program — free users earn extra quota by inviting others (viral loop)', done: false },
      { id: 'free-6', title: 'Free tier landing page redesign — communicate what you get for free, make signup frictionless', done: false },
      { id: 'free-7', title: 'Free → Paid conversion email sequence — triggered by usage milestones, not time', done: false },
    ],
    successMetrics: [
      'Free-to-paid conversion rate increases by 30%',
      'Free user 30-day retention increases by 25%',
      'Referral program drives 15% of new free signups within 6 months',
      'Average time to "aha moment" for free users < 5 minutes',
    ],
    owner: 'Product (Akil) + Growth (David)',
  },

  {
    id: 'multi-channel',
    icon: '📡',
    label: 'Multi-Channel Experience',
    tagline: 'WhatsApp is the core — but the future is omnichannel',
    priority: 'p2',
    horizon: 'later',
    duration: '16–24 weeks',
    impact: 8,
    effort: 10,
    problem:
      'ChatDaddy is perceived as a WhatsApp tool, not a business communication platform. Instagram DM, Messenger, Email, and SMS users exist in the product but receive a degraded experience. This limits market expansion and makes ChatDaddy vulnerable to WhatsApp policy changes.',
    rootCauses: [
      'Channel connection UI is inconsistent — each channel has different UX patterns',
      'Automation flows are built around WhatsApp message types — other channels have limited node support',
      'Inbox thread view not optimized for non-WhatsApp channels (no email threading, no IG story replies)',
      'Analytics dashboard doesn\'t break down by channel — hard to measure ROI of non-WA channels',
      'Broadcast module defaults to WhatsApp — multi-channel broadcast sends not supported',
      'No unified channel health dashboard — users manage each channel separately',
    ],
    initiatives: [
      { id: 'mc-1', title: 'Channel health dashboard — unified view of all connected channels, sync status, and message volume', done: false },
      { id: 'mc-2', title: 'Instagram DM: full thread view with story reply context, reaction support, and media handling', done: false },
      { id: 'mc-3', title: 'Messenger: full conversation threading, quick replies, and button templates', done: false },
      { id: 'mc-4', title: 'Email channel: threaded inbox view, HTML email support, open/click tracking', done: false },
      { id: 'mc-5', title: 'SMS: two-way messaging, delivery receipts, and opt-out handling', done: false },
      { id: 'mc-6', title: 'Multi-channel automation flows — add IG/Messenger/Email/SMS nodes to FlowBuilder', done: false },
      { id: 'mc-7', title: 'Multi-channel broadcast — send campaigns across WhatsApp + Email + SMS simultaneously', done: false },
      { id: 'mc-8', title: 'Channel-specific analytics — per-channel message volume, response rate, and conversion breakdown', done: false },
      { id: 'mc-9', title: 'Unified contact timeline — see all touchpoints across channels in one CRM profile view', done: false },
      { id: 'mc-10', title: 'Channel onboarding redesign — consistent, step-by-step setup wizard for all channel types', done: false },
    ],
    successMetrics: [
      'Non-WhatsApp channel MAU increases by 200% within 6 months of launch',
      'Multi-channel flow adoption: 20% of active teams use at least 2 channels in automations',
      'CS complaint tickets for non-WA channels reduce by 50%',
      'New team signups citing IG/Email/SMS as primary channel reach 15%',
    ],
    owner: 'Full Stack (Piyush + Aseem + Ai Li)',
  },

  {
    id: 'integrations',
    icon: '🔌',
    label: 'Platform Integrations',
    tagline: 'ChatDaddy should connect to the tools businesses already use',
    priority: 'p2',
    horizon: 'later',
    duration: '8–12 weeks',
    impact: 7,
    effort: 7,
    problem:
      'Businesses use a stack of tools — Shopify, HubSpot, Notion, Google Sheets, Zapier, Make. ChatDaddy integrations are limited, which means data lives in silos and users have to do manual work that automation should handle.',
    rootCauses: [
      'Zapier integration exists but webhook-only — no native two-way sync',
      'No native Shopify integration — e-commerce users can\'t trigger WA messages from order events',
      'No CRM sync (HubSpot, Salesforce) — contact data must be imported manually',
      'No Google Sheets sync — popular workaround for small teams but no official support',
      'No Make (Integromat) official app — users build brittle custom webhooks',
      'API documentation incomplete — developers can\'t build reliable integrations',
    ],
    initiatives: [
      { id: 'int-1', title: 'Shopify native integration — trigger WhatsApp messages on order events (placed, shipped, refunded)', done: false },
      { id: 'int-2', title: 'HubSpot two-way contact sync — push CRM data to ChatDaddy, push conversation data back', done: false },
      { id: 'int-3', title: 'Google Sheets native connector — import contacts, export conversation logs', done: false },
      { id: 'int-4', title: 'Make (Integromat) official app — pre-built triggers and actions in the Make marketplace', done: false },
      { id: 'int-5', title: 'Zapier native app upgrade — add triggers for new message, new contact, flow completed events', done: false },
      { id: 'int-6', title: 'Public API v2 — RESTful, fully documented, versioned, with webhook support', done: false },
      { id: 'int-7', title: 'Developer portal — API keys, sandbox environment, interactive docs (Swagger/Stoplight)', done: false },
      { id: 'int-8', title: 'WooCommerce integration — order-triggered WhatsApp messages for WordPress stores', done: false },
    ],
    successMetrics: [
      'Integration usage: 30% of paid teams connect at least one third-party integration',
      'Shopify integration drives 500 new business signups within 3 months',
      'API documentation NPS > 4 / 5 from developer survey',
      'Zapier/Make integration triggers > 1M actions per month within 6 months',
    ],
    owner: 'Backend (Aseem) + Product (Akil)',
  },

  // ── P3: FUTURE ────────────────────────────────────────────────────────────

  {
    id: 'ai-features',
    icon: '✨',
    label: 'Deep AI Feature Integration',
    tagline: 'Every core feature should have an AI superpower layer',
    priority: 'p3',
    horizon: 'future',
    duration: 'Ongoing — 2027+',
    impact: 9,
    effort: 10,
    problem:
      'As AI-native product becomes the baseline expectation, ChatDaddy needs to go beyond surface-level AI features and integrate intelligence deeply into every workflow — from inbox management to flow building to analytics interpretation.',
    rootCauses: [
      'Current AI chatbot is a standalone module, not integrated with CRM, Broadcasts, or Analytics',
      'No AI model fine-tuning on company-specific data — knowledge base limited to manual uploads',
      'AI chatbot cannot escalate to human agents with context handoff',
      'No AI-powered A/B testing for broadcasts — manual variant creation',
      'CRM scoring / lead qualification still manual',
      'No AI-generated reporting — users must interpret raw data themselves',
    ],
    initiatives: [
      { id: 'aif-1', title: 'AI-powered A/B testing for broadcasts — auto-generate variants and optimize send times', done: false },
      { id: 'aif-2', title: 'Intelligent human handoff — AI escalates with full conversation context and sentiment summary', done: false },
      { id: 'aif-3', title: 'AI lead scoring in CRM — auto-rank contacts by purchase intent from conversation signals', done: false },
      { id: 'aif-4', title: 'Conversational analytics — ask questions about your data in plain English ("which campaign had the best reply rate last month?")', done: false },
      { id: 'aif-5', title: 'Company knowledge base fine-tuning — AI learns from your product docs, FAQs, and past CS conversations', done: false },
      { id: 'aif-6', title: 'AI-generated daily digest — morning summary of key metrics, alerts, and recommended actions', done: false },
      { id: 'aif-7', title: 'Smart scheduling — AI recommends optimal broadcast send times based on audience engagement patterns', done: false },
      { id: 'aif-8', title: 'AI-powered flow optimization — analyze flow drop-off points and suggest improvements', done: false },
    ],
    successMetrics: [
      'AI features used in > 50% of paid team workflows',
      'AI-assisted broadcast open rates 25% higher than manual sends',
      'Average AI chatbot deflection rate > 60% for supported intents',
      'Conversational analytics reduces time-to-insight from 15min → 30sec',
    ],
    owner: 'AI Team + Full Stack',
  },
]

// ── Derived stats ─────────────────────────────────────────────────────────────

export function getRoadmapStats() {
  const byHorizon = (['now', 'next', 'later', 'future'] as RoadmapHorizon[]).map((h) => {
    const pillars = ROADMAP_PILLARS.filter((p) => p.horizon === h)
    const totalInit = pillars.reduce((s, p) => s + p.initiatives.length, 0)
    const doneInit = pillars.reduce((s, p) => s + p.initiatives.filter((i) => i.done).length, 0)
    return { horizon: h, pillars: pillars.length, totalInit, doneInit }
  })
  const totalInitiatives = ROADMAP_PILLARS.reduce((s, p) => s + p.initiatives.length, 0)
  const doneInitiatives = ROADMAP_PILLARS.reduce((s, p) => s + p.initiatives.filter((i) => i.done).length, 0)
  return { byHorizon, totalInitiatives, doneInitiatives, totalPillars: ROADMAP_PILLARS.length }
}
