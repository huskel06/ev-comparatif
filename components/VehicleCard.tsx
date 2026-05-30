'use client'

import { useState } from 'react'
import { Vehicle } from '@/types/vehicle'

/* ── Brand config ─────────────────────────────────────────────── */
const BRANDS: Record<string, { callsign: string; color: string }> = {
  xpeng:   { callsign: 'XPENG',    color: '#00D4FF' },
  renault: { callsign: 'RENAULT',  color: '#FF6B00' },
  vw:      { callsign: 'VW GROUP', color: '#60A5FA' },
  skoda:   { callsign: 'ŠKODA',    color: '#4ADE80' },
  kia:     { callsign: 'KIA',      color: '#F87171' },
  audi:    { callsign: 'AUDI',     color: '#C084FC' },
  other:   { callsign: 'UNIT',     color: '#94A3B8' },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

/* ── VehicleCard — flip recto/verso ───────────────────────────── */
export default function VehicleCard({
  v,
  bestRange,
  lowestPrice,
}: {
  v: Vehicle
  bestRange: number
  lowestPrice: number
}) {
  const [flipped, setFlipped] = useState(false)
  const brand        = BRANDS[v.brand] ?? BRANDS.other
  const isDevis      = v.price.source !== 'catalogue'
  const isBestPrice  = v.price.total === lowestPrice
  const isBestRange  = v.rangeWltp   === bestRange
  const isSlowCharge = v.chargeTime1080 > 30
  const isFastCharge = v.chargeTime1080 <= 20

  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    border: '1px solid rgba(0,51,160,0.35)',
    clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 16px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }

  const flipBtnStyle: React.CSSProperties = {
    margin: '0 12px 12px',
    padding: '9px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: '#00D4FF',
    textTransform: 'uppercase',
    border: '1px solid rgba(0,212,255,0.4)',
    background: 'rgba(0,212,255,0.04)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexShrink: 0,
  }

  return (
    <div style={{ height: 520, perspective: '1000px', cursor: 'pointer' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.45, 0, 0.55, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >

        {/* ── RECTO ──────────────────────────────────────────── */}
        <div style={{ ...faceStyle, background: '#0D1F3C' }}>

          {/* Photo */}
          {v.imageUrl ? (
            <div style={{ position: 'relative', height: 180, flexShrink: 0, overflow: 'hidden', background: '#0A1628' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.imageUrl}
                alt={`${v.model} ${v.trim}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0A1628 0%, rgba(10,22,40,0.6) 30%, transparent 60%)' }} />

              {/* Brand badge */}
              <div className="font-data" style={{ position: 'absolute', top: 12, left: 16, zIndex: 2, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: brand.color, textTransform: 'uppercase', background: 'rgba(10,22,40,0.7)', border: `1px solid ${brand.color}40`, padding: '3px 8px', backdropFilter: 'blur(4px)' }}>
                ◉ {brand.callsign}
              </div>

              {v.voltage && (
                <div className="font-data" style={{ position: 'absolute', top: 12, right: 14, zIndex: 2, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#00D4FF', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', padding: '3px 7px' }}>
                  {v.voltage}V
                </div>
              )}

              {v.color && (
                <span className="font-data" style={{ position: 'absolute', bottom: 10, left: 16, zIndex: 2, fontSize: 11, color: 'rgba(240,244,255,0.65)', letterSpacing: '0.1em' }}>
                  {v.color}
                </span>
              )}
            </div>
          ) : (
            <div style={{ height: 60, flexShrink: 0, background: `linear-gradient(135deg, #0D1F3C, ${brand.color}15)`, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <div className="font-data" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: brand.color, textTransform: 'uppercase' }}>◉ {brand.callsign}</div>
            </div>
          )}

          {/* Model + Trim */}
          <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: '#F0F4FF', lineHeight: 1.2, margin: 0 }}>
              {v.model}
            </h2>
            <p className="font-data" style={{ fontSize: 12, color: '#4A6080', marginTop: 4, letterSpacing: '0.08em', margin: '4px 0 0' }}>
              {v.trim}
            </p>
          </div>

          {/* 2×2 metrics grid */}
          <div style={{ padding: '0 12px', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignContent: 'start' }}>

            <div style={{ background: '#0d1117', borderRadius: 6, padding: '10px 12px' }}>
              <div className="font-data" style={{ fontSize: 10, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>AUTO. WLTP</div>
              <div className="font-data" style={{ fontSize: 22, fontWeight: 700, color: isBestRange ? '#4ADE80' : '#F0F4FF', lineHeight: 1 }}>
                {v.rangeWltp}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 3 }}>km</span>
              </div>
            </div>

            <div style={{ background: '#0d1117', borderRadius: 6, padding: '10px 12px' }}>
              <div className="font-data" style={{ fontSize: 10, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>10→80%</div>
              <div className="font-data" style={{ fontSize: 22, fontWeight: 700, color: isFastCharge ? '#4ADE80' : isSlowCharge ? '#FF6B00' : '#F0F4FF', lineHeight: 1 }}>
                ~{v.chargeTime1080}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 3 }}>min</span>
              </div>
            </div>

            <div style={{ background: '#0d1117', borderRadius: 6, padding: '10px 12px' }}>
              <div className="font-data" style={{ fontSize: 10, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>PUISSANCE</div>
              <div className="font-data" style={{ fontSize: 22, fontWeight: 700, color: '#F0F4FF', lineHeight: 1 }}>
                {v.power}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 3 }}>ch</span>
              </div>
            </div>

            <div style={{ background: '#0d1117', borderRadius: 6, padding: '10px 12px' }}>
              <div className="font-data" style={{ fontSize: 10, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>PRIX OFFRE</div>
              <div className="font-data" style={{ fontSize: isBestPrice ? 18 : 16, fontWeight: 700, color: isBestPrice ? '#4ADE80' : '#F0F4FF', lineHeight: 1.2 }}>
                {fmt(v.price.total)}
              </div>
            </div>
          </div>

          {/* Flip button */}
          <button
            className="font-data"
            onClick={e => { e.stopPropagation(); setFlipped(true) }}
            style={flipBtnStyle}
          >
            ↺ VOIR LE DÉTAIL
          </button>
        </div>

        {/* ── VERSO ──────────────────────────────────────────── */}
        <div style={{ ...faceStyle, background: '#0B1A30', transform: 'rotateY(180deg)' }}>

          {/* Header */}
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,51,160,0.3)', flexShrink: 0 }}>
            <div className="font-data" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: brand.color, textTransform: 'uppercase', background: 'rgba(10,22,40,0.7)', border: `1px solid ${brand.color}40`, padding: '2px 6px', flexShrink: 0 }}>
              ◉ {brand.callsign}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 14, color: '#F0F4FF', lineHeight: 1.2 }}>{v.model}</div>
              <div className="font-data" style={{ fontSize: 10, color: '#4A6080', marginTop: 1 }}>{v.trim}</div>
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>

            {/* Price section */}
            {isDevis ? (
              <div style={{ marginBottom: 12 }}>
                {([
                  v.price.catalogue        != null && { label: 'Prix catalogue',      val: fmt(v.price.catalogue),                    neg: false },
                  v.price.options          != null && { label: 'Options',              val: `+ ${fmt(v.price.options!)}`,               neg: false },
                  v.price.supplements      != null && { label: 'Suppléments',          val: `+ ${fmt(v.price.supplements!)}`,            neg: false },
                  v.price.remiseCommerciale != null && { label: 'Remise commerciale',  val: `− ${fmt(v.price.remiseCommerciale!)}`,      neg: true  },
                  v.price.remiseCEE        != null && { label: 'Remise CEE',           val: `− ${fmt(v.price.remiseCEE!)}`,              neg: true  },
                ] as (false | { label: string; val: string; neg: boolean })[])
                  .filter((r): r is { label: string; val: string; neg: boolean } => r !== false)
                  .map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span className="font-data" style={{ fontSize: 11, color: '#4A6080' }}>{r.label}</span>
                      <span className="font-data" style={{ fontSize: 13, color: r.neg ? '#FF6B00' : '#F0F4FF' }}>{r.val}</span>
                    </div>
                  ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(0,51,160,0.3)', paddingTop: 8, marginTop: 4 }}>
                  <span className="font-data" style={{ fontSize: 11, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL OFFRE</span>
                  <span className="font-data" style={{ fontSize: 18, fontWeight: 700, color: '#4ADE80' }}>{fmt(v.price.total)}</span>
                </div>

                {v.extraDiscount && (
                  <div style={{ marginTop: 10, padding: '10px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 4 }}>
                    <div className="font-data" style={{ fontSize: 11, color: '#4ADE80', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
                      💡 REMISE {v.extraDiscount.percent}% POSSIBLE → ~{fmt(v.extraDiscount.result)}
                    </div>
                    <div className="font-data" style={{ fontSize: 10, color: '#4A6080' }}>{v.extraDiscount.label}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '14px 0', marginBottom: 12 }}>
                <div className="font-data" style={{ fontSize: 28, fontWeight: 700, color: '#F0F4FF' }}>{fmt(v.price.total)}</div>
                <div className="font-data" style={{ fontSize: 10, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>PRIX CATALOGUE</div>
              </div>
            )}

            {/* Separator */}
            <div style={{ borderTop: '1px dashed rgba(0,212,255,0.2)', margin: '0 0 12px' }} />

            {/* Specs grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginBottom: 12 }}>
              <div>
                <div className="font-data" style={{ fontSize: 10, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Batterie</div>
                <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: '#F0F4FF', marginTop: 2 }}>
                  {v.battery} kWh{v.batteryType ? ` · ${v.batteryType}` : ''}
                </div>
              </div>
              <div>
                <div className="font-data" style={{ fontSize: 10, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Autoroute ~120</div>
                <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: '#F0F4FF', marginTop: 2 }}>~{v.rangeHighway} km</div>
              </div>
              <div>
                <div className="font-data" style={{ fontSize: 10, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Puiss. charge max</div>
                <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: '#F0F4FF', marginTop: 2 }}>{v.chargePower} kW</div>
              </div>
              <div>
                <div className="font-data" style={{ fontSize: 10, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Transmission</div>
                <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: '#F0F4FF', marginTop: 2 }}>{v.drivetrain}</div>
              </div>
              {v.acceleration && (
                <div>
                  <div className="font-data" style={{ fontSize: 10, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.12em' }}>0–100 km/h</div>
                  <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: '#F0F4FF', marginTop: 2 }}>{v.acceleration} s</div>
                </div>
              )}
              {v.voltage && (
                <div>
                  <div className="font-data" style={{ fontSize: 10, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Architecture</div>
                  <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: '#00D4FF', marginTop: 2 }}>{v.voltage}V</div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {v.tags.map(tag => (
                <span key={tag} className="font-data" style={{ display: 'inline-block', fontSize: 9, padding: '2px 8px', letterSpacing: '0.1em', color: '#4A6080', background: 'rgba(0,51,160,0.1)', border: '1px solid rgba(0,51,160,0.25)', textTransform: 'uppercase' }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Notes */}
            <p className="font-body" style={{ fontSize: 11, color: '#4A6080', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
              {v.notes}
            </p>
          </div>

          {/* Flip back button */}
          <button
            className="font-data"
            onClick={e => { e.stopPropagation(); setFlipped(false) }}
            style={flipBtnStyle}
          >
            ↺ RETOURNER
          </button>
        </div>

      </div>
    </div>
  )
}
