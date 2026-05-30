'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion, useSpring, useTransform } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { vehicles } from '@/data/vehicles'
import { Vehicle } from '@/types/vehicle'

/* ── Brand colors ───────────────────────────────────────────── */
const BRAND_COLOR: Record<string, string> = {
  renault: '#FF6B00', vw: '#60A5FA', skoda: '#4ADE80',
  kia: '#F87171', audi: '#C084FC', xpeng: '#00D4FF', other: '#94A3B8',
}
const BRAND_NAME: Record<string, string> = {
  renault: 'RENAULT', vw: 'VW GROUP', skoda: 'ŠKODA',
  kia: 'KIA', audi: 'AUDI', xpeng: 'XPENG', other: 'UNIT',
}

const fmt = (n: number, d = 0) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: d }).format(n)

/* ── PMT formula ────────────────────────────────────────────── */
function pmt(capital: number, tauxAnnuel: number, mois: number): number {
  if (capital <= 0) return 0
  const r = tauxAnnuel / 12 / 100
  if (r === 0) return capital / mois
  return capital * (r / (1 - Math.pow(1 + r, -mois)))
}

/* ── Animated value ─────────────────────────────────────────── */
function AnimVal({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const sp  = useSpring(0, { stiffness: 80, damping: 25 })
  const txt = useTransform(sp, v => `${prefix}${Math.round(v).toLocaleString('fr-FR')}${suffix}`)
  useEffect(() => { sp.set(target) }, [target, sp])
  return <motion.span>{txt}</motion.span>
}

/* ── HUD Slider ─────────────────────────────────────────────── */
function HudSlider({
  label, value, min, max, step, onChange, display,
}: {
  label: string; value: number; min: number; max: number
  step: number; onChange: (v: number) => void; display: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="font-data" style={{ fontSize: 11, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span className="font-data" style={{ fontSize: 13, fontWeight: 700, color: '#00D4FF' }}>
          {display}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="hud-slider"
        style={{ width: '100%' }}
      />
    </div>
  )
}

/* ── Tooltip personnalisé Recharts ──────────────────────────── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="font-data" style={{ background: '#0d1f3c', border: '1px solid rgba(0,212,255,0.35)', padding: '10px 14px', fontSize: 11, letterSpacing: '0.06em' }}>
      {label !== undefined && (
        <div style={{ color: '#4A6080', marginBottom: 6 }}>{typeof label === 'number' ? `MOIS ${label}` : label}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 3 }}>
          {p.name} : {Math.round(p.value).toLocaleString('fr-FR')} €
        </div>
      ))}
    </div>
  )
}

/* ── Vehicle TCO Card ───────────────────────────────────────── */
function TcoCard({ vehicle, mensualite, energieAnnuel, total5ans, coutKm, isBest }: {
  vehicle: Vehicle; mensualite: number; energieAnnuel: number
  total5ans: number; coutKm: number; isBest: boolean
}) {
  const color    = BRAND_COLOR[vehicle.brand] ?? '#94A3B8'
  const callsign = BRAND_NAME[vehicle.brand]  ?? 'UNIT'
  return (
    <div style={{
      background: '#111827',
      border: `1px solid ${isBest ? 'rgba(0,212,255,0.5)' : '#1f2937'}`,
      clipPath: 'polygon(12px 0%,100% 0%,100% calc(100% - 12px),calc(100% - 12px) 100%,0% 100%,0% 12px)',
      padding: '16px', position: 'relative',
    }}>
      {isBest && (
        <div className="font-data" style={{ position: 'absolute', top: 0, right: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#0A1628', background: '#00D4FF', padding: '3px 10px', textTransform: 'uppercase' }}>
          MEILLEUR TCO ✓
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div className="font-data" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color, background: 'rgba(10,22,40,0.8)', border: `1px solid ${color}40`, padding: '2px 7px', textTransform: 'uppercase', flexShrink: 0 }}>
          ◉ {callsign}
        </div>
        <div className="font-display" style={{ fontWeight: 700, fontSize: 14, color: '#F0F4FF', lineHeight: 1.2 }}>
          {vehicle.model}
        </div>
      </div>

      {/* 4 metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
        {([
          { label: 'MENSUALITÉ',    value: mensualite,  suffix: ' €/m' },
          { label: 'ÉNERGIE / AN',  value: energieAnnuel, suffix: ' €' },
          { label: 'TOTAL 5 ANS',   value: total5ans,   suffix: ' €' },
          { label: '€ / KM',        value: coutKm,      suffix: ' €/km', decimals: true },
        ] as const).map(m => (
          <div key={m.label}>
            <div className="font-data" style={{ fontSize: 10, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
              {m.label}
            </div>
            <div className="font-data" style={{ fontSize: 20, fontWeight: 700, color: m.label === 'TOTAL 5 ANS' ? (isBest ? '#34d399' : '#F0F4FF') : '#F0F4FF', lineHeight: 1 }}>
              {'decimals' in m ? (
                <span>{coutKm.toFixed(2).replace('.', ',')} €/km</span>
              ) : (
                <><AnimVal target={m.value} />{m.suffix}</>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function TcoPage() {
  const [mounted,          setMounted]          = useState(false)
  const [kmAnnuel,         setKmAnnuel]         = useState(15000)
  const [pctAutoroute,     setPctAutoroute]     = useState(20)
  const [apport,           setApport]           = useState(5000)
  const [dureeMois,        setDureeMois]        = useState(48)
  const [taux,             setTaux]             = useState(4.5)
  const [prixKwhDom,       setPrixKwhDom]       = useState(0.22)
  const [prixKwhAuto,      setPrixKwhAuto]      = useState(0.69)
  const [compareThermique, setCompareThermique] = useState(false)
  const [prixEssence,      setPrixEssence]      = useState(1.85)

  useEffect(() => setMounted(true), [])

  /* ── Derived ─────────────────────────────────────────────── */
  const coutMoyenPondere = prixKwhDom * (1 - pctAutoroute / 100) + prixKwhAuto * (pctAutoroute / 100)

  const tcoResults = useMemo(() => vehicles.map(v => {
    const energieAnnuel = kmAnnuel * (v.consumptionKwh / 100) * coutMoyenPondere
    const capital       = Math.max(0, v.price.total - apport)
    const mensualite    = Math.round(pmt(capital, taux, dureeMois))
    const total5ans     = mensualite * dureeMois + energieAnnuel * 5 + 300 * 5
    const coutKm        = total5ans / (kmAnnuel * 5)
    return { vehicle: v, energieAnnuel: Math.round(energieAnnuel), mensualite, total5ans: Math.round(total5ans), coutKm }
  }), [kmAnnuel, coutMoyenPondere, apport, taux, dureeMois])

  const thermiqueResult = useMemo(() => {
    if (!compareThermique) return null
    const capital     = Math.max(0, 35000 - apport)
    const mensualite  = Math.round(pmt(capital, taux, dureeMois))
    const carburant   = Math.round(kmAnnuel * 0.07 * prixEssence)
    const total5ans   = Math.round(mensualite * dureeMois + carburant * 5 + 900 * 5)
    const coutKm      = total5ans / (kmAnnuel * 5)
    return { mensualite, carburant, total5ans, coutKm }
  }, [compareThermique, apport, taux, dureeMois, kmAnnuel, prixEssence])

  const bestTcoId = useMemo(
    () => tcoResults.reduce((best, r) => r.total5ans < best.total5ans ? r : best).vehicle.id,
    [tcoResults]
  )

  /* ── Bar chart data ──────────────────────────────────────── */
  const barData = useMemo(() => {
    const rows = tcoResults.map(r => ({
      name: r.vehicle.model.split(' ').slice(0, 2).join(' '),
      Financement: r.mensualite * dureeMois,
      Énergie: r.energieAnnuel * 5,
      Entretien: 1500,
    }))
    if (thermiqueResult) rows.push({
      name: 'Thermique',
      Financement: thermiqueResult.mensualite * dureeMois,
      Énergie: thermiqueResult.carburant * 5,
      Entretien: 4500,
    })
    return rows
  }, [tcoResults, thermiqueResult, dureeMois])

  /* ── Line chart data ─────────────────────────────────────── */
  const lineData = useMemo(() =>
    Array.from({ length: 61 }, (_, m) => {
      const entry: Record<string, number> = { month: m }
      tcoResults.forEach(r => {
        entry[r.vehicle.id] = Math.round(
          r.mensualite * Math.min(m, dureeMois) +
          (r.energieAnnuel / 12 + 25) * m
        )
      })
      if (thermiqueResult) {
        entry['thermique'] = Math.round(
          thermiqueResult.mensualite * Math.min(m, dureeMois) +
          (thermiqueResult.carburant / 12 + 75) * m
        )
      }
      return entry
    }),
    [tcoResults, thermiqueResult, dureeMois]
  )

  const DUREE_OPTIONS = [24, 36, 48, 60] as const

  /* ── Panel style ─────────────────────────────────────────── */
  const panel: React.CSSProperties = {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: 8,
    padding: '20px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', color: '#F0F4FF' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid rgba(0,51,160,0.4)', padding: '1.5rem 0' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Link href="/" className="font-data" style={{ fontSize: 11, letterSpacing: '0.15em', color: '#4A6080', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span>⚡</span> ← COMPARATIF
          </Link>
          <h1 className="font-display" style={{ fontWeight: 800, fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', letterSpacing: '-0.02em', color: '#F0F4FF', textAlign: 'center' }}>
            TCO — <span style={{ color: '#00D4FF' }}>COÛT 5 ANS</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-hud" style={{ boxShadow: '0 0 8px rgba(0,212,255,0.8)' }} />
            <span className="font-data" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase' }}>
              SYSTÈME EN LIGNE
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">

        {/* ── Sliders ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '2rem' }}>

          {/* Colonne USAGE */}
          <div style={panel}>
            <div className="font-data" style={{ fontSize: 11, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase', marginBottom: 20, borderBottom: '1px solid #1f2937', paddingBottom: 10 }}>
              USAGE
            </div>
            <HudSlider label="KILOMÉTRAGE ANNUEL" value={kmAnnuel} min={5000} max={60000} step={1000} onChange={setKmAnnuel} display={`${kmAnnuel.toLocaleString('fr-FR')} km`} />
            <HudSlider label="% AUTOROUTE" value={pctAutoroute} min={0} max={100} step={5} onChange={setPctAutoroute} display={`${pctAutoroute}%`} />
            <HudSlider label="APPORT INITIAL" value={apport} min={0} max={20000} step={500} onChange={setApport} display={fmt(apport)} />

            <div style={{ marginBottom: 16 }}>
              <div className="font-data" style={{ fontSize: 11, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                DURÉE FINANCEMENT
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {DUREE_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDureeMois(d)}
                    className="font-data"
                    style={{
                      flex: 1, padding: '6px 4px', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      background: dureeMois === d ? '#00D4FF' : '#0d1f3c',
                      color: dureeMois === d ? '#0A1628' : '#4A6080',
                      border: `1px solid ${dureeMois === d ? '#00D4FF' : '#1f2937'}`,
                      borderRadius: 2, cursor: 'pointer',
                    }}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            <HudSlider label="TAUX FINANCEMENT" value={taux} min={0} max={10} step={0.1} onChange={setTaux} display={`${taux.toFixed(1)}%`} />
          </div>

          {/* Colonne ÉNERGIE */}
          <div style={panel}>
            <div className="font-data" style={{ fontSize: 11, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase', marginBottom: 20, borderBottom: '1px solid #1f2937', paddingBottom: 10 }}>
              ÉNERGIE
            </div>
            <HudSlider label="RECHARGE DOMICILE" value={prixKwhDom} min={0.10} max={0.45} step={0.01} onChange={setPrixKwhDom} display={`${prixKwhDom.toFixed(2).replace('.', ',')} €/kWh`} />
            <HudSlider label="BORNE RAPIDE (IONITY, TOTAL…)" value={prixKwhAuto} min={0.35} max={0.90} step={0.01} onChange={setPrixKwhAuto} display={`${prixKwhAuto.toFixed(2).replace('.', ',')} €/kWh`} />

            {/* Coût moyen pondéré */}
            <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 4, padding: '10px 14px', marginBottom: 20 }}>
              <div className="font-data" style={{ fontSize: 11, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                COÛT MOYEN PONDÉRÉ
              </div>
              <div className="font-data" style={{ fontSize: 16, fontWeight: 700, color: '#00D4FF' }}>
                {coutMoyenPondere.toFixed(2).replace('.', ',')} €/kWh
              </div>
            </div>

            {/* Toggle thermique */}
            <div style={{ marginBottom: 16 }}>
              <div className="font-data" style={{ fontSize: 11, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                COMPARER AVEC UN THERMIQUE
              </div>
              <button
                onClick={() => setCompareThermique(v => !v)}
                className="font-data"
                style={{
                  padding: '7px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: compareThermique ? '#FF6B00' : '#0d1f3c',
                  color: compareThermique ? '#0A1628' : '#4A6080',
                  border: `1px solid ${compareThermique ? '#FF6B00' : '#1f2937'}`,
                  borderRadius: 2, cursor: 'pointer',
                }}
              >
                {compareThermique ? '■ ACTIVÉ' : '□ DÉSACTIVÉ'}
              </button>
            </div>

            {compareThermique && (
              <HudSlider label="PRIX ESSENCE (€/L)" value={prixEssence} min={1.50} max={2.50} step={0.01} onChange={setPrixEssence} display={`${prixEssence.toFixed(2).replace('.', ',')} €/L`} />
            )}
          </div>
        </div>

        {/* ── TCO Cards ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '2rem' }}>
          {tcoResults.map(r => (
            <TcoCard
              key={r.vehicle.id}
              vehicle={r.vehicle}
              mensualite={r.mensualite}
              energieAnnuel={r.energieAnnuel}
              total5ans={r.total5ans}
              coutKm={r.coutKm}
              isBest={r.vehicle.id === bestTcoId}
            />
          ))}
        </div>

        {/* ── Charts ─────────────────────────────────────── */}
        {mounted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>

            {/* Bar chart */}
            <div style={panel}>
              <div className="font-data" style={{ fontSize: 11, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase', marginBottom: 20 }}>
                DÉCOMPOSITION COÛT 5 ANS
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart layout="vertical" data={barData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} tickFormatter={v => `${Math.round(v / 1000)}k€`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Bar dataKey="Financement" stackId="a" fill="#00D4FF" animationDuration={1200} />
                  <Bar dataKey="Énergie"     stackId="a" fill="#fbbf24"  animationDuration={1200} />
                  <Bar dataKey="Entretien"   stackId="a" fill="#4b5563"  animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Line chart */}
            <div style={panel}>
              <div className="font-data" style={{ fontSize: 11, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase', marginBottom: 20 }}>
                COÛT CUMULÉ SUR 60 MOIS
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={lineData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} label={{ value: 'MOIS', position: 'insideBottomRight', offset: -10, fill: '#4A6080', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} tickCount={7} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} tickFormatter={v => `${Math.round(v / 1000)}k`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }} />
                  {tcoResults.map(r => (
                    <Line
                      key={r.vehicle.id}
                      type="monotone"
                      dataKey={r.vehicle.id}
                      name={r.vehicle.model}
                      stroke={BRAND_COLOR[r.vehicle.brand] ?? '#94A3B8'}
                      strokeWidth={2}
                      dot={false}
                      animationDuration={1500}
                    />
                  ))}
                  {compareThermique && thermiqueResult && (
                    <Line
                      type="monotone"
                      dataKey="thermique"
                      name="Thermique (35k€)"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                      animationDuration={1500}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Disclaimer ─────────────────────────────────── */}
        <p className="font-data" style={{ fontSize: 10, color: '#4A6080', textAlign: 'center', letterSpacing: '0.06em', lineHeight: 1.6 }}>
          Simulation indicative. Assurance, dépréciation et coûts imprévus non inclus.
        </p>
      </div>
    </div>
  )
}
