'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion, useSpring, useTransform } from 'framer-motion'
import { vehicles } from '@/data/vehicles'
import { Vehicle } from '@/types/vehicle'

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

/* ── Types ──────────────────────────────────────────────────── */
interface Place { label: string; lat: number; lon: number }

interface NomResult {
  display_name: string
  lat: string
  lon: string
}

interface JourneyResult {
  vehicle: Vehicle
  stops: number
  driveMin: number
  chargeMin: number
  totalMin: number
  arrivalTime: string
  distanceKm: number
  coutRecharge: number
  coutPeages: number
  coutTotal: number
}

/* ── Helpers ────────────────────────────────────────────────── */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, r = Math.PI / 180
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.25
}

function fmtMin(m: number): string {
  const h = Math.floor(m / 60), min = m % 60
  return h > 0 ? `${h}h${String(min).padStart(2, '0')}` : `${m}min`
}

function fmtEur(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

/** Parse Nominatim display_name → { city, detail } */
function parseName(dn: string): { city: string; detail: string } {
  const parts = dn.split(', ')
  const city   = parts[0] ?? dn
  const detail = parts.slice(1, 3).join(', ')
  return { city, detail }
}

function calcJourneys(
  distKm: number,
  routeType: 'autoroute' | 'mixte',
  prixKwh: number,
  includePeages: boolean,
): JourneyResult[] {
  const vitesse = routeType === 'autoroute' ? 115 : 80
  return vehicles.map(v => {
    const autonomie  = routeType === 'autoroute' ? v.rangeHighway : v.rangeWltp
    const stops      = Math.max(0, Math.ceil(distKm / (autonomie * 0.85)) - 1)
    const driveMin   = Math.round(distKm / vitesse * 60)
    const chargeMin  = stops * v.chargeTime1080
    const totalMin   = driveMin + chargeMin
    const arrival    = new Date(Date.now() + totalMin * 60_000)

    const coutRecharge = Math.round(stops * v.battery * 0.70 * prixKwh * 100) / 100
    const rawPeages    = includePeages
      ? (routeType === 'autoroute' ? distKm * 0.85 * 0.088 : distKm * 0.045)
      : 0
    const coutPeages   = Math.round(rawPeages * 100) / 100
    const coutTotal    = Math.round((coutRecharge + coutPeages) * 100) / 100

    return {
      vehicle: v, stops, driveMin, chargeMin, totalMin,
      distanceKm: distKm,
      arrivalTime: arrival.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      coutRecharge, coutPeages, coutTotal,
    }
  })
}

/* ── Spinner ────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="rgba(0,212,255,0.2)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#00D4FF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
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
  const W = 300, y = 18
  const positions = Array.from({ length: stops }, (_, i) => 20 + ((i + 1) / (stops + 1)) * 260)
  return (
    <svg viewBox={`0 0 ${W} 36`} width="100%" height="36" style={{ overflow: 'visible' }}>
      <line x1={20} y1={y} x2={280} y2={y} stroke="#1f2937" strokeWidth={2} />
      <rect x={12} y={y - 5} width={9} height={9} fill="#34d399" />
      <rect x={279} y={y - 5} width={9} height={9} fill="#34d399" />
      {positions.map((x, i) => (
        <circle key={i} cx={x} cy={y} r={5} fill={color} opacity={0.85} />
      ))}
    </svg>
  )
}

/* ── PlaceInput ─────────────────────────────────────────────── */
interface PlaceInputProps {
  label: string
  value: string
  hasCoords: boolean
  loading: boolean
  onChange: (v: string) => void
  suggestions: NomResult[]
  showDropdown: boolean
  onSelect: (p: Place) => void
  wrapperRef: React.RefObject<HTMLDivElement | null>
}

function PlaceInput({ label, value, hasCoords, loading, onChange, suggestions, showDropdown, onSelect, wrapperRef }: PlaceInputProps) {
  return (
    <div ref={wrapperRef} style={{ flex: 1, position: 'relative', minWidth: 240 }}>
      <div style={{ fontFamily: SG, fontSize: 12, letterSpacing: '0.12em', color: '#4A6080', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Cannes, Paris, Lyon..."
          style={{
            width: '100%', padding: '10px 40px 10px 12px', fontFamily: SG, fontSize: 14,
            background: '#0d1f3c', border: `1px solid ${hasCoords ? 'rgba(52,211,153,0.5)' : '#1f2937'}`,
            borderRadius: 6, color: '#F0F4FF', outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
          {loading
            ? <Spinner />
            : hasCoords
              ? <span style={{ color: '#34d399', fontSize: 16 }}>✓</span>
              : null
          }
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: '#0d1f3c', border: '1px solid rgba(0,212,255,0.35)',
          borderRadius: 8, boxShadow: '0 12px 32px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}>
          {suggestions.length === 0 ? (
            <div style={{ fontFamily: SG, fontSize: 12, color: '#4A6080', fontStyle: 'italic', padding: '10px 14px' }}>
              Aucune ville trouvée
            </div>
          ) : (
            suggestions.map((s, i) => {
              const { city, detail } = parseName(s.display_name)
              return (
                <button
                  key={i}
                  onMouseDown={e => {
                    e.preventDefault()
                    onSelect({ label: city, lat: parseFloat(s.lat), lon: parseFloat(s.lon) })
                  }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', background: 'none', border: 'none',
                    borderBottom: i < suggestions.length - 1 ? '1px solid rgba(0,51,160,0.2)' : 'none',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1e3a5f')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontFamily: SG, fontSize: 14, color: '#F0F4FF', fontWeight: 500, lineHeight: 1.3 }}>
                    {city}
                  </div>
                  {detail && (
                    <div style={{ fontFamily: SG, fontSize: 12, color: '#4A6080', marginTop: 2, lineHeight: 1.2 }}>
                      {detail}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/* ── HUD Slider (lightweight) ───────────────────────────────── */
function HudSlider({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number
  step: number; onChange: (v: number) => void; display: string
}) {
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: SG, fontSize: 11, color: '#4A6080', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{label}</span>
        <span style={{ fontFamily: SG, fontSize: 13, fontWeight: 700, color: '#00D4FF' }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="hud-slider" style={{ width: '100%' }} />
    </div>
  )
}

/* ── JourneyCard ────────────────────────────────────────────── */
function JourneyCard({ r, rank, includePeages }: { r: JourneyResult; rank: number; includePeages: boolean }) {
  const color    = BRAND_COLOR[r.vehicle.brand] ?? '#94A3B8'
  const callsign = BRAND_NAME[r.vehicle.brand]  ?? 'UNIT'
  const isBest   = rank === 1

  return (
    <div style={{
      background: '#111827',
      border: `1px solid ${isBest ? 'rgba(0,212,255,0.45)' : '#1f2937'}`,
      clipPath: 'polygon(12px 0%,100% 0%,100% calc(100% - 12px),calc(100% - 12px) 100%,0% 100%,0% 12px)',
      padding: '16px', position: 'relative',
    }}>
      {isBest && (
        <div style={{ position: 'absolute', top: 0, right: 0, fontFamily: SG, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#0A1628', background: '#00D4FF', padding: '3px 10px', textTransform: 'uppercase' as const }}>
          PLUS RAPIDE
        </div>
      )}

      {/* Brand + model */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color, background: 'rgba(10,22,40,0.8)', border: `1px solid ${color}40`, padding: '2px 7px', textTransform: 'uppercase' as const, flexShrink: 0 }}>
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

      {/* Distance + drive info */}
      <div style={{ fontFamily: SG, fontSize: 12, color: '#4A6080', marginBottom: 12 }}>
        {Math.round(r.distanceKm)} km · conduite {fmtMin(r.driveMin)}
        {r.stops > 0 && ` · charge ${fmtMin(r.chargeMin)}`}
      </div>

      {/* Stops badge + time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
          background: r.stops === 0 ? 'rgba(52,211,153,0.12)' : 'rgba(255,107,0,0.12)',
          border: `1px solid ${r.stops === 0 ? 'rgba(52,211,153,0.35)' : 'rgba(255,107,0,0.35)'}`,
          borderRadius: 2,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.stops === 0 ? '#34d399' : '#FF6B00', flexShrink: 0 }} />
          <span style={{ fontFamily: SG, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: r.stops === 0 ? '#34d399' : '#FF6B00', textTransform: 'uppercase' as const }}>
            {r.stops === 0 ? 'TRAJET DIRECT ✓' : `${r.stops} ARRÊT${r.stops > 1 ? 'S' : ''}`}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: SG, fontSize: 28, fontWeight: 700, color: '#F0F4FF', lineHeight: 1 }}>
            <AnimatedTime target={r.totalMin} />
          </div>
          <div style={{ fontFamily: SG, fontSize: 13, color: '#00D4FF', marginTop: 3 }}>
            Arrivée ~{r.arrivalTime}
          </div>
        </div>
      </div>

      {/* Cost lines */}
      <div style={{ borderTop: '1px dashed #1f2937', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: SG, fontSize: 13, color: r.stops === 0 ? '#34d399' : '#fbbf24' }}>
            ⚡ {r.stops === 0 ? 'AUCUNE RECHARGE' : 'RECHARGE ESTIMÉE'}
          </span>
          <span style={{ fontFamily: SG, fontSize: 14, fontWeight: 700, color: r.stops === 0 ? '#34d399' : '#fbbf24' }}>
            {r.stops === 0 ? '—' : fmtEur(r.coutRecharge)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: includePeages ? 1 : 0.4 }}>
          <span style={{ fontFamily: SG, fontSize: 13, color: '#a78bfa' }}>
            🛣 PÉAGES ESTIMÉS
            <span style={{ fontSize: 10, color: '#4A6080', marginLeft: 4 }}>tarif moy. cl.1</span>
          </span>
          <span style={{ fontFamily: SG, fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>
            {includePeages ? fmtEur(r.coutPeages) : '—'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1f2937', paddingTop: 8, marginTop: 2 }}>
          <span style={{ fontFamily: SG, fontSize: 14, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.04em' }}>
            COÛT TRAJET
          </span>
          <span style={{ fontFamily: SG, fontSize: 16, fontWeight: 700, color: '#00D4FF' }}>
            {fmtEur(r.coutTotal)}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function TrajetPage() {
  /* Input fields */
  const [departQuery,   setDepartQuery]   = useState('')
  const [arriveeQuery,  setArriveeQuery]  = useState('')
  const [departSugs,    setDepartSugs]    = useState<NomResult[]>([])
  const [arriveeSugs,   setArriveeSugs]   = useState<NomResult[]>([])
  const [departCoords,  setDepartCoords]  = useState<Place | null>(null)
  const [arriveeCoords, setArriveeCoords] = useState<Place | null>(null)
  const [showDepartDrop,  setShowDepartDrop]  = useState(false)
  const [showArriveeDrop, setShowArriveeDrop] = useState(false)
  const [loadingDepart,   setLoadingDepart]   = useState(false)
  const [loadingArrivee,  setLoadingArrivee]  = useState(false)
  const [departSearched,  setDepartSearched]  = useState(false)
  const [arriveeSearched, setArriveeSearched] = useState(false)

  /* Config */
  const [routeType,     setRouteType]     = useState<'autoroute' | 'mixte'>('autoroute')
  const [prixKwh,       setPrixKwh]       = useState(0.69)
  const [includePeages, setIncludePeages] = useState(true)

  /* Simulation */
  const [results,  setResults]  = useState<JourneyResult[] | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const departTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arriveeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const departWrapRef  = useRef<HTMLDivElement>(null)
  const arriveeWrapRef = useRef<HTMLDivElement>(null)

  /* Click-outside listener */
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (departWrapRef.current  && !departWrapRef.current.contains(e.target as Node))  setShowDepartDrop(false)
      if (arriveeWrapRef.current && !arriveeWrapRef.current.contains(e.target as Node)) setShowArriveeDrop(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const fetchSugs = useCallback(async (q: string, setter: (r: NomResult[]) => void) => {
    if (q.trim().length < 2) { setter([]); return }
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&accept-language=fr&countrycodes=fr,be,ch,lu,es,it,de`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      setter(await res.json())
    } catch { setter([]) }
  }, [])

  const handleDepartChange = (v: string) => {
    setDepartQuery(v)
    setDepartCoords(null)
    if (v.trim().length < 2) {
      setDepartSugs([])
      setShowDepartDrop(false)
      setLoadingDepart(false)
      return
    }
    setLoadingDepart(true)
    if (departTimer.current) clearTimeout(departTimer.current)
    departTimer.current = setTimeout(async () => {
      await fetchSugs(v, sugs => {
        setDepartSugs(sugs)
        setShowDepartDrop(true)
        setDepartSearched(true)
      })
      setLoadingDepart(false)
    }, 300)
  }

  const handleArriveeChange = (v: string) => {
    setArriveeQuery(v)
    setArriveeCoords(null)
    if (v.trim().length < 2) {
      setArriveeSugs([])
      setShowArriveeDrop(false)
      setLoadingArrivee(false)
      return
    }
    setLoadingArrivee(true)
    if (arriveeTimer.current) clearTimeout(arriveeTimer.current)
    arriveeTimer.current = setTimeout(async () => {
      await fetchSugs(v, sugs => {
        setArriveeSugs(sugs)
        setShowArriveeDrop(true)
        setArriveeSearched(true)
      })
      setLoadingArrivee(false)
    }, 300)
  }

  async function simulate() {
    if (!departCoords || !arriveeCoords) return
    setError('')
    setLoading(true)
    const dist = haversine(departCoords.lat, departCoords.lon, arriveeCoords.lat, arriveeCoords.lon)
    setResults(calcJourneys(dist, routeType, prixKwh, includePeages))
    setLoading(false)
  }

  /* Re-simulate when config changes (if already have results) */
  useEffect(() => {
    if (results && departCoords && arriveeCoords) {
      const dist = haversine(departCoords.lat, departCoords.lon, arriveeCoords.lat, arriveeCoords.lon)
      setResults(calcJourneys(dist, routeType, prixKwh, includePeages))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prixKwh, includePeages, routeType])

  const canSimulate = !loading && !!departCoords && !!arriveeCoords
  const sorted      = results ? [...results].sort((a, b) => a.totalMin - b.totalMin) : null

  /* Dropdown for depart: show when open (but if no results & searched: show "Aucune ville") */
  const showDepartDropdown  = showDepartDrop  && !loadingDepart  && (departSugs.length  > 0 || departSearched)
  const showArriveeDropdown = showArriveeDrop && !loadingArrivee && (arriveeSugs.length > 0 || arriveeSearched)

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', color: '#F0F4FF' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid rgba(0,51,160,0.4)', padding: '1.5rem 0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Link href="/" style={{ fontFamily: SG, fontSize: 12, letterSpacing: '0.12em', color: '#4A6080', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            ⚡ ← COMPARATIF
          </Link>
          <h1 className="font-display" style={{ fontWeight: 800, fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', letterSpacing: '-0.02em', color: '#F0F4FF', textAlign: 'center' }}>
            SIMULATEUR DE <span style={{ color: '#00D4FF' }}>TRAJET</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-hud" style={{ boxShadow: '0 0 8px rgba(0,212,255,0.8)' }} />
            <span style={{ fontFamily: SG, fontSize: 10, letterSpacing: '0.18em', color: '#4A6080', textTransform: 'uppercase' }}>
              SYSTÈME EN LIGNE
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">

        {/* ── Input section ──────────────────────────────── */}
        <section style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '24px', marginBottom: '2rem' }}>

          {/* Departure / Arrival */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <PlaceInput
              label="DÉPART"
              value={departQuery}
              hasCoords={!!departCoords}
              loading={loadingDepart}
              onChange={handleDepartChange}
              suggestions={departSugs}
              showDropdown={showDepartDropdown}
              onSelect={p => {
                setDepartCoords(p)
                setDepartQuery(p.label)
                setShowDepartDrop(false)
                setDepartSearched(false)
              }}
              wrapperRef={departWrapRef}
            />
            <PlaceInput
              label="ARRIVÉE"
              value={arriveeQuery}
              hasCoords={!!arriveeCoords}
              loading={loadingArrivee}
              onChange={handleArriveeChange}
              suggestions={arriveeSugs}
              showDropdown={showArriveeDropdown}
              onSelect={p => {
                setArriveeCoords(p)
                setArriveeQuery(p.label)
                setShowArriveeDrop(false)
                setArriveeSearched(false)
              }}
              wrapperRef={arriveeWrapRef}
            />
          </div>

          {/* Route type toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{ fontFamily: SG, fontSize: 11, letterSpacing: '0.12em', color: '#4A6080', textTransform: 'uppercase', marginRight: 4 }}>
              MODE :
            </span>
            {(['autoroute', 'mixte'] as const).map(t => (
              <button
                key={t}
                onClick={() => setRouteType(t)}
                style={{
                  padding: '7px 16px', fontFamily: SG, fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  background: routeType === t ? '#00D4FF' : '#0d1f3c',
                  color: routeType === t ? '#0A1628' : '#4A6080',
                  border: `1px solid ${routeType === t ? '#00D4FF' : '#1f2937'}`,
                  borderRadius: 4, cursor: 'pointer',
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}

            {/* Toggle péages */}
            <button
              onClick={() => setIncludePeages(v => !v)}
              style={{
                marginLeft: 'auto', padding: '7px 14px', fontFamily: SG, fontSize: 12, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                background: includePeages ? 'rgba(167,139,250,0.15)' : '#0d1f3c',
                color: includePeages ? '#a78bfa' : '#4A6080',
                border: `1px solid ${includePeages ? 'rgba(167,139,250,0.45)' : '#1f2937'}`,
                borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>{includePeages ? '■' : '□'}</span>
              INCLURE LES PÉAGES
            </button>
          </div>

          {/* Prix kWh slider */}
          <div style={{ padding: '14px 0 4px', borderTop: '1px solid #1f2937' }}>
            <HudSlider
              label="TARIF BORNE (€/kWh)"
              value={prixKwh} min={0.35} max={0.90} step={0.01}
              onChange={setPrixKwh}
              display={`${prixKwh.toFixed(2).replace('.', ',')} €/kWh`}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontFamily: SG, fontSize: 12, color: '#FF6B00', marginTop: 10, letterSpacing: '0.06em' }}>{error}</p>
          )}

          {/* Simulate button */}
          <button
            onClick={simulate}
            disabled={!canSimulate}
            style={{
              width: '100%', padding: '14px', marginTop: 16,
              fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase' as const,
              background: canSimulate ? '#00D4FF' : '#1f2937',
              color: canSimulate ? '#0A1628' : '#4A6080',
              border: 'none', borderRadius: 4,
              cursor: canSimulate ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {loading ? 'CALCUL EN COURS…' : canSimulate ? 'SIMULER LE TRAJET' : 'SÉLECTIONNER DÉPART ET ARRIVÉE'}
          </button>
        </section>

        {/* ── Results ────────────────────────────────────── */}
        {results && sorted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
              <span style={{ fontFamily: SG, fontSize: 10, letterSpacing: '0.22em', color: '#4A6080', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                RÉSULTATS — {Math.round(results[0].distanceKm)} km
                {routeType === 'autoroute' ? ' · AUTOROUTE · 115 km/h' : ' · MIXTE · 80 km/h'}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,51,160,0.3)' }} />
            </div>

            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '2rem' }}>
              {results.map(r => {
                const rank = sorted.findIndex(s => s.vehicle.id === r.vehicle.id) + 1
                return <JourneyCard key={r.vehicle.id} r={r} rank={rank} includePeages={includePeages} />
              })}
            </div>

            {/* ── Classement ──────────────────────────────── */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <span style={{ fontFamily: SG, fontSize: 10, letterSpacing: '0.22em', color: '#4A6080', textTransform: 'uppercase' }}>CLASSEMENT</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,51,160,0.3)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sorted.map((r, i) => {
                  const delta  = r.totalMin - sorted[0].totalMin
                  const color  = BRAND_COLOR[r.vehicle.brand] ?? '#94A3B8'
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div key={r.vehicle.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px',
                      background: i === 0 ? 'rgba(0,212,255,0.06)' : 'rgba(0,51,160,0.06)',
                      border: `1px solid ${i === 0 ? 'rgba(0,212,255,0.25)' : '#1f2937'}`,
                      borderRadius: 4,
                    }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{medals[i] ?? `${i + 1}.`}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-display" style={{ fontWeight: 700, fontSize: 13, color: i === 0 ? '#00D4FF' : '#F0F4FF' }}>
                          {r.vehicle.model}
                        </div>
                        <div style={{ fontFamily: SG, fontSize: 12, color }}>{BRAND_NAME[r.vehicle.brand] ?? 'UNIT'}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: SG, fontSize: 15, fontWeight: 700, color: i === 0 ? '#00D4FF' : '#F0F4FF' }}>
                          {fmtMin(r.totalMin)}
                          <span style={{ fontSize: 12, color: '#4A6080', marginLeft: 6 }}>·</span>
                          <span style={{ fontSize: 14, color: '#00D4FF', marginLeft: 6 }}>{fmtEur(r.coutTotal)}</span>
                        </div>
                        {delta > 0 && (
                          <div style={{ fontFamily: SG, fontSize: 12, color: '#FF6B00', marginTop: 2 }}>
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
        <p style={{ fontFamily: SG, fontSize: 11, color: '#4A6080', textAlign: 'center', marginTop: '3rem', letterSpacing: '0.06em', lineHeight: 1.6 }}>
          Calcul estimatif · Distance Haversine ×1.25 · Péages : tarif moy. classe 1 · Source : OpenStreetMap
        </p>
      </div>
    </div>
  )
}
