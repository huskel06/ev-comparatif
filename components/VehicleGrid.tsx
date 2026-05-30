'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Brand, Vehicle } from '@/types/vehicle'
import FilterBar from './FilterBar'
import VehicleCard from './VehicleCard'

/* ── Stagger variants ────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96, filter: 'blur(4px)' },
  visible: {
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

/* ── VehicleGrid ─────────────────────────────────────────────── */
export default function VehicleGrid({ vehicles }: { vehicles: Vehicle[] }) {
  const brands = useMemo(
    () => [...new Set(vehicles.map(v => v.brand))] as Brand[],
    [vehicles],
  )
  const minPossiblePrice = useMemo(() => Math.min(...vehicles.map(v => v.price.total)), [vehicles])
  const maxPossiblePrice = useMemo(() => Math.max(...vehicles.map(v => v.price.total)), [vehicles])
  const bestRange        = useMemo(() => Math.max(...vehicles.map(v => v.rangeWltp)),   [vehicles])
  const lowestPrice      = minPossiblePrice

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
            style={{ marginTop: 16, fontSize: 9, color: '#00D4FF', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'underline', textUnderlineOffset: 4, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            RÉINITIALISER
          </button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}
        >
          {filtered.map((v) => (
            <motion.div key={v.id} variants={cardVariants}>
              <VehicleCard v={v} bestRange={bestRange} lowestPrice={lowestPrice} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  )
}
