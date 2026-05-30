'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion, useSpring, useTransform } from 'framer-motion'
import { vehicles } from '@/data/vehicles'
import { Vehicle } from '@/types/vehicle'

/* ── Constants ──────────────────────────────────────────────── */
const BRAND_COLOR: Record<string, string> = {
  renault: '#FF6B00', vw: '#60A5FA', skoda: '#4ADE80',
  kia: '#F87171', audi: '#C084FC', xpeng: '#00D4FF', other: '#94A3B8',
}
const BRAND_NAME: Record<string, string> = {
  renault: 'RENAULT', vw: 'VW GROUP', skoda: 'ŠKODA',
  kia: 'KIA', audi: 'AUDI', xpeng: 'XPENG', other: 'UNIT',
}

/* ── Types ──────────────────────────────────────────────────── */
interface Place { name: string; lat: number; lon: number }
interface NomResult { display_name: string; lat: string; lon: string }
interface JourneyResult {
  vehicle: Vehicle
  stops: number
  driveMin: number
  chargeMin: number
  totalMin: number
  arrivalTime: string
  distanceKm: number
}

/* ── Helpers ────────────────────────────────────────────────── */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, r = Math.PI / 180
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.25
}

function fmtMin(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}h${String(min).padStart(2, '0')}` : `${m}min`
}

function calcJourneys(distKm: number, routeType: 'autoroute' | 'mixte'): JourneyResult[] {
  const vitesse = routeType === 'autoroute' ? 115 : 80
  return vehicles.map(v => {
    const autonomie = routeType === 'autoroute' ? v.rangeHighway : v.rangeWltp
    const stops    = Math.max(0, Math.ceil(distKm / (autonomie * 0.85)) - 1)
    const driveMin  = Math.round(distKm / vitesse * 60)
    const chargeMin = stops * v.chargeTime1080
    const totalMin  = driveMin + chargeMin
    const arrival   = new Date(Date.now() + totalMin * 60_000)
    return {
      vehicle: v, stops, driveMin, chargeMin, totalMin,
      distanceKm: distKm,
      arrivalTime: arrival.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }
  })
}

/* ── AnimatedTime ───────────────────────────────────────────── */
function AnimatedTime({ target }: { target: number }) {
  const sp  = useSpring(0, { stiffness: 60, damping: 20, mass: 0.8 })
  const txt = useTransform(sp, v => fmtMin(Math.round(v)))
  useEffect(() => { sp.set(target) }, [target, sp])
  return <motion.span>{txt}</motion.span>
}

/* ── RouteLine SVG ──────────────────────────────────────────── */
function RouteLine({ stops, color }: { stops: number; color: string }) {
  const W = 300, y = 18, r = 5
  const positions = Array.from({ length: stops }, (_, i) => 20 + ((i + 1) / (stops + 1)) * 260)

  return (
    <svg viewBox={`0 0 ${W} 36`} width="100%" height="36" style={{ overflow: 'visible' }}>
      <line x1={20} y1={y} x2={280} y2={y} stroke="#1f2937" strokeWidth={2} />
      <rect x={12} y={y - 5} width={9} height={9} fill="#34d399" />
      <rect x={279} y={y - 5} width={9} height={9} fill="#34d399" />
      {positions.map((x, i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={0.85} />
      ))}
    </svg>
  )
}

/* ── JourneyCard ────────────────────────────────────────────── */
function JourneyCard({
  r, rank,
}: {
  r: JourneyResult
  rank: number
}) {
  const color    = BRAND_COLOR[r.vehicle.brand] ?? '#94A3B8'
  const callsign = BRAND_NAME[r.vehicle.brand]  ?? 'UNIT'
  const isBest   = rank === 1

  return (
    <div style={{
      background: '#111827',
      border: `1px solid ${isBest ? 'rgba(0,212,255,0.45)' : '#1f2937'}`,
      clipPath: 'polygon(12px 0%,100% 0%,100% calc(100% - 12px),calc(100% - 12px) 100%,0% 100%,0% 12px)',
      padding: '16px',
      position: 'relative',
    }}>
      {isBest && (
        <div className="font-data" style={{ position: 'absolute', top: 0, right: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#0A1628', background: '#00D4FF', padding: '3px 10px', textTransform: 'uppercase' }}>
          PLUS RAPIDE
        </div>
      )}

      {/* Header: brand + model */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div className="font-data" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color, background: 'rgba(10,22,40,0.8)', border: `1px solid ${color}40`, padding: '2px 7px', textTransform: 'uppercase', flexShrink: 0 }}>
          ◉ {callsign}
        </div>
        <div className="font-display" style={{ fontWeight: 700, fontSize: 14, color: '#F0F4FF', lineHeight: 1.2 }}>
          {r.vehicle.model}
        </div>
      </div>

      {/* Route SVG */}
      <div style={{ marginBottom: 6 }}>
        <RouteLine stops={r.stops} color={r.stops > 0 ? '#FF6B00' : color} />
      </div>

      {/* Distance */}
      <div className="font-data" style={{ fontSize: 11, color: '#4A6080', marginBottom: 14, letterSpacing: '0.08em' }}>
        {Math.round(r.distanceKm)} km · conduite {fmtMin(r.driveMin)}
        {r.stops > 0 && ` · charge ${fmtMin(r.chargeMin)}`}
      </div>

      {/* Stops badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          background: r.stops === 0 ? 'rgba(52,211,153,0.12)' : 'rgba(255,107,0,0.12)',
          border: `1px solid ${r.stops === 0 ? 'rgba(52,211,153,0.35)' : 'rgba(255,107,0,0.35)'}`,
          borderRadius: 2,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.stops === 0 ? '#34d399' : '#FF6B00', flexShrink: 0 }} />
          <span className="font-data" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: r.stops === 0 ? '#34d399' : '#FF6B00', textTransform: 'uppercase' }}>
            {r.stops === 0 ? 'TRAJET DIRECT ✓' : `${r.stops} ARRÊT${r.stops > 1 ? 'S' : ''}`}
          </span>
        </div>

        {/* Total time */}
        <div style={{ textAlign: 'right' }}>
          <div className="font-data" style={{ fontSize: 28, fontWeight: 700, color: '#F0F4FF', lineHeight: 1 }}>
            <AnimatedTime target={r.totalMin} />
          </div>
          <div className="font-data" style={{ fontSize: 13, color: '#00D4FF', marginTop: 3, letterSpacing: '0.08em' }}>
            Arrivée ~{r.arrivalTime}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Autocomplete input ─────────────────────────────────────── */
function PlaceInput({
  label, value, onChange, suggestions, onSelect, showDropdown, onFocus, onBlur,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suggestions: NomResult[]
  onSelect: (p: Place) => void
  showDropdown: boolean
  onFocus: () => void
  onBlur: () => void
}) {
  return (
    <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
      <div className="font-data" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#4A6080', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Paris, Lyon, Marseille..."
        className="font-data"
        style={{
          width: '100%', padding: '10px 12px', fontSize: 13,
          background: '#0d1f3c', border: '1px solid #1f2937', borderRadius: 2, color: '#F0F4FF',
          outline: 'none', letterSpacing: '0.03em',
        }}
      />
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#0d1f3c', border: '1px solid rgba(0,212,255,0.3)',
          marginTop: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={e => {
                e.preventDefault()
                onSelect({ name: s.display_name, lat: parseFloat(s.lat), lon: parseFloat(s.lon) })
              }}
              className="font-data"
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', fontSize: 11, color: '#F0F4FF',
                background: 'none', border: 'none', borderBottom: '1px solid rgba(0,51,160,0.2)',
                cursor: 'pointer', letterSpacing: '0.03em',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function TrajetPage() {
  const [departQuery,    setDepartQuery]    = useState('')
  const [arriveeQuery,   setArriveeQuery]   = useState('')
  const [departSugs,     setDepartSugs]     = useState<NomResult[]>([])
  const [arriveeSugs,    setArriveeSugs]    = useState<NomResult[]>([])
  const [departCoords,   setDepartCoords]   = useState<Place | null>(null)
  const [arriveeCoords,  setArriveeCoords]  = useState<Place | null>(null)
  const [showDepartDrop, setShowDepartDrop] = useState(false)
  const [showArriveeDrop,setShowArriveeDrop]= useState(false)
  const [routeType,      setRouteType]      = useState<'autoroute' | 'mixte'>('autoroute')
  const [results,        setResults]        = useState<JourneyResult[] | null>(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')

  const departTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arriveeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSugs = useCallback(async (q: string, setter: (r: NomResult[]) => void) => {
    if (q.trim().length < 3) { setter([]); return }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=fr`,
        { headers: { 'Accept': 'application/json' } }
      )
      setter(await res.json())
    } catch { setter([]) }
  }, [])

  const handleDepartChange = (v: string) => {
    setDepartQuery(v)
    setDepartCoords(null)
    if (departTimer.current) clearTimeout(departTimer.current)
    departTimer.current = setTimeout(() => fetchSugs(v, sugs => { setDepartSugs(sugs); if (sugs.length) setShowDepartDrop(true) }), 300)
  }

  const handleArriveeChange = (v: string) => {
    setArriveeQuery(v)
    setArriveeCoords(null)
    if (arriveeTimer.current) clearTimeout(arriveeTimer.current)
    arriveeTimer.current = setTimeout(() => fetchSugs(v, sugs => { setArriveeSugs(sugs); if (sugs.length) setShowArriveeDrop(true) }), 300)
  }

  async function simulate() {
    if (!departCoords || !arriveeCoords) {
      setError('Sélectionne une ville dans les suggestions pour chaque champ.')
      return
    }
    setError('')
    setLoading(true)
    const dist = haversine(departCoords.lat, departCoords.lon, arriveeCoords.lat, arriveeCoords.lon)
    setResults(calcJourneys(dist, routeType))
    setLoading(false)
  }

  const sorted = results ? [...results].sort((a, b) => a.totalMin - b.totalMin) : null

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', color: '#F0F4FF' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid rgba(0,51,160,0.4)', padding: '1.5rem 0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

          <Link href="/" className="font-data" style={{ fontSize: 11, letterSpacing: '0.15em', color: '#4A6080', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span>⚡</span> ← COMPARATIF
          </Link>

          <h1 className="font-display" style={{ fontWeight: 800, fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', letterSpacing: '-0.02em', color: '#F0F4FF', textAlign: 'center' }}>
            SIMULATEUR DE <span style={{ color: '#00D4FF' }}>TRAJET</span>
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-hud" style={{ boxShadow: '0 0 8px rgba(0,212,255,0.8)' }} />
            <span className="font-data" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase' }}>
              SYSTÈME EN LIGNE
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">

        {/* ── Input section ──────────────────────────────── */}
        <section style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 4, padding: '24px', marginBottom: '2rem' }}>

          {/* Departure / Arrival */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <PlaceInput
              label="DÉPART"
              value={departQuery}
              onChange={handleDepartChange}
              suggestions={departSugs}
              onSelect={p => { setDepartCoords(p); setDepartQuery(p.name.split(',')[0]); setShowDepartDrop(false) }}
              showDropdown={showDepartDrop}
              onFocus={() => departSugs.length > 0 && setShowDepartDrop(true)}
              onBlur={() => setTimeout(() => setShowDepartDrop(false), 150)}
            />
            <PlaceInput
              label="ARRIVÉE"
              value={arriveeQuery}
              onChange={handleArriveeChange}
              suggestions={arriveeSugs}
              onSelect={p => { setArriveeCoords(p); setArriveeQuery(p.name.split(',')[0]); setShowArriveeDrop(false) }}
              showDropdown={showArriveeDrop}
              onFocus={() => arriveeSugs.length > 0 && setShowArriveeDrop(true)}
              onBlur={() => setTimeout(() => setShowArriveeDrop(false), 150)}
            />
          </div>

          {/* Route type toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <div className="font-data" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#4A6080', textTransform: 'uppercase', alignSelf: 'center', marginRight: 4 }}>
              MODE :
            </div>
            {(['autoroute', 'mixte'] as const).map(t => (
              <button
                key={t}
                onClick={() => setRouteType(t)}
                className="font-data"
                style={{
                  padding: '7px 16px', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  background: routeType === t ? '#00D4FF' : '#0d1f3c',
                  color: routeType === t ? '#0A1628' : '#4A6080',
                  border: `1px solid ${routeType === t ? '#00D4FF' : '#1f2937'}`,
                  borderRadius: 2, cursor: 'pointer',
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="font-data" style={{ fontSize: 11, color: '#FF6B00', marginBottom: 12, letterSpacing: '0.08em' }}>{error}</p>
          )}

          {/* Simulate button */}
          <button
            onClick={simulate}
            disabled={loading}
            className="font-display"
            style={{
              width: '100%', padding: '14px', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: loading ? '#1f2937' : '#00D4FF',
              color: loading ? '#4A6080' : '#0A1628',
              border: 'none', borderRadius: 2, cursor: loading ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'CALCUL EN COURS...' : 'SIMULER LE TRAJET'}
          </button>
        </section>

        {/* ── Results ────────────────────────────────────── */}
        {results && sorted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
              <span className="font-data" style={{ fontSize: 9, letterSpacing: '0.25em', color: '#4A6080', textTransform: 'uppercase' }}>
                RÉSULTATS — {Math.round(results[0].distanceKm)} km
                {routeType === 'autoroute' ? ' · AUTOROUTE · 115 km/h' : ' · MIXTE · 80 km/h'}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,51,160,0.3)' }} />
            </div>

            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '2rem' }}>
              {results.map(r => {
                const rank = sorted.findIndex(s => s.vehicle.id === r.vehicle.id) + 1
                return <JourneyCard key={r.vehicle.id} r={r} rank={rank} />
              })}
            </div>

            {/* ── Classement ──────────────────────────────── */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 4, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <span className="font-data" style={{ fontSize: 9, letterSpacing: '0.25em', color: '#4A6080', textTransform: 'uppercase' }}>CLASSEMENT</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,51,160,0.3)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sorted.map((r, i) => {
                  const delta  = r.totalMin - sorted[0].totalMin
                  const color  = BRAND_COLOR[r.vehicle.brand] ?? '#94A3B8'
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div key={r.vehicle.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: i === 0 ? 'rgba(0,212,255,0.06)' : 'rgba(0,51,160,0.06)', border: `1px solid ${i === 0 ? 'rgba(0,212,255,0.25)' : '#1f2937'}`, borderRadius: 2 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{medals[i] ?? `${i + 1}.`}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-display" style={{ fontWeight: 700, fontSize: 13, color: i === 0 ? '#00D4FF' : '#F0F4FF' }}>
                          {r.vehicle.model}
                        </div>
                        <div className="font-data" style={{ fontSize: 11, color }}>
                          {BRAND_NAME[r.vehicle.brand] ?? 'UNIT'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="font-data" style={{ fontSize: 16, fontWeight: 700, color: i === 0 ? '#00D4FF' : '#F0F4FF' }}>
                          {fmtMin(r.totalMin)}
                        </div>
                        {delta > 0 && (
                          <div className="font-data" style={{ fontSize: 11, color: '#FF6B00', marginTop: 1 }}>
                            +{delta} min
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Disclaimer ─────────────────────────────────── */}
        <p className="font-data" style={{ fontSize: 10, color: '#4A6080', textAlign: 'center', marginTop: '3rem', letterSpacing: '0.06em', lineHeight: 1.6 }}>
          Calcul estimatif · Distance Haversine ×1.25 · Source données : OpenStreetMap
        </p>
      </div>
    </div>
  )
}
