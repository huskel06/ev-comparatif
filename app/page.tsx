import Link from 'next/link'
import { vehicles } from '@/data/vehicles'
import VehicleGrid from '@/components/VehicleGrid'
import CompareTable from '@/components/CompareTable'

/* ── Dashboard background SVG ─── */
function DashboardSVG() {
  return (
    <svg
      aria-hidden
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.035 }}
      viewBox="0 0 1440 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Speedometer-style concentric arcs */}
      <path d="M 120 900 A 600 600 0 0 1 1320 900" stroke="#00D4FF" strokeWidth="1.5"/>
      <path d="M 220 900 A 500 500 0 0 1 1220 900" stroke="#00D4FF" strokeWidth="1.5"/>
      <path d="M 320 900 A 400 400 0 0 1 1120 900" stroke="#00D4FF" strokeWidth="1.5"/>
      <path d="M 420 900 A 300 300 0 0 1 1020 900" stroke="#00D4FF" strokeWidth="1.5"/>
      <path d="M 520 900 A 200 200 0 0 1  920 900" stroke="#00D4FF" strokeWidth="1.5"/>
      {/* Tick marks radiating from bottom center (720, 900) */}
      {Array.from({ length: 17 }, (_, i) => {
        const angle = -180 + i * 11.25
        const rad = (angle * Math.PI) / 180
        const r1 = 580, r2 = 610
        const cx = 720, cy = 900
        return (
          <line
            key={i}
            x1={cx + r1 * Math.cos(rad)} y1={cy + r1 * Math.sin(rad)}
            x2={cx + r2 * Math.cos(rad)} y2={cy + r2 * Math.sin(rad)}
            stroke="#00D4FF" strokeWidth="1"
          />
        )
      })}
      {/* HUD corner frame lines */}
      <path d="M 0 0 L 80 0 L 80 4 L 4 4 L 4 80 L 0 80 Z" fill="#00D4FF"/>
      <path d="M 1440 0 L 1360 0 L 1360 4 L 1436 4 L 1436 80 L 1440 80 Z" fill="#00D4FF"/>
      <path d="M 0 900 L 80 900 L 80 896 L 4 896 L 4 820 L 0 820 Z" fill="#00D4FF"/>
      <path d="M 1440 900 L 1360 900 L 1360 896 L 1436 896 L 1436 820 L 1440 820 Z" fill="#00D4FF"/>
      {/* Horizontal rule lines */}
      <line x1="0" y1="120" x2="200" y2="120" stroke="#0033A0" strokeWidth="1"/>
      <line x1="1240" y1="120" x2="1440" y2="120" stroke="#0033A0" strokeWidth="1"/>
    </svg>
  )
}

/* ── Status dot ─── */
function StatusDot() {
  return (
    <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-hud shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
  )
}

export default function Home() {
  const bestRange   = Math.max(...vehicles.map(v => v.rangeWltp))
  const lowestPrice = Math.min(...vehicles.map(v => v.price.total))
  const updatedAt   = new Date(Math.max(...vehicles.map(v => new Date(v.updatedAt).getTime())))
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const fmtEur = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  const stats = [
    { value: String(vehicles.length),                label: 'VÉHICULES',        accent: true },
    { value: String(new Set(vehicles.map(v => v.brand)).size), label: 'MARQUES', accent: false },
    { value: `${bestRange} km`,                      label: 'MEILL. AUTONOMIE', accent: true },
    { value: fmtEur(lowestPrice),                    label: 'MEILL. PRIX OFFRE',accent: false },
  ]

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#0A1628' }}>
      <DashboardSVG />

      {/* Grid overlay */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(0,51,160,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,51,160,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top accent glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 240, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">

        {/* ── Header: instrument cluster bar ──────────────────── */}
        <header style={{ borderBottom: '1px solid rgba(0,51,160,0.4)', marginBottom: 0, paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

            {/* Left: callsign */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 36, height: 36, display: 'grid', placeItems: 'center',
                background: 'rgba(0,51,160,0.3)', border: '1px solid rgba(0,212,255,0.3)',
                clipPath: 'polygon(8px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 8px)',
              }}>
                <span style={{ fontSize: 16 }}>⚡</span>
              </div>
              <div>
                <div className="font-data" style={{ fontSize: 11, letterSpacing: '0.2em', color: '#00D4FF', textTransform: 'uppercase' }}>
                  MGE-01
                </div>
                <div className="font-data" style={{ fontSize: 9, letterSpacing: '0.15em', color: '#4A6080', textTransform: 'uppercase' }}>
                  Mon Garage Électrique
                </div>
              </div>
            </div>

            {/* Center: title */}
            <h1 className="font-display" style={{ fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', letterSpacing: '-0.03em', color: '#F0F4FF', textAlign: 'center' }}>
              COMPARATIF <span style={{ color: '#00D4FF' }}>VE</span>
            </h1>

            {/* Right: nav links + system status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <Link href="/trajet" className="font-data" style={{ fontSize: 11, letterSpacing: '0.15em', color: '#4A6080', textTransform: 'uppercase', textDecoration: 'none' }}>
                [ TRAJET ]
              </Link>
              <Link href="/tco" className="font-data" style={{ fontSize: 11, letterSpacing: '0.15em', color: '#4A6080', textTransform: 'uppercase', textDecoration: 'none' }}>
                [ TCO ]
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusDot />
                <span className="font-data" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase' }}>
                  SYSTÈME EN LIGNE
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Header scan line — fixed 1px glow separator */}
        <div aria-hidden style={{ height: 1, background: 'linear-gradient(to right, transparent 0%, rgba(0,212,255,0.45) 50%, transparent 100%)', marginBottom: '2.5rem' }} />

        {/* ── Stats row ──────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label} style={{ minWidth: 80 }}>
                <div className="font-data" style={{
                  fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
                  color: s.accent ? '#00D4FF' : '#F0F4FF',
                  textShadow: s.accent ? '0 0 20px rgba(0,212,255,0.4)' : 'none',
                }}>
                  {s.value}
                </div>
                <div className="font-data" style={{ fontSize: 8, letterSpacing: '0.2em', color: '#4A6080', marginTop: 2, textTransform: 'uppercase' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div className="font-data" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 9, letterSpacing: '0.12em', color: '#4A6080',
            padding: '6px 14px',
            border: '1px solid rgba(0,51,160,0.3)',
            borderRadius: 99,
            textTransform: 'uppercase',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00D4FF', boxShadow: '0 0 6px rgba(0,212,255,0.8)', flexShrink: 0 }} />
            MÀJ — {updatedAt}
          </div>
        </div>

        {/* ── Vehicle grid with filters ───────────────────────── */}
        <section style={{ marginBottom: '4rem' }}>
          <VehicleGrid vehicles={vehicles} />
        </section>

        {/* ── Compare table ──────────────────────────────────── */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
            <span className="font-data" style={{ fontSize: 9, letterSpacing: '0.25em', color: '#4A6080', textTransform: 'uppercase' }}>
              TABLEAU DE MISSION
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,51,160,0.3)' }} />
          </div>
          <CompareTable vehicles={vehicles} />
        </section>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid rgba(0,51,160,0.3)', padding: '2rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p className="font-data" style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.1em' }}>
            DONNÉES CATALOGUE FRANCE — PRIX HORS BONUS/PRIME · 📄 = PRIX ISSU D&apos;UN DEVIS
          </p>
          <p className="font-data" style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.1em' }}>
            SOURCES : AUTOMOBILE-PROPRE · L&apos;ARGUS · RENAULT.FR · XPENG.COM · VW.FR
          </p>
        </footer>
      </div>
    </div>
  )
}
