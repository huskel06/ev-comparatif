'use client'

import { useMemo, useState } from 'react'
import { Brand, Vehicle } from '@/types/vehicle'
import FilterBar from './FilterBar'
import VehicleCard from './VehicleCard'

export default function VehicleGrid({ vehicles }: { vehicles: Vehicle[] }) {
  const brands = useMemo(
    () => [...new Set(vehicles.map(v => v.brand))] as Brand[],
    [vehicles],
  )
  const minPossiblePrice = useMemo(() => Math.min(...vehicles.map(v => v.price.total)), [vehicles])
  const maxPossiblePrice = useMemo(() => Math.max(...vehicles.map(v => v.price.total)), [vehicles])

  const [selectedBrands, setSelectedBrands] = useState<Set<Brand>>(new Set(brands))
  const [priceLimit, setPriceLimit] = useState(maxPossiblePrice)

  function toggleBrand(brand: Brand) {
    setSelectedBrands(prev => {
      const next = new Set(prev)
      if (next.has(brand)) {
        if (next.size === 1) return prev
        next.delete(brand)
      } else {
        next.add(brand)
      }
      return next
    })
  }

  function reset() {
    setSelectedBrands(new Set(brands))
    setPriceLimit(maxPossiblePrice)
  }

  const filtered = useMemo(
    () => vehicles.filter(v => selectedBrands.has(v.brand) && v.price.total <= priceLimit),
    [vehicles, selectedBrands, priceLimit],
  )

  return (
    <>
      <FilterBar
        brands={brands}
        selectedBrands={selectedBrands}
        minPossiblePrice={minPossiblePrice}
        maxPossiblePrice={maxPossiblePrice}
        priceLimit={priceLimit}
        visibleCount={filtered.length}
        totalCount={vehicles.length}
        onToggleBrand={toggleBrand}
        onPriceChange={setPriceLimit}
        onReset={reset}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm">Aucun véhicule ne correspond aux filtres.</p>
          <button
            onClick={reset}
            className="mt-4 text-xs text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-4"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(v => <VehicleCard key={v.id} v={v} />)}
        </div>
      )}
    </>
  )
}
