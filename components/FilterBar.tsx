'use client'

import { Brand } from '@/types/vehicle'

const BRAND_CONFIG: Record<string, { callsign: string; color: string }> = {
  xpeng:   { callsign: 'XPENG',    color: '#00D4FF' },
  renault: { callsign: 'RENAULT',  color: '#FF6B00' },
  vw:      { callsign: 'VW GROUP', color: '#60A5FA' },
  skoda:   { callsign: 'ŠKODA',    color: '#4ADE80' },
  kia:     { callsign: 'KIA',      color: '#F87171' },
  audi:    { callsign: 'AUDI',     color: '#C084FC' },
  other:   { callsign: 'OTHER',    color: '#94A3B8' },
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
    <div style={{
      background: '#0D1F3C',
      border: '1px solid rgba(0,51,160,0.35)',
      padding: '16px 20px',
      marginBottom: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="font-data" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 8, letterSpacing: '0.25em', color: '#4A6080', textTransform: 'uppercase',
        }}>
          <span style={{ color: '#0033A0', fontSize: 12 }}>⧖</span>
          FILTRES ACTIFS
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="font-data" style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.1em' }}>
            <span style={{ color: '#00D4FF', fontWeight: 700, fontSize: 13 }}>{visibleCount}</span>
            {' '}/{' '}{totalCount} VÉHICULE{totalCount > 1 ? 'S' : ''}
          </span>
          {hasFilter && (
            <button
              onClick={onReset}
              className="font-data"
              style={{
                fontSize: 8, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase',
                border: '1px solid rgba(0,51,160,0.3)', padding: '4px 12px',
                background: 'none', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {/* Brand selector */}
      <div>
        <div className="font-data" style={{ fontSize: 8, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase', marginBottom: 10 }}>
          MARQUE
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {brands.map(brand => {
            const cfg = BRAND_CONFIG[brand] ?? BRAND_CONFIG.other
            const isActive = selectedBrands.has(brand)
            return (
              <button
                key={brand}
                onClick={() => onToggleBrand(brand)}
                className="font-data"
                style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                  padding: '5px 12px',
                  color: isActive ? cfg.color : '#4A6080',
                  background: isActive ? `${cfg.color}10` : 'transparent',
                  border: `1px solid ${isActive ? `${cfg.color}50` : 'rgba(0,51,160,0.25)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute', top: 3, right: 4,
                    width: 4, height: 4, borderRadius: '50%',
                    background: cfg.color, boxShadow: `0 0 4px ${cfg.color}`,
                  }} />
                )}
                {cfg.callsign}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="font-data" style={{ fontSize: 8, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase' }}>
            PRIX MAXIMUM
          </div>
          <span className="font-data" style={{ fontSize: 12, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.05em' }}>
            {fmt(priceLimit)}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          {/* Track background */}
          <div style={{
            height: 4,
            background: 'rgba(0,51,160,0.3)',
            position: 'relative',
            marginBottom: 6,
          }}>
            {/* Filled portion */}
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              background: 'linear-gradient(90deg, #0033A0, #00D4FF)',
              width: `${((priceLimit - minPossiblePrice) / (maxPossiblePrice - minPossiblePrice)) * 100}%`,
              transition: 'width 0.05s',
            }} />
          </div>
          <input
            type="range"
            min={minPossiblePrice}
            max={maxPossiblePrice}
            step={500}
            value={priceLimit}
            onChange={e => onPriceChange(Number(e.target.value))}
            style={{
              position: 'absolute', top: '-2px', left: 0, right: 0,
              width: '100%', height: 8,
              opacity: 0, cursor: 'pointer',
            }}
          />
        </div>
        <div className="font-data" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#4A6080', letterSpacing: '0.1em', marginTop: 2 }}>
          <span>{fmt(minPossiblePrice)}</span>
          <span>{fmt(maxPossiblePrice)}</span>
        </div>
      </div>
    </div>
  )
}
