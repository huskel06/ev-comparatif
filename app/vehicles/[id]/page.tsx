import { notFound } from 'next/navigation'
import Link from 'next/link'
import { vehicles } from '@/data/vehicles'
import { Vehicle } from '@/types/vehicle'

export function generateStaticParams() {
  return vehicles.map(v => ({ id: v.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const v = vehicles.find(v => v.id === id)
  if (!v) return {}
  return {
    title: `${v.model} ${v.trim} — Mon Garage Électrique`,
    description: v.notes,
  }
}

const brandColors: Record<string, { badge: string; bar: string; accent: string }> = {
  xpeng:   { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', bar: 'bg-emerald-400', accent: 'text-emerald-400' },
  renault: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       bar: 'bg-amber-400',   accent: 'text-amber-400' },
  vw:      { badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',             bar: 'bg-sky-400',     accent: 'text-sky-400' },
  skoda:   { badge: 'bg-green-500/10 text-green-400 border-green-500/20',       bar: 'bg-green-400',   accent: 'text-green-400' },
  kia:     { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',          bar: 'bg-rose-400',    accent: 'text-rose-400' },
  audi:    { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',    bar: 'bg-purple-400',  accent: 'text-purple-400' },
  other:   { badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',       bar: 'bg-slate-400',   accent: 'text-slate-400' },
}

const brandLabels: Record<string, string> = {
  xpeng: '⚡ Xpeng', renault: '🔷 Renault', vw: '◎ Volkswagen',
  skoda: '🍃 Skoda', kia: '🐯 Kia', audi: '◈ Audi', other: '• Autre',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

interface SpecRowProps { label: string; value: string; highlight?: boolean }
function SpecRow({ label, value, highlight }: SpecRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1e2d45] last:border-0">
      <span className="text-[11px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className={`font-display font-semibold text-sm ${highlight ? 'text-emerald-400' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  )
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const v: Vehicle | undefined = vehicles.find(v => v.id === id)
  if (!v) notFound()

  const c = brandColors[v.brand] ?? brandColors.other
  const isDevis = v.price.source !== 'catalogue'

  return (
    <div className="min-h-screen bg-[#0e1520] text-slate-100">
      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(79,255,176,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-10">

        {/* Back nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Retour au comparatif
        </Link>

        {/* Hero image */}
        {v.imageUrl && (
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-[#131d2e] mb-8 border border-[#1e2d45]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.imageUrl}
              alt={`${v.model} ${v.trim}`}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0e1520] to-transparent" />
            {v.color && (
              <span className="absolute bottom-4 left-5 text-xs text-slate-400 tracking-wide">{v.color}</span>
            )}
          </div>
        )}

        {/* Title block */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-widest uppercase border mb-3 ${c.badge}`}>
              {brandLabels[v.brand]}
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tighter text-slate-100 leading-tight">
              {v.model}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">{v.trim}</p>
          </div>
          <div className="text-right">
            <div className="font-display font-black text-3xl tracking-tighter">{fmt(v.price.total)}</div>
            <div className={`text-[10px] uppercase tracking-widest mt-1 ${isDevis ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isDevis ? `📄 ${v.price.concession ?? 'offre commerciale'}` : 'prix catalogue'}
            </div>
            {v.price.validUntil && (
              <div className="text-[10px] text-slate-600 mt-0.5">
                valable jusqu&apos;au {new Date(v.price.validUntil).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Specs */}
          <section className="bg-[#131d2e] border border-[#1e2d45] rounded-2xl p-5">
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Fiche technique</h2>
            <SpecRow label="Batterie" value={`${v.battery} kWh${v.batteryType ? ` · ${v.batteryType}` : ''}`} />
            <SpecRow label="Recharge 10→80 %" value={`~${v.chargeTime1080} min`} highlight={v.chargeTime1080 <= 20} />
            <SpecRow label="Puissance de charge" value={`${v.chargePower} kW`} />
            {v.voltage && <SpecRow label="Architecture" value={`${v.voltage} V`} />}
            <SpecRow label="Autonomie WLTP" value={`${v.rangeWltp} km`} highlight={v.rangeWltp >= 600} />
            <SpecRow label="Autonomie autoroute" value={`~${v.rangeHighway} km`} />
            <SpecRow label="Puissance moteur" value={`${v.power} ch`} />
            <SpecRow label="Transmission" value={v.drivetrain} />
            {v.acceleration && <SpecRow label="0 – 100 km/h" value={`${v.acceleration} s`} />}
          </section>

          {/* Price detail */}
          <section className="bg-[#131d2e] border border-[#1e2d45] rounded-2xl p-5 flex flex-col gap-3">
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Détail du prix</h2>

            <div className="space-y-2 text-[12px]">
              {v.price.catalogue != null && (
                <div className="flex justify-between text-slate-400">
                  <span>Prix catalogue</span>
                  <span>{fmt(v.price.catalogue)}</span>
                </div>
              )}
              {v.price.options != null && (
                <div className="flex justify-between text-slate-400">
                  <span>Options</span>
                  <span>+ {fmt(v.price.options)}</span>
                </div>
              )}
              {v.price.supplements != null && (
                <div className="flex justify-between text-slate-400">
                  <span>Suppléments</span>
                  <span>+ {fmt(v.price.supplements)}</span>
                </div>
              )}
              {v.price.remiseCommerciale != null && (
                <div className="flex justify-between text-orange-400/80">
                  <span>Remise commerciale</span>
                  <span>− {fmt(v.price.remiseCommerciale)}</span>
                </div>
              )}
              {v.price.remiseCEE != null && (
                <div className="flex justify-between text-orange-400/80">
                  <span>Remise CEE</span>
                  <span>− {fmt(v.price.remiseCEE)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-100 border-t border-[#1e2d45] pt-3 mt-1 text-sm">
                <span>Total</span>
                <span className={c.accent}>{fmt(v.price.total)}</span>
              </div>
            </div>

            {v.extraDiscount && (
              <div className="mt-1 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <p className="text-amber-400 font-semibold text-xs mb-2">💡 {v.extraDiscount.label}</p>
                <p className="text-[11px] text-slate-400">
                  Remise {v.extraDiscount.percent} % = − {fmt(v.price.total * v.extraDiscount.percent / 100)}
                </p>
                <p className="text-emerald-400 font-semibold text-sm mt-1.5">
                  Prix potentiel : {fmt(v.extraDiscount.result)}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Tags + Notes */}
        <section className="mt-6 bg-[#131d2e] border border-[#1e2d45] rounded-2xl p-5">
          <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Notes & équipements</h2>
          <p className="text-sm text-slate-400 leading-relaxed italic mb-4">{v.notes}</p>
          <div className="flex flex-wrap gap-1.5">
            {v.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-[#0e1520] border border-[#1e2d45] text-slate-500">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Footer */}
        <p className="mt-8 text-center text-[10px] text-slate-600">
          Données mises à jour le{' '}
          {new Date(v.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}
