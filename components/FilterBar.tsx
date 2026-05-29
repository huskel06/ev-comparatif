'use client'

import { Brand } from '@/types/vehicle'

const brandLabels: Record<string, string> = {
  xpeng: '⚡ Xpeng', renault: '🔷 Renault', vw: '◎ Volkswagen',
  skoda: '🍃 Skoda', kia: '🐯 Kia', audi: '◈ Audi', other: '• Autre',
}

const brandActive: Record<string, string> = {
  xpeng:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  renault: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  vw:      'bg-sky-500/15 text-sky-400 border-sky-500/40',
  skoda:   'bg-green-500/15 text-green-400 border-green-500/40',
  kia:     'bg-rose-500/15 text-rose-400 border-rose-500/40',
  audi:    'bg-purple-500/15 text-purple-400 border-purple-500/40',
  other:   'bg-slate-500/15 text-slate-400 border-slate-500/40',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

interface FilterBarProps {
  brands: Brand[]
  selectedBrands: Set<Brand>
  minPossiblePrice: number
  maxPossiblePrice: number
  priceLimit: number
  visibleCount: number
  totalCount: number
  onToggleBrand: (brand: Brand) => void
  onPriceChange: (max: number) => void
  onReset: () => void
}

export default function FilterBar({
  brands, selectedBrands, minPossiblePrice, maxPossiblePrice, priceLimit,
  visibleCount, totalCount, onToggleBrand, onPriceChange, onReset,
}: FilterBarProps) {
  const hasFilter = selectedBrands.size < brands.length || priceLimit < maxPossiblePrice

  return (
    <div className="bg-[#131d2e] border border-[#1e2d45] rounded-2xl px-5 py-4 mb-8 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Filtres</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            <span className="font-bold text-emerald-400">{visibleCount}</span>
            <span> / {totalCount} véhicule{totalCount > 1 ? 's' : ''}</span>
          </span>
          {hasFilter && (
            <button
              onClick={onReset}
              className="text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-300 transition-colors border border-[#1e2d45] hover:border-[#2e3d55] rounded-full px-3 py-1"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Brand pills */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2.5">Marque</p>
        <div className="flex flex-wrap gap-2">
          {brands.map(brand => {
            const isActive = selectedBrands.has(brand)
            return (
              <button
                key={brand}
                onClick={() => onToggleBrand(brand)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                  isActive
                    ? (brandActive[brand] ?? brandActive.other)
                    : 'bg-[#0e1520] text-slate-600 border-[#1e2d45] hover:text-slate-400 hover:border-[#2e3d55]'
                }`}
              >
                {brandLabels[brand] ?? brand}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-600">Prix maximum</p>
          <span className="text-xs font-display font-bold text-emerald-400">{fmt(priceLimit)}</span>
        </div>
        <input
          type="range"
          min={minPossiblePrice}
          max={maxPossiblePrice}
          step={500}
          value={priceLimit}
          onChange={e => onPriceChange(Number(e.target.value))}
          className="w-full h-1 bg-[#1e2d45] rounded-full appearance-none cursor-pointer accent-emerald-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600 mt-1.5">
          <span>{fmt(minPossiblePrice)}</span>
          <span>{fmt(maxPossiblePrice)}</span>
        </div>
      </div>
    </div>
  )
}
