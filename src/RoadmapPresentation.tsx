import { useState, useEffect, useRef, useCallback } from 'react'
import { ROADMAP_PILLARS, HORIZON_CONFIG, PRIORITY_LABEL, type RoadmapPillar, type RoadmapHorizon } from './data/roadmap'

// ─── Design tokens ────────────────────────────────────────────────────────────

const HORIZON_ORDER: RoadmapHorizon[] = ['now', 'next', 'later', 'future']

const H_COLOR: Record<RoadmapHorizon, string> = {
  now:    '#ff4d4d',
  next:   '#ff7a2f',
  later:  '#f5a623',
  future: '#a78bfa',
}

const P_COLOR: Record<string, string> = {
  p0: '#ff4d4d',
  p1: '#ff7a2f',
  p2: '#f5a623',
  p3: '#a78bfa',
}

// ─── Tiny utilities ───────────────────────────────────────────────────────────

function hex(color: string, opacity: number) {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0')
  return color + alpha
}

// ─── Noise grain overlay ─────────────────────────────────────────────────────

function GrainOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
      opacity: 0.35,
    }} />
  )
}

// ─── Sticky Nav ───────────────────────────────────────────────────────────────

function Nav({ active, onSelect }: { active: string; onSelect: (id: RoadmapHorizon) => void }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: 56,
      background: scrolled ? 'rgba(6,6,8,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: 'linear-gradient(135deg, #ff4d4d, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#fff',
        }}>CD</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em' }}>
          ChatDaddy
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>Future Roadmap 2026</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {HORIZON_ORDER.map(h => {
          const cfg = HORIZON_CONFIG[h]
          const isActive = active === h
          return (
            <button
              key={h}
              onClick={() => onSelect(h)}
              style={{
                padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, letterSpacing: '0.01em',
                background: isActive ? hex(H_COLOR[h], 0.18) : 'transparent',
                color: isActive ? H_COLOR[h] : 'rgba(255,255,255,0.45)',
                outline: isActive ? `1px solid ${hex(H_COLOR[h], 0.35)}` : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {cfg.label}
            </button>
          )
        })}
        <a
          href="/chatdaddy-rebuild-tracker/"
          style={{
            marginLeft: 8, padding: '5px 14px', borderRadius: 99,
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ← Tracker
        </a>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const totalInitiatives = ROADMAP_PILLARS.reduce((s, p) => s + p.initiatives.length, 0)
  const doneInitiatives = ROADMAP_PILLARS.reduce((s, p) => s + p.initiatives.filter(i => i.done).length, 0)

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '120px 24px 80px', textAlign: 'center', position: 'relative',
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 800, height: 800, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(79,140,255,0.07) 0%, transparent 70%)',
      }} />

      {/* Horizon pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
        {HORIZON_ORDER.map(h => (
          <span key={h} style={{
            padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            background: hex(H_COLOR[h], 0.12), color: H_COLOR[h],
            border: `1px solid ${hex(H_COLOR[h], 0.25)}`,
          }}>
            {HORIZON_CONFIG[h].label} · {HORIZON_CONFIG[h].range}
          </span>
        ))}
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: 'clamp(3rem, 8vw, 7rem)', fontWeight: 900, lineHeight: 1.0,
        letterSpacing: '-0.04em', marginBottom: 24,
        background: 'linear-gradient(160deg, #ffffff 30%, rgba(255,255,255,0.45) 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        Where ChatDaddy<br />is going.
      </h1>

      <p style={{
        fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'rgba(255,255,255,0.45)',
        maxWidth: 560, lineHeight: 1.7, marginBottom: 56,
      }}>
        A prioritized breakdown of every major problem we need to solve — and exactly how we plan to solve it.
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { value: ROADMAP_PILLARS.length, label: 'Strategic Pillars', color: '#4f8cff' },
          { value: totalInitiatives, label: 'Initiatives', color: '#22d17a' },
          { value: doneInitiatives, label: 'Shipped', color: '#a78bfa' },
          { value: 4, label: 'Time Horizons', color: '#f5a623' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '20px 32px', textAlign: 'center',
            borderLeft: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            borderRight: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.04em' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll to explore</span>
        <div style={{
          width: 1, height: 48,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
        }} />
      </div>
    </section>
  )
}

// ─── Horizon Section ─────────────────────────────────────────────────────────

function HorizonSection({ horizon, onVisible }: { horizon: RoadmapHorizon; onVisible: (h: RoadmapHorizon) => void }) {
  const ref = useRef<HTMLElement>(null)
  const cfg = HORIZON_CONFIG[horizon]
  const color = H_COLOR[horizon]
  const pillars = ROADMAP_PILLARS.filter(p => p.horizon === horizon)
  const totalInit = pillars.reduce((s, p) => s + p.initiatives.length, 0)
  const doneInit = pillars.reduce((s, p) => s + p.initiatives.filter(i => i.done).length, 0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onVisible(horizon) },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [horizon, onVisible])

  return (
    <section ref={ref} id={`horizon-${horizon}`} style={{ padding: '100px 0', position: 'relative' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 400, pointerEvents: 'none',
        background: `radial-gradient(ellipse, ${hex(color, 0.04)} 0%, transparent 70%)`,
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {/* Section header */}
        <div style={{ marginBottom: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 99, marginBottom: 16,
              background: hex(color, 0.12), border: `1px solid ${hex(color, 0.25)}`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {cfg.label}
              </span>
              <span style={{ fontSize: 11, color: hex(color, 0.7) }}>{cfg.range}</span>
            </div>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1,
              letterSpacing: '-0.03em', color: '#fff',
            }}>
              {cfg.description.replace(' — ', '\n')}
            </h2>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
              {pillars.length} pillars · {totalInit} initiatives
            </div>
            <MiniProgress done={doneInit} total={totalInit} color={color} />
          </div>
        </div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {pillars.map(pillar => <PillarCard key={pillar.id} pillar={pillar} />)}
        </div>
      </div>
    </section>
  )
}

// ─── Mini progress bar ────────────────────────────────────────────────────────

function MiniProgress({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {pct}%
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>complete</div>
      <div style={{ width: 120, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ─── Pillar Card ──────────────────────────────────────────────────────────────

function PillarCard({ pillar }: { pillar: RoadmapPillar }) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'causes' | 'initiatives' | 'metrics'>('initiatives')
  const color = P_COLOR[pillar.priority]
  const hColor = H_COLOR[pillar.horizon]
  const doneCount = pillar.initiatives.filter(i => i.done).length
  const totalCount = pillar.initiatives.length
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.035)',
        border: `1px solid ${expanded ? hex(color, 0.35) : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20, overflow: 'hidden',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow: expanded ? `0 0 40px ${hex(color, 0.08)}` : '0 0 0 transparent',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(v => !v)}
    >
      {/* Top color line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, ${hColor})` }} />

      <div style={{ padding: '20px 20px 16px' }}>
        {/* Icon + title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{pillar.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                color, padding: '2px 8px', borderRadius: 99,
                background: hex(color, 0.14), border: `1px solid ${hex(color, 0.25)}`,
              }}>
                {PRIORITY_LABEL[pillar.priority].label}
              </span>
            </div>
            <h3 style={{
              fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.02em',
            }}>
              {pillar.label}
            </h3>
          </div>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55, marginBottom: 16 }}>
          {pillar.tagline}
        </p>

        {/* Impact / Effort dots */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <DotsRow label="Impact" value={pillar.impact} color="#22d17a" />
          <DotsRow label="Effort" value={pillar.effort} color="#f5a623" />
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              {doneCount}/{totalCount} initiatives
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
          </div>
          <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%', borderRadius: 99,
              background: `linear-gradient(90deg, ${color}, ${hColor})`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{pillar.duration}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{pillar.owner}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)' }}
        >
          {/* Problem banner */}
          <div style={{
            margin: 16, padding: '12px 14px', borderRadius: 12,
            background: hex(color, 0.06), border: `1px solid ${hex(color, 0.18)}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              🎯 Problem Statement
            </div>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
              {pillar.problem}
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, padding: '0 16px', marginBottom: 12 }}>
            {(['initiatives', 'causes', 'metrics'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
                  background: tab === t ? hex(color, 0.2) : 'rgba(255,255,255,0.05)',
                  color: tab === t ? color : 'rgba(255,255,255,0.35)',
                  outline: tab === t ? `1px solid ${hex(color, 0.35)}` : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {t === 'initiatives' ? `✓ Initiatives (${totalCount})` : t === 'causes' ? '⚡ Root Causes' : '📈 Success'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '0 16px 16px' }}>
            {tab === 'initiatives' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pillar.initiatives.map(init => (
                  <div key={init.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    background: init.done ? hex('#22d17a', 0.06) : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${init.done ? hex('#22d17a', 0.18) : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 5, flexShrink: 0, marginTop: 1,
                      background: init.done ? '#22d17a' : 'rgba(255,255,255,0.08)',
                      border: `1.5px solid ${init.done ? '#22d17a' : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {init.done && (
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{
                      fontSize: 12.5, color: init.done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)',
                      textDecoration: init.done ? 'line-through' : 'none', lineHeight: 1.5,
                    }}>
                      {init.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'causes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pillar.rootCauses.map((cause, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(255,77,77,0.04)', border: '1px solid rgba(255,77,77,0.1)',
                  }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ff4d4d', flexShrink: 0, marginTop: 8 }} />
                    <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{cause}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'metrics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pillar.successMetrics.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(34,209,122,0.04)', border: '1px solid rgba(34,209,122,0.12)',
                  }}>
                    <span style={{ color: '#22d17a', flexShrink: 0, marginTop: 1, fontSize: 12 }}>↗</span>
                    <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>{m}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Impact / Effort dots ─────────────────────────────────────────────────────

function DotsRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label} {value}/10
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: 2,
            background: i < value ? color : hex(color, 0.15),
            transition: 'background 0.2s ease',
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── Shipped This Week ────────────────────────────────────────────────────────

const BASE = '/chatdaddy-rebuild-tracker/images/shipped/'

type ShippedUpdate = {
  date: string
  pr: string
  module: string
  icon: string
  color: string
  title: string
  detail: string
  images: string[]
}

const SHIPPED_GROUPS: { label: string; day: string; updates: ShippedUpdate[] }[] = [
  {
    label: 'Friday · Apr 24',
    day: '24',
    updates: [
      {
        date: 'Apr 24', pr: 'PR #20', module: 'Flow Builder', icon: '⚡', color: '#a78bfa',
        title: 'Cinematic UI rebuild — canvas, sidebar & palette',
        detail: 'Full visual overhaul of node canvas, sidebar palette, and toolbar. Real bot actions now load directly onto canvas. Breadcrumb navigation + empty canvas hint added.',
        images: [`${BASE}Cinematic UI rebuild — canvas, sidebar & palette.png`],
      },
      {
        date: 'Apr 24', pr: 'PR #18', module: 'Calls', icon: '📞', color: '#4f8cff',
        title: 'Call statistics & agent handling enhanced',
        detail: 'Richer call stats breakdown per agent. Improved handling of ongoing/missed/answered call states.',
        images: [
          `${BASE}Call statistics & agent handling enhanced.png`,
          `${BASE}Call statistics & agent handling enhanced 2.png`,
        ],
      },
      {
        date: 'Apr 24', pr: 'PR #19', module: 'Inbox + Channels', icon: '💬', color: '#22d17a',
        title: 'Date range filter + channel empty state',
        detail: 'Inline calendar with presets (Today, 7d, 30d, Custom) for Inbox date filter. NoChannelEmptyState added for teams with no connected channels.',
        images: [`${BASE}Date range filter.png`, `${BASE}channel empty state.png`],
      },
      {
        date: 'Apr 24', pr: 'PR #16–17', module: 'Channels', icon: '📡', color: '#f5a623',
        title: 'Email registration + onboarding error handling',
        detail: 'Email channel onboarding now supports registration with full error display. Channel setup dialogs show inline validation instead of silent failures.',
        images: [`${BASE}Email registration + onboarding error handling.png`],
      },
      {
        date: 'Apr 24', pr: 'hotfix', module: 'Inbox', icon: '🔧', color: '#ff7a2f',
        title: 'Chat list lazy loading + speed boost',
        detail: 'Chat list pagination now lazy-loads. Chat opening speed significantly improved. Chat sort order fixed (old → new).',
        images: [],
      },
    ],
  },
  {
    label: 'This Week · Apr 27–29',
    day: '27',
    updates: [
      {
        date: 'Apr 27', pr: 'commit', module: 'Flow Builder', icon: '🤖', color: '#a78bfa',
        title: 'AI chatbot nodes + 7 new action node types',
        detail: 'AiChatbotNode and AiChatbotV2Node added. Also: ActionNode, CreateTicketNode, UpdateTicketNode, StopTicketTimerNode, NotifyTeamNode, ForkNode. Node duplicate/delete actions wired.',
        images: [`${BASE}AI chatbot nodes + 7 new action node types.png`],
      },
      {
        date: 'Apr 28', pr: 'PR #23', module: 'Inbox', icon: '🔄', color: '#22d17a',
        title: 'Live inbox — real-time WebSocket sync',
        detail: 'Full live inbox: message dedup, scroll anchor on new messages, debounced read-ACK, slide-in animation for live arrivals. useLiveEvents + useLiveInbox hooks.',
        images: [],
      },
      {
        date: 'Apr 28', pr: 'commit', module: 'Inbox', icon: '↩️', color: '#ff7a2f',
        title: 'Double-tap to reply + scroll to reply',
        detail: 'Double-tap any message bubble to quote-reply. Tapping a quoted message scrolls to the original in the thread.',
        images: [],
      },
      {
        date: 'Apr 29', pr: 'PR #24', module: 'CRM + Inbox', icon: '👤', color: '#4f8cff',
        title: 'ContactAvatar component across modules',
        detail: 'Unified ContactAvatar with picture queue and lazy-load. Integrated into ChatRow, ChatDetail, CRM BoardView, TicketCard, CreateTicketDialog, GlobalSearchDrawer.',
        images: [`${BASE}ContactAvatar component across modules.png`],
      },
    ],
  },
]

const ALL_UPDATES = SHIPPED_GROUPS.flatMap(g => g.updates)

// ─── Image Lightbox ───────────────────────────────────────────────────────────

function ImageLightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length, onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: '92vw' }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: -14, right: -14, zIndex: 1,
          width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        <img src={images[idx]} alt="" style={{
          maxWidth: '88vw', maxHeight: '78vh',
          borderRadius: 18, objectFit: 'contain',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.07)',
        }} />

        {images.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{
                width: i === idx ? 24 : 8, height: 8, borderRadius: 99, border: 'none',
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.25)',
                cursor: 'pointer', padding: 0, transition: 'all 0.2s ease',
              }} />
            ))}
          </div>
        )}

        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)} style={{
              padding: '7px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.07)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}>← Prev</button>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}>{idx + 1} / {images.length}</span>
            <button onClick={() => setIdx(i => (i + 1) % images.length)} style={{
              padding: '7px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.07)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Featured card (has image — large horizontal layout) ─────────────────────

function FeaturedCard({ u, onImage }: { u: ShippedUpdate; onImage: (images: string[], idx: number) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 20, overflow: 'hidden',
        border: `1px solid ${hovered ? `${u.color}55` : 'rgba(255,255,255,0.08)'}`,
        background: 'rgba(255,255,255,0.03)',
        boxShadow: hovered ? `0 8px 40px ${u.color}12` : 'none',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      {/* Left: content */}
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `${u.color}18`, border: `1px solid ${u.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
            }}>{u.icon}</div>
            <span style={{
              fontSize: 10, fontWeight: 800, color: u.color, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '3px 9px', borderRadius: 7,
              background: `${u.color}14`, border: `1px solid ${u.color}28`,
            }}>{u.module}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginLeft: 'auto' }}>{u.pr}</span>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.35, letterSpacing: '-0.02em', marginBottom: 10 }}>
            {u.title}
          </h3>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>
            {u.detail}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{u.date}</span>
          <button
            onClick={() => onImage(u.images, 0)}
            style={{
              fontSize: 11, fontWeight: 600, color: u.color, cursor: 'pointer',
              background: `${u.color}12`, border: `1px solid ${u.color}30`,
              padding: '5px 12px', borderRadius: 8,
              transition: 'background 0.15s',
            }}
          >
            View screenshot{u.images.length > 1 ? `s (${u.images.length})` : ''} ↗
          </button>
        </div>
      </div>

      {/* Right: image preview */}
      <div
        onClick={() => onImage(u.images, 0)}
        style={{
          position: 'relative', cursor: 'zoom-in', overflow: 'hidden',
          borderLeft: `1px solid ${u.color}18`,
          background: `${u.color}06`,
          minHeight: 200,
        }}
      >
        <img
          src={u.images[0]}
          alt={u.title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transition: 'transform 0.4s ease',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
          }}
        />
        {/* Overlay gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${u.color}10 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />
        {/* Zoom icon */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
        }}>🔍</div>
        {/* Multi-image badge */}
        {u.images.length > 1 && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)',
          }}>1 / {u.images.length}</div>
        )}
      </div>
    </div>
  )
}

// ─── Compact card (no image — text-only) ─────────────────────────────────────

function CompactCard({ u }: { u: ShippedUpdate }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16, padding: '18px 20px',
        border: `1px solid ${hovered ? `${u.color}40` : 'rgba(255,255,255,0.07)'}`,
        background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)',
        transition: 'border-color 0.2s, background 0.2s',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: `${u.color}15`, border: `1px solid ${u.color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>{u.icon}</div>
        <span style={{
          fontSize: 10, fontWeight: 800, color: u.color, letterSpacing: '0.07em',
          textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6,
          background: `${u.color}12`, border: `1px solid ${u.color}25`,
        }}>{u.module}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>{u.date} · {u.pr}</span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
        {u.title}
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
        {u.detail}
      </p>
    </div>
  )
}

function ShippedThisWeek() {
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null)
  const totalUpdates = ALL_UPDATES.length
  const withImages = ALL_UPDATES.filter(u => u.images.length > 0).length

  return (
    <section style={{ padding: '100px 0', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
      {/* Ambient */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 700, height: 400, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(34,209,122,0.04) 0%, transparent 70%)',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 60 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 99, marginBottom: 16,
              background: 'rgba(34,209,122,0.08)', border: '1px solid rgba(34,209,122,0.22)',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d17a', boxShadow: '0 0 8px #22d17a' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#22d17a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Shipped · Apr 24–29
              </span>
            </div>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.04em', lineHeight: 1.05,
            }}>
              What shipped<br />this week.
            </h2>
          </div>

          {/* Stats chips */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { value: totalUpdates, label: 'updates', color: '#22d17a' },
              { value: withImages, label: 'with screenshots', color: '#4f8cff' },
              { value: SHIPPED_GROUPS[0].updates.length, label: 'on Friday', color: '#a78bfa' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '10px 18px', borderRadius: 14,
                background: `${s.color}0d`, border: `1px solid ${s.color}25`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Groups */}
        {SHIPPED_GROUPS.map((group) => {
          const featured = group.updates.filter(u => u.images.length > 0)
          const compact = group.updates.filter(u => u.images.length === 0)
          return (
            <div key={group.label} style={{ marginBottom: 64 }}>
              {/* Group label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.02em',
                }}>{group.day}</div>
                <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {group.label}
                </span>
                <div style={{ height: 1, width: 40, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Featured cards grid */}
              {featured.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 14, marginBottom: compact.length > 0 ? 14 : 0 }}>
                  {featured.map((u, i) => (
                    <FeaturedCard key={i} u={u} onImage={(imgs, idx) => setLightbox({ images: imgs, idx })} />
                  ))}
                </div>
              )}

              {/* Compact cards grid */}
              {compact.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                  {compact.map((u, i) => <CompactCard key={i} u={u} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {lightbox && <ImageLightbox images={lightbox.images} startIndex={lightbox.idx} onClose={() => setLightbox(null)} />}
    </section>
  )
}

// ─── Timeline strip ───────────────────────────────────────────────────────────

function TimelineStrip() {
  const p0 = ROADMAP_PILLARS.filter(p => p.priority === 'p0')
  const p1 = ROADMAP_PILLARS.filter(p => p.priority === 'p1')
  const p2 = ROADMAP_PILLARS.filter(p => p.priority === 'p2')
  const p3 = ROADMAP_PILLARS.filter(p => p.priority === 'p3')

  return (
    <section style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Priority Matrix
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            What we're tackling and when
          </h2>
        </div>

        {/* Timeline bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { pillars: p0, label: 'P0 — Critical', color: '#ff4d4d', horizon: 'now' as RoadmapHorizon, width: '25%' },
            { pillars: p1, label: 'P1 — High', color: '#ff7a2f', horizon: 'next' as RoadmapHorizon, width: '50%' },
            { pillars: p2, label: 'P2 — Medium', color: '#f5a623', horizon: 'later' as RoadmapHorizon, width: '75%' },
            { pillars: p3, label: 'P3 — Nice-to-have', color: '#a78bfa', horizon: 'future' as RoadmapHorizon, width: '100%' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 160, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: row.color, marginBottom: 2 }}>{row.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{HORIZON_CONFIG[row.horizon].range}</div>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{
                  height: 36, borderRadius: 10, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{
                    width: row.width, height: '100%', borderRadius: 10,
                    background: `linear-gradient(90deg, ${hex(row.color, 0.25)}, ${hex(row.color, 0.08)})`,
                    display: 'flex', alignItems: 'center', paddingLeft: 12, gap: 6, flexWrap: 'nowrap', overflow: 'hidden',
                  }}>
                    {row.pillars.map(p => (
                      <span key={p.id} style={{ fontSize: 14, flexShrink: 0 }}>{p.icon}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Horizon labels */}
        <div style={{ display: 'flex', marginTop: 12, paddingLeft: 176 }}>
          {HORIZON_ORDER.map(h => (
            <div key={h} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: H_COLOR[h], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {HORIZON_CONFIG[h].label}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{HORIZON_CONFIG[h].range}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Closing CTA ──────────────────────────────────────────────────────────────

function ClosingSection() {
  const totalInit = ROADMAP_PILLARS.reduce((s, p) => s + p.initiatives.length, 0)
  return (
    <section style={{
      padding: '120px 24px', textAlign: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(79,140,255,0.07) 0%, transparent 60%)',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>🚀</div>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#fff',
          letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16,
        }}>
          {totalInit} initiatives.<br />One mission.
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 40 }}>
          Making ChatDaddy the most reliable, intelligent, and loved business communication platform in Southeast Asia.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/chatdaddy-rebuild-tracker/"
            style={{
              padding: '12px 28px', borderRadius: 12, textDecoration: 'none',
              background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.14)',
              transition: 'all 0.2s ease',
            }}
          >
            ← Back to Tracker
          </a>
          <a
            href="#horizon-now"
            style={{
              padding: '12px 28px', borderRadius: 12, textDecoration: 'none',
              background: 'linear-gradient(135deg, #ff4d4d, #ff7a2f)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              boxShadow: '0 4px 20px rgba(255,77,77,0.3)',
            }}
          >
            Start from Now ↑
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Root app ─────────────────────────────────────────────────────────────────

export default function RoadmapPresentation() {
  const [activeHorizon, setActiveHorizon] = useState<RoadmapHorizon>('now')

  const handleSelect = useCallback((h: RoadmapHorizon) => {
    const el = document.getElementById(`horizon-${h}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#f0f0f5' }}>
      <GrainOverlay />
      <Nav active={activeHorizon} onSelect={handleSelect} />
      <Hero />
      <ShippedThisWeek />
      <TimelineStrip />
      {HORIZON_ORDER.map(h => (
        <HorizonSection key={h} horizon={h} onVisible={setActiveHorizon} />
      ))}
      <ClosingSection />
    </div>
  )
}
