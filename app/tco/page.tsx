'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion, useSpring, useTransform } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { vehicles } from '@/data/vehicles'

/* ── Constants ──────────────────────────────────────────────── */
const SG = "'Space Grotesk', sans-serif"

const BRAND_COLOR: Record<string, string> = {
  renault: '#FF6B00', vw: '#60A5FA', skoda: '#4ADE80',
  kia: '#F87171', audi: '#C084FC', xpeng: '#00D4FF', other: '#94A3B8',
}
const BRAND_NAME: Record<string, string> = {
  renault: 'RENAULT', vw: 'VW GROUP', skoda: 'ŠKODA',
  kia: 'KIA', audi: 'AUDI', xpeng: 'XPENG', other: 'UNIT',
}

const fmt  = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const fmtK = (n: number) => `${Math.round(n / 1000)}k€`

/* ── PMT ────────────────────────────────────────────────────── */
function pmt(capital: number, tauxAnnuel: number, mois: number): number {
  if (capital <= 0) return 0
  const r = tauxAnnuel / 12 / 100
  if (r === 0) return capital / mois
  return capital * (r / (1 - Math.pow(1 + r, -mois)))
}

/* ── Animated value ─────────────────────────────────────────── */
function AnimVal({ target, suffix = '' }: { target: number; suffix?: string }) {
  const sp  = useSpring(0, { stiffness: 80, damping: 25 })
  const txt = useTransform(sp, v => `${Math.round(v).toLocaleString('fr-FR')}${suffix}`)
  useEffect(() => { sp.set(target) }, [target, sp])
  return <motion.span>{txt}</motion.span>
}

/* ── HUD Slider ─────────────────────────────────────────────── */
function HudSlider({
  label, value, min, max, step, onChange, display, disabled = false,
}: {
  label: string; value: number; min: number; max: number
  step: number; onChange: (v: number) => void; display: string; disabled?: boolean
}) {
  return (
    <div style={{ marginBottom: 16, opacity: disabled ? 0.38 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: SG, fontSize: 12, color: '#4A6080', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
          {label}
        </span>
        <span style={{ fontFamily: SG, fontSize: 13, fontWeight: 700, color: '#00D4FF' }}>
          {display}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="hud-slider" style={{ width: '100%' }}
      />
    </div>
  )
}

/* ── Number input ───────────────────────────────────────────── */
function NumInput({
  label, value, onChange, min = 0, placeholder = '0',
}: {
  label: string; value: number; onChange: (v: number) => void; min?: number; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: SG, fontSize: 12, color: '#4A6080', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
        {label}
      </div>
      <input
        type="number" min={min} value={value || ''}
        placeholder={placeholder}
        onChange={e => onChange(Math.max(min, Number(e.target.value) || 0))}
        style={{
          width: '100%', padding: '9px 12px', fontFamily: SG, fontSize: 13, fontWeight: 700,
          background: '#0d1f3c', border: '1px solid #1f2937', color: '#F0F4FF',
          outline: 'none', borderRadius: 2,
        }}
      />
    </div>
  )
}

/* ── Toggle button ──────────────────────────────────────────── */
function Toggle({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!active)}
      style={{
        padding: '8px 16px', fontFamily: SG, fontSize: 12, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase' as const,
        background: active ? '#00D4FF' : '#0d1f3c',
        color: active ? '#0A1628' : '#4A6080',
        border: `1px solid ${active ? '#00D4FF' : '#1f2937'}`,
        borderRadius: 2, cursor: 'pointer', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <span style={{ fontSize: 10 }}>{active ? '■' : '□'}</span>
      {label}
    </button>
  )
}

/* ── Recharts tooltip ───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0d1f3c', border: '1px solid rgba(0,212,255,0.3)', padding: '10px 14px', fontFamily: SG, fontSize: 12 }}>
      {label !== undefined && (
        <div style={{ color: '#4A6080', marginBottom: 6 }}>
          {typeof label === 'number' ? `MOIS ${label}` : label}
        </div>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 3 }}>
          {p.name} : {Math.round(p.value).toLocaleString('fr-FR')} €
        </div>
      ))}
    </div>
  )
}

/* ── TCO Card ───────────────────────────────────────────────── */
function TcoCard({ vehicle, capital, mensualite, energieAnnuelle, total5ans, coutKm, isBest }: {
  vehicle: typeof vehicles[0]
  capital: number
  mensualite: number
  energieAnnuelle: number
  total5ans: number
  coutKm: number
  isBest: boolean
}) {
  const color    = BRAND_COLOR[vehicle.brand] ?? '#94A3B8'
  const callsign = BRAND_NAME[vehicle.brand]  ?? 'UNIT'
  const isComptant = capital === 0

  return (
    <div style={{
      background: '#111827',
      border: `1px solid ${isBest ? 'rgba(0,212,255,0.5)' : '#1f2937'}`,
      clipPath: 'polygon(12px 0%,100% 0%,100% calc(100% - 12px),calc(100% - 12px) 100%,0% 100%,0% 12px)',
      padding: '16px', position: 'relative',
    }}>
      {isBest && (
        <div style={{ position: 'absolute', top: 0, right: 0, fontFamily: SG, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#0A1628', background: '#00D4FF', padding: '3px 10px', textTransform: 'uppercase' as const }}>
          MEILLEUR TCO ✓
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color, background: 'rgba(10,22,40,0.8)', border: `1px solid ${color}40`, padding: '2px 7px', textTransform: 'uppercase' as const, flexShrink: 0 }}>
          ◉ {callsign}
        </div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: '#F0F4FF', lineHeight: 1.2 }}>
          {vehicle.model}
        </div>
      </div>

      {/* 4 metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
        <div>
          <div style={{ fontFamily: SG, fontSize: 11, color: '#4A6080', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 3 }}>MENSUALITÉ</div>
          <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 700, color: isComptant ? '#34d399' : '#F0F4FF', lineHeight: 1 }}>
            {isComptant ? <span>COMPTANT</span> : <><AnimVal target={mensualite} /> €/m</>}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: SG, fontSize: 11, color: '#4A6080', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 3 }}>ÉNERGIE / AN</div>
          <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 700, color: '#F0F4FF', lineHeight: 1 }}>
            <AnimVal target={energieAnnuelle} suffix=" €" />
          </div>
        </div>
        <div>
          <div style={{ fontFamily: SG, fontSize: 11, color: '#4A6080', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 3 }}>TOTAL 5 ANS</div>
          <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 700, color: isBest ? '#34d399' : '#F0F4FF', lineHeight: 1 }}>
            <AnimVal target={total5ans} suffix=" €" />
          </div>
        </div>
        <div>
          <div style={{ fontFamily: SG, fontSize: 11, color: '#4A6080', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 3 }}>€ / KM</div>
          <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 700, color: '#F0F4FF', lineHeight: 1 }}>
            {coutKm.toFixed(2).replace('.', ',')} €
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function TcoPage() {
  const [mounted, setMounted] = useState(false)

  /* Financement */
  const [apport,     setApport]     = useState(5000)
  const [reprise,    setReprise]    = useState(0)
  const [cash,       setCash]       = useState(0)
  const [dureeMois,  setDureeMois]  = useState(48)
  const [taux,       setTaux]       = useState(4.5)
  const [kmAnnuel,   setKmAnnuel]   = useState(15000)

  /* Énergie */
  const [domicileActif, setDomicileActif] = useState(true)
  const [pctDomicile,   setPctDomicile]   = useState(80)
  const [prixKwhDom,    setPrixKwhDom]    = useState(0.22)
  const [prixKwhBorne,  setPrixKwhBorne]  = useState(0.69)

  /* Thermique */
  const [compareThermique,   setCompareThermique]   = useState(false)
  const [consoL100,          setConsoL100]          = useState(7)
  const [prixEssence,        setPrixEssence]        = useState(1.85)
  const [entretienThermique, setEntretienThermique] = useState(900)
  const [prixThermique,      setPrixThermique]      = useState(35000)

  useEffect(() => setMounted(true), [])

  /* ── Derived ─────────────────────────────────────────────── */
  const apportTotal = useMemo(() => apport + reprise + cash, [apport, reprise, cash])

  const coutMoyenPondere = useMemo(() =>
    domicileActif
      ? prixKwhDom * (pctDomicile / 100) + prixKwhBorne * (1 - pctDomicile / 100)
      : prixKwhBorne,
    [domicileActif, prixKwhDom, pctDomicile, prixKwhBorne]
  )

  const tcoResults = useMemo(() => vehicles.map(v => {
    const capital        = Math.max(0, v.price.total - apportTotal)
    const mensualite     = Math.round(pmt(capital, taux, dureeMois))
    const energieAnnuelle = Math.round(kmAnnuel * (v.consumptionKwh / 100) * coutMoyenPondere)
    const total5ans      = Math.round(mensualite * dureeMois + energieAnnuelle * 5 + 300 * 5)
    const coutKm         = total5ans / (kmAnnuel * 5)
    return { vehicle: v, capital, mensualite, energieAnnuelle, total5ans, coutKm }
  }), [apportTotal, taux, dureeMois, kmAnnuel, coutMoyenPondere])

  const thermiqueResult = useMemo(() => {
    if (!compareThermique) return null
    const capital       = Math.max(0, prixThermique - apportTotal)
    const mensualite    = Math.round(pmt(capital, taux, dureeMois))
    const carburantAnn  = Math.round(kmAnnuel * (consoL100 / 100) * prixEssence)
    const total5ans     = Math.round(mensualite * dureeMois + carburantAnn * 5 + entretienThermique * 5)
    const coutKm        = total5ans / (kmAnnuel * 5)
    return { capital, mensualite, carburantAnn, total5ans, coutKm }
  }, [compareThermique, prixThermique, apportTotal, taux, dureeMois, kmAnnuel, consoL100, prixEssence, entretienThermique])

  const bestTcoId = useMemo(
    () => tcoResults.reduce((b, r) => r.total5ans < b.total5ans ? r : b).vehicle.id,
    [tcoResults]
  )

  /* ── Chart data ──────────────────────────────────────────── */
  const barData = useMemo(() => {
    const rows = tcoResults.map(r => ({
      name: r.vehicle.model.split(' ').slice(0, 2).join(' '),
      Financement: r.mensualite * dureeMois,
      Énergie: r.energieAnnuelle * 5,
      Entretien: 1500,
    }))
    if (thermiqueResult) rows.push({
      name: 'Thermique',
      Financement: thermiqueResult.mensualite * dureeMois,
      Énergie: thermiqueResult.carburantAnn * 5,
      Entretien: entretienThermique * 5,
    })
    return rows
  }, [tcoResults, thermiqueResult, dureeMois, entretienThermique])

  const lineData = useMemo(() =>
    Array.from({ length: 61 }, (_, m) => {
      const e: Record<string, number> = { month: m }
      tcoResults.forEach(r => {
        e[r.vehicle.id] = Math.round(
          r.mensualite * Math.min(m, dureeMois) +
          (r.energieAnnuelle / 12 + 25) * m
        )
      })
      if (thermiqueResult) {
        e['thermique'] = Math.round(
          thermiqueResult.mensualite * Math.min(m, dureeMois) +
          (thermiqueResult.carburantAnn / 12 + entretienThermique / 12) * m
        )
      }
      return e
    }),
    [tcoResults, thermiqueResult, dureeMois, entretienThermique]
  )

  const DUREE = [24, 36, 48, 60] as const
  const panel: React.CSSProperties = { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '20px' }
  const sectionLabel: React.CSSProperties = { fontFamily: SG, fontSize: 11, letterSpacing: '0.18em', color: '#4A6080', textTransform: 'uppercase', marginBottom: 18, borderBottom: '1px solid #1f2937', paddingBottom: 10, display: 'block' }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', color: '#F0F4FF' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid rgba(0,51,160,0.4)', padding: '1.5rem 0' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Link href="/" style={{ fontFamily: SG, fontSize: 12, letterSpacing: '0.12em', color: '#4A6080', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            ⚡ ← COMPARATIF
          </Link>
          <h1 className="font-display" style={{ fontWeight: 800, fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', letterSpacing: '-0.02em', color: '#F0F4FF', textAlign: 'center' }}>
            TCO — <span style={{ color: '#00D4FF' }}>COÛT 5 ANS</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-hud" style={{ boxShadow: '0 0 8px rgba(0,212,255,0.8)' }} />
            <span style={{ fontFamily: SG, fontSize: 10, letterSpacing: '0.18em', color: '#4A6080', textTransform: 'uppercase' }}>
              SYSTÈME EN LIGNE
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">

        {/* ── Panneaux de configuration ──────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '2rem' }}>

          {/* ── Colonne FINANCEMENT ───────────────────────── */}
          <div style={panel}>
            <span style={sectionLabel}>FINANCEMENT</span>

            <HudSlider
              label="Apport initial"
              value={apport} min={0} max={20000} step={500}
              onChange={setApport}
              display={fmt(apport)}
            />

            <NumInput label="Reprise véhicule" value={reprise} onChange={setReprise} />
            <div style={{ fontFamily: SG, fontSize: 13, fontWeight: 700, color: '#00D4FF', marginTop: -8, marginBottom: 16 }}>
              Apport total : {fmt(apport)} + {fmt(reprise)} = {fmt(apport + reprise)}
            </div>

            <NumInput label="Rajout en cash" value={cash} onChange={setCash} />
            <div style={{ fontFamily: SG, fontSize: 12, color: '#4A6080', marginTop: -8, marginBottom: 16 }}>
              Capital financé = prix − {fmt(apportTotal)} € / véhicule
            </div>

            {/* Durée */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: SG, fontSize: 12, color: '#4A6080', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                DURÉE FINANCEMENT
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {DUREE.map(d => (
                  <button
                    key={d}
                    onClick={() => setDureeMois(d)}
                    style={{
                      flex: 1, padding: '7px 4px', fontFamily: SG, fontSize: 12, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase' as const,
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

            <HudSlider
              label="Taux financement"
              value={taux} min={0} max={10} step={0.1}
              onChange={setTaux}
              display={`${taux.toFixed(1)}%`}
            />

            <HudSlider
              label="Kilométrage annuel"
              value={kmAnnuel} min={5000} max={60000} step={1000}
              onChange={setKmAnnuel}
              display={`${kmAnnuel.toLocaleString('fr-FR')} km`}
            />
          </div>

          {/* ── Colonne ÉNERGIE ───────────────────────────── */}
          <div style={panel}>
            <span style={sectionLabel}>ÉNERGIE</span>

            <Toggle label="RECHARGE À DOMICILE" active={domicileActif} onChange={setDomicileActif} />

            <HudSlider
              label="Recharge domicile"
              value={prixKwhDom} min={0.10} max={0.45} step={0.01}
              onChange={setPrixKwhDom}
              display={`${prixKwhDom.toFixed(2).replace('.', ',')} €/kWh`}
              disabled={!domicileActif}
            />

            <HudSlider
              label="% recharge à domicile"
              value={pctDomicile} min={0} max={100} step={5}
              onChange={setPctDomicile}
              display={`${pctDomicile}% dom · ${100 - pctDomicile}% borne`}
              disabled={!domicileActif}
            />

            <HudSlider
              label="Borne publique / rapide"
              value={prixKwhBorne} min={0.35} max={0.90} step={0.01}
              onChange={setPrixKwhBorne}
              display={`${prixKwhBorne.toFixed(2).replace('.', ',')} €/kWh`}
            />

            {/* Coût moyen pondéré */}
            <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 4, padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ fontFamily: SG, fontSize: 11, color: '#4A6080', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                COÛT MOYEN PONDÉRÉ {!domicileActif && '(borne uniquement)'}
              </div>
              <div style={{ fontFamily: SG, fontSize: 16, fontWeight: 700, color: '#00D4FF' }}>
                {coutMoyenPondere.toFixed(2).replace('.', ',')} €/kWh
              </div>
            </div>

            {/* Toggle thermique */}
            <Toggle label="COMPARER AVEC UN THERMIQUE" active={compareThermique} onChange={v => { setCompareThermique(v) }} />

            {compareThermique && (
              <div style={{ borderTop: '1px solid #1f2937', paddingTop: 16 }}>
                <NumInput label="Prix véhicule thermique (€)" value={prixThermique} onChange={setPrixThermique} min={1000} placeholder="35000" />

                <HudSlider
                  label="Conso L/100km"
                  value={consoL100} min={5} max={12} step={0.5}
                  onChange={setConsoL100}
                  display={`${consoL100.toFixed(1)}L/100`}
                />

                <HudSlider
                  label="Prix essence (€/L)"
                  value={prixEssence} min={1.50} max={2.50} step={0.05}
                  onChange={setPrixEssence}
                  display={`${prixEssence.toFixed(2).replace('.', ',')} €/L`}
                />

                <HudSlider
                  label="Entretien annuel"
                  value={entretienThermique} min={500} max={1500} step={50}
                  onChange={setEntretienThermique}
                  display={`${entretienThermique.toLocaleString('fr-FR')} €/an`}
                />

                <div style={{ fontFamily: SG, fontSize: 12, color: '#4A6080', marginTop: -8, marginBottom: 4 }}>
                  Capital financé : {fmt(Math.max(0, prixThermique - apportTotal))}
                  {thermiqueResult && <> · {fmt(thermiqueResult.mensualite)}/m</>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── TCO Cards ──────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
          <span style={{ fontFamily: SG, fontSize: 10, letterSpacing: '0.22em', color: '#4A6080', textTransform: 'uppercase' }}>RÉSULTATS TCO</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,51,160,0.3)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '2rem' }}>
          {tcoResults.map(r => (
            <TcoCard
              key={r.vehicle.id}
              vehicle={r.vehicle}
              capital={r.capital}
              mensualite={r.mensualite}
              energieAnnuelle={r.energieAnnuelle}
              total5ans={r.total5ans}
              coutKm={r.coutKm}
              isBest={r.vehicle.id === bestTcoId}
            />
          ))}
        </div>

        {/* ── Graphiques ─────────────────────────────────── */}
        {mounted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>

            {/* Bar chart */}
            <div style={panel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontFamily: SG, fontSize: 10, letterSpacing: '0.22em', color: '#4A6080', textTransform: 'uppercase' }}>DÉCOMPOSITION COÛT 5 ANS</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,51,160,0.3)' }} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={barData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: SG }} tickFormatter={fmtK} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: SG }} width={100} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: SG, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }} />
                  <Bar dataKey="Financement" stackId="a" fill="#00D4FF" animationDuration={1200} />
                  <Bar dataKey="Énergie"     stackId="a" fill="#fbbf24"  animationDuration={1200} />
                  <Bar dataKey="Entretien"   stackId="a" fill="#4b5563"  animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Line chart */}
            <div style={panel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontFamily: SG, fontSize: 10, letterSpacing: '0.22em', color: '#4A6080', textTransform: 'uppercase' }}>COÛT CUMULÉ SUR 60 MOIS</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,51,160,0.3)' }} />
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={lineData} margin={{ top: 0, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: SG }}
                    label={{ value: 'MOIS', position: 'insideBottomRight', offset: -10, fill: '#4A6080', fontSize: 11, fontFamily: SG }}
                    axisLine={false} tickLine={false} tickCount={7}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: SG }}
                    tickFormatter={v => `${Math.round(v / 1000)}k€`}
                    axisLine={false} tickLine={false}
                    label={{ value: '€ CUMULÉS', angle: -90, position: 'insideLeft', fill: '#4A6080', fontSize: 11, fontFamily: SG }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: SG, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }} />
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
                      name={`Thermique ${fmt(prixThermique)}`}
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

        <p style={{ fontFamily: SG, fontSize: 11, color: '#4A6080', textAlign: 'center', letterSpacing: '0.06em', lineHeight: 1.6 }}>
          Simulation indicative — Assurance, dépréciation et coûts imprévus non inclus.
        </p>
      </div>
    </div>
  )
}
