'use client'

import { useEffect, useState } from 'react'
import { motion, animate, useMotionValue, useTransform } from 'framer-motion'
import Link from 'next/link'
import { Vehicle } from '@/types/vehicle'

/* ── Brand config ─────────────────────────────────────────── */
const BRANDS: Record<string, { callsign: string; color: string; glow: string; barColor: string }> = {
  xpeng:   { callsign: 'XPENG',    color: '#00D4FF', glow: 'rgba(0,212,255,0.18)',   barColor: '#00D4FF' },
  renault: { callsign: 'RENAULT',  color: '#FF6B00', glow: 'rgba(255,107,0,0.15)',   barColor: '#FF6B00' },
  vw:      { callsign: 'VW GROUP', color: '#60A5FA', glow: 'rgba(96,165,250,0.15)',  barColor: '#60A5FA' },
  skoda:   { callsign: 'ŠKODA',    color: '#4ADE80', glow: 'rgba(74,222,128,0.15)', barColor: '#4ADE80' },
  kia:     { callsign: 'KIA',      color: '#F87171', glow: 'rgba(248,113,113,0.15)', barColor: '#F87171' },
  audi:    { callsign: 'AUDI',     color: '#C084FC', glow: 'rgba(192,132,252,0.15)', barColor: '#C084FC' },
  other:   { callsign: 'UNIT',     color: '#94A3B8', glow: 'rgba(148,163,184,0.12)', barColor: '#94A3B8' },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

/* ── Odometer slot: each digit scrolls from 0 → final ──────── */
function OdometerSlot({ char, delay }: { char: string; delay: number }) {
  if (!/\d/.test(char)) {
    return (
      <motion.span
        style={{ display: 'inline-block' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay, duration: 0.15 }}
      >
        {char === ' ' ? ' ' : char}
      </motion.span>
    )
  }

  const d = parseInt(char)
  const h = 1.15 // em per digit slot

  return (
    <span
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        height: `${h}em`,
        verticalAlign: 'bottom',
        lineHeight: `${h}em`,
      }}
    >
      <motion.span
        style={{ display: 'block' }}
        initial={{ y: 0 }}
        animate={{ y: `${-d * h}em` }}
        transition={{ delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <span key={n} style={{ display: 'block', height: `${h}em`, lineHeight: `${h}em` }}>{n}</span>
        ))}
      </motion.span>
    </span>
  )
}

function PriceOdometer({ price, delay = 0 }: { price: number; delay?: number }) {
  const formatted = fmt(price)
  return (
    <span className="font-data" style={{ display: 'inline-flex', fontWeight: 700 }}>
      {[...formatted].map((char, i) => (
        <OdometerSlot key={i} char={char} delay={delay + i * 0.04} />
      ))}
    </span>
  )
}

/* ── HUD gauge with tick marks + shimmer ────────────────────── */
function HUDGauge({
  label, value, pct, color, delay = 0, warn = false,
}: {
  label: string; value: string; pct: number; color: string; delay?: number; warn?: boolean
}) {
  const ticks = [0, 25, 50, 75, 100]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span className="font-data" style={{ fontSize: 8, letterSpacing: '0.15em', color: '#4A6080', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span className="font-data" style={{ fontSize: 11, fontWeight: 700, color: warn ? '#FF6B00' : '#F0F4FF' }}>
          {value}
        </span>
      </div>
      <div style={{
        position: 'relative', height: 6, background: '#0A1628',
        border: '1px solid rgba(0,51,160,0.4)', borderRadius: 2, overflow: 'hidden',
      }}>
        {ticks.map(t => (
          <div key={t} style={{
            position: 'absolute', top: 0, bottom: 0, width: 1,
            left: `${t}%`, background: 'rgba(0,51,160,0.5)',
          }} />
        ))}
        <motion.div
          style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, background: color }}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(2, pct)}%` }}
          transition={{ duration: 1.1, ease: 'easeOut', delay }}
        >
          <div className="gauge-shimmer" style={{ position: 'absolute', inset: 0 }} />
        </motion.div>
      </div>
    </div>
  )
}

/* ── CountUp for non-price numbers ─────────────────────────── */
function CountUp({ to, suffix = '', delay = 0 }: { to: number; suffix?: string; delay?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => `${Math.round(v)}${suffix}`)

  useEffect(() => {
    const controls = animate(count, to, { duration: 1.5, ease: 'easeOut', delay })
    return controls.stop
  }, [to, delay, count])

  return <motion.span>{rounded}</motion.span>
}

/* ── VehicleCard ─────────────────────────────────────────────── */
export default function VehicleCard({ v }: { v: Vehicle }) {
  const [expanded, setExpanded] = useState(false)
  const brand = BRANDS[v.brand] ?? BRANDS.other
  const isDevis = v.price.source !== 'catalogue'
  const isSlowCharge = v.chargeTime1080 > 35

  return (
    <article
      style={{
        position: 'relative',
        background: '#0D1F3C',
        border: `1px solid rgba(0,51,160,0.35)`,
        clipPath: 'polygon(22px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 22px)',
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
      }}
      className="group hover:[border-color:rgba(0,212,255,0.45)] hover:shadow-[0_0_32px_rgba(0,212,255,0.12)] hover:translate-y-[-4px]"
    >
      {/* Diagonal corner accent line */}
      <svg
        aria-hidden
        style={{ position: 'absolute', top: 0, left: 0, width: 26, height: 26, zIndex: 5, pointerEvents: 'none' }}
      >
        <line x1="0" y1="21" x2="21" y2="0" stroke={brand.color} strokeWidth="1.2" opacity="0.7" />
      </svg>

      {/* Scan line animation */}
      <div className="card-scanline" />

      {/* ── Photo / header zone ─────────────────────────── */}
      {v.imageUrl ? (
        <div style={{ position: 'relative', height: 176, overflow: 'hidden', background: '#0A1628' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={v.imageUrl}
            alt={`${v.model} ${v.trim}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.5s ease' }}
            className="group-hover:scale-105"
            onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
          />
          {/* Alpine blue gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to bottom, rgba(0,51,160,0.35) 0%, rgba(10,22,40,0.92) 100%)`,
          }} />
          {/* Brand callsign badge */}
          <div className="font-data" style={{
            position: 'absolute', top: 12, left: 16, zIndex: 2,
            fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
            color: brand.color, textTransform: 'uppercase',
            background: 'rgba(10,22,40,0.7)',
            border: `1px solid ${brand.color}40`,
            padding: '3px 8px',
            backdropFilter: 'blur(4px)',
          }}>
            ◉ {brand.callsign}
          </div>
          {v.color && (
            <span className="font-data" style={{
              position: 'absolute', bottom: 10, left: 16, zIndex: 2,
              fontSize: 9, color: '#F0F4FF80', letterSpacing: '0.1em',
            }}>
              {v.color}
            </span>
          )}
          {/* Voltage badge */}
          {v.voltage && (
            <div className="font-data" style={{
              position: 'absolute', top: 12, right: 14, zIndex: 2,
              fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
              color: '#00D4FF', background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.3)',
              padding: '3px 7px',
            }}>
              {v.voltage}V
            </div>
          )}
        </div>
      ) : (
        <div style={{ height: 60, background: `linear-gradient(135deg, #0D1F3C, ${brand.color}15)` }}>
          <div className="font-data" style={{
            padding: '14px 16px', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.2em', color: brand.color, textTransform: 'uppercase',
          }}>
            ◉ {brand.callsign}
          </div>
        </div>
      )}

      {/* ── Model / Price header ──────────────────────── */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(0,51,160,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: '#F0F4FF', lineHeight: 1.2 }}>
              {v.model}
            </h2>
            <p className="font-data" style={{ fontSize: 9, color: '#4A6080', marginTop: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {v.trim}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 20, color: '#F0F4FF', lineHeight: 1, textShadow: `0 0 16px ${brand.glow}` }}>
              <PriceOdometer price={v.price.total} delay={0.2} />
            </div>
            <div className="font-data" style={{
              fontSize: 8, letterSpacing: '0.15em', marginTop: 4, textTransform: 'uppercase',
              color: isDevis ? '#00D4FF' : '#4A6080',
            }}>
              {isDevis ? `📄 ${v.price.concession ?? 'offre'}` : 'CATALOGUE'}
            </div>
            {v.price.validUntil && (
              <div className="font-data" style={{ fontSize: 8, color: '#4A6080', marginTop: 2, letterSpacing: '0.08em' }}>
                val. {new Date(v.price.validUntil).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Battery gauge ─────────────────────────────── */}
      <div style={{ padding: '12px 16px 8px' }}>
        <HUDGauge
          label={`BATTERIE · ${v.batteryType ?? ''}`}
          value={`${v.battery} kWh`}
          pct={(v.battery / 100) * 100}
          color={brand.barColor}
          delay={0.1}
        />
      </div>

      {/* ── 4-metric grid ─────────────────────────────── */}
      <div style={{ padding: '8px 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
        <HUDGauge
          label="RECHARGE 10→80%"
          value={`~${v.chargeTime1080} min`}
          pct={Math.max(5, 100 - (v.chargeTime1080 / 60) * 100)}
          color={isSlowCharge ? '#FF6B00' : '#00D4FF'}
          delay={0.2}
          warn={isSlowCharge}
        />
        <HUDGauge
          label="PUISS. CHARGE"
          value={`${v.chargePower} kW`}
          pct={(v.chargePower / 500) * 100}
          color="#0033A0"
          delay={0.3}
        />
        <HUDGauge
          label="AUTO. WLTP"
          value={`${v.rangeWltp} km`}
          pct={(v.rangeWltp / 700) * 100}
          color={brand.barColor}
          delay={0.4}
        />
        <HUDGauge
          label="AUTOROUTE ~120"
          value={`~${v.rangeHighway} km`}
          pct={(v.rangeHighway / 700) * 100}
          color="#4A6080"
          delay={0.5}
          warn={v.rangeHighway < 350}
        />
      </div>

      {/* ── Power / transmission row ───────────────────── */}
      <div style={{
        margin: '0 16px 12px',
        padding: '8px 10px',
        background: 'rgba(0,51,160,0.08)',
        border: '1px solid rgba(0,51,160,0.2)',
        display: 'flex', gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <div className="font-data" style={{ fontSize: 8, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Puissance</div>
          <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: brand.color, marginTop: 1 }}>
            <CountUp to={v.power} suffix=" ch" delay={0.3} />
          </div>
        </div>
        <div>
          <div className="font-data" style={{ fontSize: 8, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Transmission</div>
          <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: '#F0F4FF', marginTop: 1 }}>{v.drivetrain}</div>
        </div>
        {v.acceleration && (
          <div>
            <div className="font-data" style={{ fontSize: 8, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase' }}>0–100</div>
            <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: '#F0F4FF', marginTop: 1 }}>
              <CountUp to={v.acceleration} suffix=" s" delay={0.4} />
            </div>
          </div>
        )}
      </div>

      {/* ── Tags ──────────────────────────────────────── */}
      <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {v.tags.map(tag => (
          <span key={tag} className="font-data" style={{
            fontSize: 8, padding: '2px 8px', letterSpacing: '0.1em',
            color: '#4A6080', background: 'rgba(0,51,160,0.1)',
            border: '1px solid rgba(0,51,160,0.25)', textTransform: 'uppercase',
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* ── Notes ─────────────────────────────────────── */}
      <div style={{ padding: '0 16px 12px', borderBottom: '1px solid rgba(0,51,160,0.25)' }}>
        <p className="font-body" style={{ fontSize: 10, color: '#4A6080', fontStyle: 'italic', lineHeight: 1.5 }}>
          {v.notes}
        </p>
      </div>

      {/* ── Voir fiche link ────────────────────────────── */}
      <div style={{ padding: '10px 16px 10px' }}>
        <Link
          href={`/vehicles/${v.id}`}
          className="font-data"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
            color: brand.color, textTransform: 'uppercase',
            border: `1px solid ${brand.color}35`,
            transition: 'all 0.15s ease',
            background: `${brand.color}06`,
            textDecoration: 'none',
          }}
        >
          VOIR FICHE COMPLÈTE <span style={{ fontSize: 10 }}>→</span>
        </Link>
      </div>

      {/* ── Price detail (devis only) ──────────────────── */}
      {isDevis && (
        <div style={{ borderTop: '1px solid rgba(0,51,160,0.25)' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="font-data"
            style={{
              width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 8, letterSpacing: '0.15em', color: '#4A6080', textTransform: 'uppercase',
              cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none', color: '#00D4FF' }}>▶</span>
            DÉTAIL OFFRE COMMERCIALE
          </button>

          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              margin: '0 12px 12px',
              padding: '12px',
              background: 'rgba(0,51,160,0.08)',
              border: '1px solid rgba(0,212,255,0.15)',
              backdropFilter: 'blur(8px)',
            }}>
              {[
                v.price.catalogue   != null && { label: 'Prix catalogue',         val: fmt(v.price.catalogue),         neg: false },
                v.price.options     != null && { label: 'Options',                 val: `+ ${fmt(v.price.options!)}`,   neg: false },
                v.price.supplements != null && { label: 'Suppléments',             val: `+ ${fmt(v.price.supplements!)}`,neg: false },
                v.price.remiseCommerciale != null && { label: 'Remise commerciale', val: `− ${fmt(v.price.remiseCommerciale!)}`, neg: true },
                v.price.remiseCEE   != null && { label: 'Remise CEE',              val: `− ${fmt(v.price.remiseCEE!)}`, neg: true },
              ].filter(Boolean).map((row, i) => {
                const r = row as { label: string; val: string; neg: boolean }
                return (
                  <div key={i} className="font-data" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 6, color: r.neg ? '#FF6B00' : '#4A6080' }}>
                    <span>{r.label}</span><span>{r.val}</span>
                  </div>
                )
              })}
              <div className="font-data" style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700,
                color: '#F0F4FF', borderTop: '1px solid rgba(0,51,160,0.3)', paddingTop: 8, marginTop: 4,
              }}>
                <span>TOTAL OFFRE</span><span style={{ color: brand.color }}>{fmt(v.price.total)}</span>
              </div>

              {v.extraDiscount && (
                <div style={{
                  marginTop: 10, padding: '10px',
                  background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)',
                }}>
                  <div className="font-data" style={{ fontSize: 9, color: '#FF6B00', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>
                    💡 {v.extraDiscount.label}
                  </div>
                  <div className="font-data" style={{ fontSize: 9, color: '#4A6080' }}>
                    Remise {v.extraDiscount.percent}% = − {fmt(v.price.total * v.extraDiscount.percent / 100)}
                  </div>
                  <div className="font-data" style={{ fontSize: 11, fontWeight: 700, color: '#00D4FF', marginTop: 4 }}>
                    PRIX POTENTIEL : {fmt(v.extraDiscount.result)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </article>
  )
}
