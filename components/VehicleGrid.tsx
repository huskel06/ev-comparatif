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
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⊘</div>
          <p className="font-data" style={{ fontSize: 10, color: '#4A6080', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            AUCUN VÉHICULE — FILTRES TROP RESTRICTIFS
          </p>
          <button
            onClick={reset}
            className="font-data"
            style={{
              marginTop: 16, fontSize: 9, color: '#00D4FF', letterSpacing: '0.2em',
              textTransform: 'uppercase', textDecoration: 'underline', textUnderlineOffset: 4,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            RÉINITIALISER
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(v => <VehicleCard key={v.id} v={v} />)}
        </div>
      )}
    </>
  )
}
