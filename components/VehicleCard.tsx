'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Vehicle } from '@/types/vehicle'

/* ── Brand config ─────────────────────────────────────────────── */
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

/* ── SpringNumber — instrument-feel counter ───────────────────── */
function SpringNumber({
  target, prefix = '', suffix = '', isActive,
}: {
  target: number; prefix?: string; suffix?: string; isActive: boolean
}) {
  const spring = useSpring(0, { stiffness: 60, damping: 20, mass: 0.8 })
  const displayed = useTransform(spring, v => `${prefix}${Math.round(v)}${suffix}`)

  useEffect(() => {
    spring.set(isActive ? target : 0)
  }, [isActive, target, spring])

  return <motion.span>{displayed}</motion.span>
}

/* ── Odometer slot — digit scrolls 0 → final ─────────────────── */
function OdometerSlot({ char, delay, isActive }: { char: string; delay: number; isActive: boolean }) {
  if (!/\d/.test(char)) {
    return (
      <motion.span
        style={{ display: 'inline-block' }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ delay: isActive ? delay : 0, duration: 0.15 }}
      >
        {char === ' ' ? ' ' : char}
      </motion.span>
    )
  }

  const d = parseInt(char)
  const h = 1.15

  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', height: `${h}em`, verticalAlign: 'bottom', lineHeight: `${h}em` }}>
      <motion.span
        style={{ display: 'block' }}
        animate={{ y: isActive ? `${-d * h}em` : '0em' }}
        transition={{ delay: isActive ? delay : 0, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <span key={n} style={{ display: 'block', height: `${h}em`, lineHeight: `${h}em` }}>{n}</span>
        ))}
      </motion.span>
    </span>
  )
}

function PriceOdometer({ price, isActive, baseDelay = 0 }: { price: number; isActive: boolean; baseDelay?: number }) {
  const formatted = fmt(price)
  return (
    <span className="font-data" style={{ display: 'inline-flex', fontWeight: 700 }}>
      {[...formatted].map((char, i) => (
        <OdometerSlot key={i} char={char} isActive={isActive} delay={baseDelay + i * 0.04} />
      ))}
    </span>
  )
}

/* ── HUD Gauge — block animation + spring value + bar fill ──────  */
function HUDGauge({
  label, targetNum, prefix = '', suffix = '', pct, color,
  blockDelay = 0, isInView = true, warn = false,
}: {
  label: string; targetNum: number; prefix?: string; suffix?: string;
  pct: number; color: string; blockDelay?: number; isInView?: boolean; warn?: boolean
}) {
  const ticks = [0, 25, 50, 75, 100]

  return (
    <motion.div
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ delay: blockDelay, duration: 0.35, ease: 'easeOut' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span className="font-data" style={{ fontSize: 10, letterSpacing: '0.15em', color: '#4A6080', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span className="font-data" style={{ fontSize: 11, fontWeight: 700, color: warn ? '#FF6B00' : '#F0F4FF' }}>
          <SpringNumber target={targetNum} prefix={prefix} suffix={suffix} isActive={isInView} />
        </span>
      </div>
      <div style={{ position: 'relative', height: 6, background: '#0A1628', border: '1px solid rgba(0,51,160,0.4)', borderRadius: 2, overflow: 'hidden' }}>
        {ticks.map(t => (
          <div key={t} style={{ position: 'absolute', top: 0, bottom: 0, width: 1, left: `${t}%`, background: 'rgba(0,51,160,0.5)' }} />
        ))}
        <motion.div
          style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, background: color }}
          animate={{ width: isInView ? `${Math.max(2, pct)}%` : '0%' }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay: blockDelay + 0.15 }}
        >
          <div className="gauge-shimmer" style={{ position: 'absolute', inset: 0 }} />
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ── VehicleCard ──────────────────────────────────────────────── */
export default function VehicleCard({ v, entranceDelay = 0 }: { v: Vehicle; entranceDelay?: number }) {
  const cardRef = useRef(null)
  const isInView = useInView(cardRef, { once: true, margin: '-80px' })
  const [isHovered, setIsHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const brand  = BRANDS[v.brand] ?? BRANDS.other
  const isDevis      = v.price.source !== 'catalogue'
  const isSlowCharge = v.chargeTime1080 > 35

  // All internal delays offset by the card's stagger entrance delay
  const d = entranceDelay

  return (
    <motion.article
      ref={cardRef}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      /* Elastic hover lift */
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } }}
      /* Border + shadow driven by hover state */
      animate={{
        borderColor: isHovered ? 'rgba(0,212,255,0.55)' : 'rgba(0,51,160,0.35)',
        boxShadow:   isHovered ? '0 0 32px rgba(0,212,255,0.15)' : '0 0 0px rgba(0,0,0,0)',
      }}
      transition={{ borderColor: { duration: 0.25 }, boxShadow: { duration: 0.25 } }}
      style={{
        position: 'relative',
        background: '#0D1F3C',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'rgba(0,51,160,0.35)',
        clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 16px)',
        overflow: 'hidden',
      }}
    >
      {/* Corner cut accent SVGs */}
      <svg aria-hidden style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, zIndex: 5, pointerEvents: 'none' }}>
        <line x1="0" y1="15" x2="15" y2="0" stroke={brand.color} strokeWidth="1.2" opacity="0.6" />
      </svg>
      <svg aria-hidden style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, zIndex: 5, pointerEvents: 'none' }}>
        <line x1="4" y1="19" x2="19" y2="4" stroke={brand.color} strokeWidth="1.2" opacity="0.6" />
      </svg>

      {/* HUD corner brackets — brighten on hover */}
      <motion.div aria-hidden animate={{ opacity: isHovered ? 1 : 0.65 }} transition={{ duration: 0.2 }}
        style={{ position: 'absolute', top: 5, left: 5, width: 8, height: 8, borderTop: '2px solid #00D4FF', borderLeft: '2px solid #00D4FF', zIndex: 6, pointerEvents: 'none' }} />
      <motion.div aria-hidden animate={{ opacity: isHovered ? 1 : 0.65 }} transition={{ duration: 0.2 }}
        style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderTop: '2px solid #00D4FF', borderRight: '2px solid #00D4FF', zIndex: 6, pointerEvents: 'none' }} />
      <motion.div aria-hidden animate={{ opacity: isHovered ? 1 : 0.65 }} transition={{ duration: 0.2 }}
        style={{ position: 'absolute', bottom: 5, left: 5, width: 8, height: 8, borderBottom: '2px solid #00D4FF', borderLeft: '2px solid #00D4FF', zIndex: 6, pointerEvents: 'none' }} />
      <motion.div aria-hidden animate={{ opacity: isHovered ? 1 : 0.65 }} transition={{ duration: 0.2 }}
        style={{ position: 'absolute', bottom: 5, right: 5, width: 8, height: 8, borderBottom: '2px solid #00D4FF', borderRight: '2px solid #00D4FF', zIndex: 6, pointerEvents: 'none' }} />

      {/* Status indicator */}
      <div
        className={isDevis ? 'status-pulse-green' : 'status-pulse-blue'}
        style={{ position: 'absolute', top: 8, right: 20, zIndex: 7, width: 6, height: 6, background: isDevis ? '#00FF88' : '#00D4FF', boxShadow: isDevis ? '0 0 6px #00FF88' : '0 0 5px #00D4FF', pointerEvents: 'none' }}
      />

      {/* ── Photo ──────────────────────────────────────── */}
      {v.imageUrl ? (
        <div style={{ position: 'relative', height: 176, overflow: 'hidden', background: '#0A1628' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={v.imageUrl}
            alt={`${v.model} ${v.trim}`}
            animate={{
              scale:   isHovered ? 1.04 : (isInView ? 1.0 : 1.05),
              opacity: isInView ? 1 : 0,
            }}
            transition={{
              scale:   { duration: isHovered ? 0.4 : 0.6, ease: 'easeOut' },
              opacity: { duration: 0.6 },
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
          />
          {/* Bottom fade only — no colour alteration */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0A1628 0%, #0A1628 10%, transparent 50%)' }} />

          {/* Brand callsign badge — slides from left */}
          <motion.div
            className="font-data"
            animate={isInView ? { x: 0, opacity: 1 } : { x: -12, opacity: 0 }}
            transition={{ delay: d + 0.1, duration: 0.4 }}
            style={{ position: 'absolute', top: 12, left: 16, zIndex: 2, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: brand.color, textTransform: 'uppercase', background: 'rgba(10,22,40,0.7)', border: `1px solid ${brand.color}40`, padding: '3px 8px', backdropFilter: 'blur(4px)' }}
          >
            ◉ {brand.callsign}
          </motion.div>

          {v.color && (
            <span className="font-data" style={{ position: 'absolute', bottom: 10, left: 16, zIndex: 2, fontSize: 9, color: '#F0F4FF80', letterSpacing: '0.1em' }}>
              {v.color}
            </span>
          )}

          {v.voltage && (
            <motion.div
              className="font-data"
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: d + 0.1, duration: 0.3 }}
              style={{ position: 'absolute', top: 12, right: 14, zIndex: 2, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#00D4FF', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', padding: '3px 7px' }}
            >
              {v.voltage}V
            </motion.div>
          )}
        </div>
      ) : (
        <div style={{ height: 60, background: `linear-gradient(135deg, #0D1F3C, ${brand.color}15)` }}>
          <div className="font-data" style={{ padding: '14px 16px', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: brand.color, textTransform: 'uppercase' }}>
            ◉ {brand.callsign}
          </div>
        </div>
      )}

      {/* ── Model / Price ─────────────────────────────── */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px dashed rgba(0,212,255,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>

          {/* Model — slide from left */}
          <motion.div
            style={{ minWidth: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : { x: -12, opacity: 0 }}
            transition={{ delay: d + 0.1, duration: 0.4 }}
          >
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: '#F0F4FF', lineHeight: 1.2 }}>
              {v.model}
            </h2>
            <p className="font-data" style={{ fontSize: 9, color: '#4A6080', marginTop: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {v.trim}
            </p>
          </motion.div>

          {/* Price — scale in like instrument display */}
          <motion.div
            style={{ textAlign: 'right', flexShrink: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
            transition={{ delay: d + 0.15, duration: 0.5 }}
          >
            <div style={{ fontSize: 20, color: '#F0F4FF', lineHeight: 1, textShadow: `0 0 16px ${brand.glow}` }}>
              <PriceOdometer price={v.price.total} isActive={isInView} baseDelay={d + 0.15} />
            </div>
            <div className="font-data" style={{ fontSize: 8, letterSpacing: '0.15em', marginTop: 4, textTransform: 'uppercase', color: isDevis ? '#00D4FF' : '#4A6080' }}>
              {isDevis ? `📄 ${v.price.concession ?? 'offre'}` : 'CATALOGUE'}
            </div>
            {v.price.validUntil && (
              <div className="font-data" style={{ fontSize: 8, color: '#4A6080', marginTop: 2, letterSpacing: '0.08em' }}>
                val. {new Date(v.price.validUntil).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Battery ───────────────────────────────────── */}
      <div style={{ padding: '12px 16px 8px' }}>
        <HUDGauge
          label={`BATTERIE · ${v.batteryType ?? ''}`}
          targetNum={v.battery} suffix=" kWh"
          pct={(v.battery / 100) * 100}
          color={brand.barColor}
          blockDelay={d + 0.2} isInView={isInView}
        />
      </div>

      {/* ── 4 metrics (staggered 0.08s) ─────────────── */}
      <div style={{ padding: '8px 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
        <HUDGauge
          label="RECHARGE 10→80%"
          prefix="~" targetNum={v.chargeTime1080} suffix=" min"
          pct={Math.max(5, 100 - (v.chargeTime1080 / 60) * 100)}
          color={isSlowCharge ? '#FF6B00' : '#00D4FF'}
          blockDelay={d + 0.28} isInView={isInView} warn={isSlowCharge}
        />
        <HUDGauge
          label="PUISS. CHARGE"
          targetNum={v.chargePower} suffix=" kW"
          pct={(v.chargePower / 500) * 100}
          color="#0033A0"
          blockDelay={d + 0.36} isInView={isInView}
        />
        <HUDGauge
          label="AUTO. WLTP"
          targetNum={v.rangeWltp} suffix=" km"
          pct={(v.rangeWltp / 700) * 100}
          color={brand.barColor}
          blockDelay={d + 0.44} isInView={isInView}
        />
        <HUDGauge
          label="AUTOROUTE ~120"
          prefix="~" targetNum={v.rangeHighway} suffix=" km"
          pct={(v.rangeHighway / 700) * 100}
          color="#4A6080"
          blockDelay={d + 0.52} isInView={isInView} warn={v.rangeHighway < 350}
        />
      </div>

      {/* ── Power / transmission row ───────────────── */}
      <motion.div
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ delay: d + 0.35, duration: 0.35 }}
        style={{ margin: '0 16px 12px', padding: '8px 10px', background: 'rgba(0,51,160,0.08)', border: '1px solid rgba(0,51,160,0.2)', display: 'flex', gap: 20, flexWrap: 'wrap' }}
      >
        <div>
          <div className="font-data" style={{ fontSize: 8, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Puissance</div>
          <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: brand.color, marginTop: 1 }}>
            <SpringNumber target={v.power} suffix=" ch" isActive={isInView} />
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
              <SpringNumber target={v.acceleration} suffix=" s" isActive={isInView} />
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Tags (cascade stagger 0.05s) ──────────── */}
      <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {v.tags.map((tag, i) => (
          <motion.span
            key={tag}
            className="font-data"
            animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            transition={{ delay: d + 0.4 + i * 0.05, duration: 0.25, ease: 'backOut' }}
            style={{ display: 'inline-block', fontSize: 8, padding: '2px 8px', letterSpacing: '0.1em', color: '#4A6080', background: 'rgba(0,51,160,0.1)', border: '1px solid rgba(0,51,160,0.25)', textTransform: 'uppercase' }}
          >
            {tag}
          </motion.span>
        ))}
      </div>

      {/* ── Notes ─────────────────────────────────── */}
      <motion.div
        style={{ padding: '0 16px 12px', borderBottom: '1px dashed rgba(0,212,255,0.2)' }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: d + 0.45, duration: 0.4 }}
      >
        <p className="font-body" style={{ fontSize: 10, color: '#4A6080', fontStyle: 'italic', lineHeight: 1.5 }}>
          {v.notes}
        </p>
      </motion.div>

      {/* ── Voir fiche — last to appear ────────────── */}
      <motion.div
        style={{ padding: '10px 16px' }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ delay: d + 0.5, duration: 0.4 }}
      >
        <Link
          href={`/vehicles/${v.id}`}
          className="font-data"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: brand.color, textTransform: 'uppercase', border: `1px solid ${brand.color}35`, background: `${brand.color}06`, textDecoration: 'none' }}
        >
          VOIR FICHE COMPLÈTE <span style={{ fontSize: 10 }}>→</span>
        </Link>
      </motion.div>

      {/* ── Price detail (devis) ───────────────────── */}
      {isDevis && (
        <div style={{ borderTop: '1px dashed rgba(0,212,255,0.2)' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="font-data"
            style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 8, letterSpacing: '0.15em', color: '#4A6080', textTransform: 'uppercase', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left' }}
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
            <div style={{ margin: '0 12px 12px', padding: '12px', background: 'rgba(0,51,160,0.08)', border: '1px solid rgba(0,212,255,0.15)', backdropFilter: 'blur(8px)' }}>
              {[
                v.price.catalogue   != null && { label: 'Prix catalogue',     val: fmt(v.price.catalogue),              neg: false },
                v.price.options     != null && { label: 'Options',             val: `+ ${fmt(v.price.options!)}`,         neg: false },
                v.price.supplements != null && { label: 'Suppléments',         val: `+ ${fmt(v.price.supplements!)}`,     neg: false },
                v.price.remiseCommerciale != null && { label: 'Remise commerciale', val: `− ${fmt(v.price.remiseCommerciale!)}`, neg: true },
                v.price.remiseCEE   != null && { label: 'Remise CEE',          val: `− ${fmt(v.price.remiseCEE!)}`,       neg: true },
              ].filter(Boolean).map((row, i) => {
                const r = row as { label: string; val: string; neg: boolean }
                return (
                  <div key={i} className="font-data" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 6, color: r.neg ? '#FF6B00' : '#4A6080' }}>
                    <span>{r.label}</span><span>{r.val}</span>
                  </div>
                )
              })}
              <div className="font-data" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#F0F4FF', borderTop: '1px solid rgba(0,51,160,0.3)', paddingTop: 8, marginTop: 4 }}>
                <span>TOTAL OFFRE</span>
                <span style={{ color: brand.color }}>{fmt(v.price.total)}</span>
              </div>

              {v.extraDiscount && (
                <div style={{ marginTop: 10, padding: '10px', background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)' }}>
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
    </motion.article>
  )
}
