'use client'

import { useState } from 'react'
import { Vehicle } from '@/types/vehicle'

const brandColors: Record<string, { badge: string; bar: string; text: string }> = {
  xpeng:  { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',  bar: 'bg-emerald-400', text: 'text-emerald-400' },
  renault:{ badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',        bar: 'bg-amber-400',   text: 'text-amber-400' },
  vw:     { badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',              bar: 'bg-sky-400',     text: 'text-sky-400' },
  skoda:  { badge: 'bg-green-500/10 text-green-400 border-green-500/20',        bar: 'bg-green-400',   text: 'text-green-400' },
  kia:    { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',           bar: 'bg-rose-400',    text: 'text-rose-400' },
  audi:   { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',     bar: 'bg-purple-400',  text: 'text-purple-400' },
  other:  { badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',        bar: 'bg-slate-400',   text: 'text-slate-400' },
}

const brandLabels: Record<string, string> = {
  xpeng: '⚡ Xpeng', renault: '🔷 Renault', vw: '◎ Volkswagen',
  skoda: '🍃 Skoda', kia: '🐯 Kia', audi: '◈ Audi', other: '• Autre',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

interface MetricBarProps {
  label: string; value: string; pct: number; barClass: string; highlight?: boolean; warn?: boolean
}
function MetricBar({ label, value, pct, barClass, highlight, warn }: MetricBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className={`font-display font-semibold text-base tracking-tight ${highlight ? 'text-emerald-400' : warn ? 'text-orange-400' : 'text-slate-200'}`}>
        {value}
      </span>
      <div className="h-0.5 bg-slate-700/50 rounded-full overflow-hidden mt-1">
        <div className={`h-full rounded-full transition-all duration-1000 ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function VehicleCard({ v }: { v: Vehicle }) {
  const [expanded, setExpanded] = useState(false)
  const c = brandColors[v.brand] ?? brandColors.other
  const isDevis = v.price.source !== 'catalogue'

  return (
    <article className="group bg-[#131d2e] border border-[#1e2d45] rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-emerald-500/25 hover:shadow-[0_24px_64px_rgba(0,0,0,0.4),0_0_40px_rgba(79,255,176,0.04)] transition-all duration-300">

      {/* Photo */}
      {v.imageUrl && (
        <div className="relative h-52 overflow-hidden bg-[#0e1520]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={v.imageUrl}
            alt={`${v.model} ${v.trim}`}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#131d2e] to-transparent" />
          {v.color && (
            <span className="absolute bottom-3 left-4 text-[10px] text-slate-400 tracking-wide font-medium">{v.color}</span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-4 pb-4 border-b border-[#1e2d45] flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold tracking-widest uppercase border mb-2 ${c.badge}`}>
            {brandLabels[v.brand]}
          </span>
          <h2 className="font-display font-bold text-lg tracking-tight text-slate-100 leading-tight">{v.model}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{v.trim}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-black text-2xl tracking-tighter text-slate-100">{fmt(v.price.total)}</div>
          <div className={`text-[10px] uppercase tracking-widest mt-0.5 ${isDevis ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isDevis ? `📄 ${v.price.concession ?? 'offre'}` : 'catalogue'}
          </div>
          {v.price.validUntil && (
            <div className="text-[10px] text-slate-600 mt-0.5">
              val. {new Date(v.price.validUntil).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>
      </div>

      {/* Battery */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Capacité batterie</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-5 bg-[#0e1520] border border-[#1e2d45] rounded overflow-hidden">
            <div
              className={`h-full flex items-center justify-end pr-2 text-[9px] font-bold text-black/70 transition-all duration-1000 ${c.bar}`}
              style={{ width: `${(v.battery / 100) * 100}%` }}
            >
              {v.battery} kWh
            </div>
          </div>
          <span className="font-display font-bold text-sm text-slate-200 min-w-[56px] text-right">{v.battery} kWh</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 py-4 grid grid-cols-2 gap-4">
        <MetricBar label="⚡ Recharge 10→80%" value={`~${v.chargeTime1080} min`}
          pct={Math.max(5, 100 - (v.chargeTime1080 / 60) * 100)}
          barClass={v.chargeTime1080 <= 20 ? 'bg-emerald-400' : v.chargeTime1080 <= 35 ? 'bg-amber-400' : 'bg-orange-400'}
          highlight={v.chargeTime1080 <= 20} warn={v.chargeTime1080 > 35} />
        <MetricBar label="🔋 Puissance max" value={`${v.chargePower} kW`}
          pct={(v.chargePower / 500) * 100} barClass="bg-sky-400" />
        <MetricBar label="🛣 Autonomie WLTP" value={`${v.rangeWltp} km`}
          pct={(v.rangeWltp / 700) * 100} barClass={c.bar}
          highlight={v.rangeWltp >= 600} />
        <MetricBar label="🏎 Autoroute ~120km/h" value={`~${v.rangeHighway} km`}
          pct={(v.rangeHighway / 700) * 100} barClass={c.bar}
          warn={v.rangeHighway < 350} />
      </div>

      {/* Notes */}
      <div className="px-5 pb-4 border-t border-[#1e2d45] pt-4">
        <p className="text-[11px] text-slate-500 italic leading-relaxed">{v.notes}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {v.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-[#0e1520] border border-[#1e2d45] text-slate-500">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Price detail toggle */}
      {isDevis && (
        <div className="px-5 pb-5 border-t border-[#1e2d45] pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <span className={`inline-block transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>▶</span>
            Détail prix offre commerciale
          </button>

          {expanded && (
            <div className="mt-3 text-[11px] text-slate-500 space-y-1.5">
              {v.price.catalogue   && <div className="flex justify-between"><span>Prix catalogue</span><span className="text-slate-400">{fmt(v.price.catalogue)}</span></div>}
              {v.price.options     && <div className="flex justify-between"><span>Options</span><span className="text-slate-400">+{fmt(v.price.options)}</span></div>}
              {v.price.supplements && <div className="flex justify-between"><span>Suppléments</span><span className="text-slate-400">+{fmt(v.price.supplements)}</span></div>}
              {v.price.remiseCommerciale && <div className="flex justify-between text-orange-400/80"><span>Participation commerciale</span><span>−{fmt(v.price.remiseCommerciale)}</span></div>}
              {v.price.remiseCEE   && <div className="flex justify-between text-orange-400/80"><span>Remise CEE</span><span>−{fmt(v.price.remiseCEE)}</span></div>}
              <div className="flex justify-between font-semibold text-slate-200 border-t border-[#1e2d45] pt-2 mt-1">
                <span>Total offre</span><span>{fmt(v.price.total)}</span>
              </div>

              {v.extraDiscount && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <p className="text-amber-400 font-semibold mb-1.5">💡 {v.extraDiscount.label}</p>
                  <p>Remise {v.extraDiscount.percent}% = −{fmt(v.price.total * v.extraDiscount.percent / 100)}</p>
                  <p className="text-emerald-400 font-semibold mt-1">Prix potentiel : {fmt(v.extraDiscount.result)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
