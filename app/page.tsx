import { vehicles } from '@/data/vehicles'
import VehicleCard from '@/components/VehicleCard'
import CompareTable from '@/components/CompareTable'

export default function Home() {
  const bestRange  = Math.max(...vehicles.map(v => v.rangeWltp))
  const lowestPrice = Math.min(...vehicles.map(v => v.price.total))
  const updatedAt  = new Date(Math.max(...vehicles.map(v => new Date(v.updatedAt).getTime())))
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#0e1520] text-slate-100 relative overflow-x-hidden">

      {/* Subtle grid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(79,255,176,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <header className="py-14 border-b border-[#1e2d45] mb-14">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-400 rounded-xl grid place-items-center text-xl shadow-lg shadow-emerald-400/20">⚡</div>
              <div>
                <div className="font-display font-black text-base tracking-tight text-slate-200">Mon Garage Électrique</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Suivi personnel · Comparatif VE</div>
              </div>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter">
              Comparatif <span className="text-emerald-400">VE</span>
            </h1>
          </div>
        </header>

        {/* Stats */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div className="flex gap-8">
            {[
              { value: String(vehicles.length), label: 'Véhicules' },
              { value: String(new Set(vehicles.map(v => v.brand)).size), label: 'Marques' },
              { value: `${bestRange} km`, label: 'Meilleure autonomie' },
              { value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(lowestPrice), label: 'Meilleur prix offre' },
            ].map(s => (
              <div key={s.label} className="hidden sm:block last:hidden xl:last:block">
                <div className="font-display font-bold text-3xl tracking-tighter text-emerald-400">{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
            <div className="sm:hidden">
              <div className="font-display font-bold text-3xl tracking-tighter text-emerald-400">{vehicles.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Véhicules</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#131d2e] border border-[#1e2d45] rounded-full px-4 py-2 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Mis à jour — {updatedAt}
          </div>
        </div>

        {/* Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-16">
          {vehicles.map(v => <VehicleCard key={v.id} v={v} />)}
        </section>

        {/* Table */}
        <section className="mb-16">
          <h2 className="text-[10px] font-display font-bold uppercase tracking-widest text-slate-500 mb-5">Vue tableau comparatif</h2>
          <CompareTable vehicles={vehicles} />
        </section>

        {/* Add devis zone */}
        <section className="bg-[#131d2e] border border-dashed border-[#1e2d45] rounded-2xl p-10 text-center mb-16 hover:border-emerald-500/20 transition-colors">
          <div className="text-3xl mb-3">📄</div>
          <h3 className="font-display font-bold text-lg mb-2">Ajouter un devis</h3>
          <p className="text-sm text-slate-500">
            Envoie une photo ou PDF à Claude → il met à jour{' '}
            <code className="text-emerald-400 bg-emerald-400/5 px-1.5 py-0.5 rounded text-xs">data/vehicles.ts</code>
            {' '}→ redéploiement automatique sur Vercel
          </p>
        </section>

        <footer className="border-t border-[#1e2d45] py-8 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-600">Données catalogue France — Prix hors bonus/prime · 📄 = prix issu d&apos;un devis</p>
          <p className="text-xs text-slate-600">Sources : Automobile-Propre · L&apos;Argus · Renault.fr · Xpeng.com · Volkswagen.fr</p>
        </footer>

      </div>
    </div>
  )
}
