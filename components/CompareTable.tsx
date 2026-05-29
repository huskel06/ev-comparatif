'use client'

import { Vehicle } from '@/types/vehicle'

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const BRANDS: Record<string, { color: string }> = {
  xpeng:   { color: '#00D4FF' },
  renault: { color: '#FF6B00' },
  vw:      { color: '#60A5FA' },
  skoda:   { color: '#4ADE80' },
  kia:     { color: '#F87171' },
  audi:    { color: '#C084FC' },
  other:   { color: '#94A3B8' },
}

const HEADERS = [
  { label: 'MODÈLE / FINITION', icon: '◈' },
  { label: 'BATTERIE',          icon: '▣' },
  { label: 'RECHARGE 10→80%',   icon: '⚡' },
  { label: 'AUTO. WLTP',        icon: '▷' },
  { label: 'AUTOROUTE',         icon: '⇒' },
  { label: 'PRIX OFFRE',        icon: '◎' },
]

export default function CompareTable({ vehicles }: { vehicles: Vehicle[] }) {
  const bestRange   = Math.max(...vehicles.map(v => v.rangeWltp))
  const bestHighway = Math.max(...vehicles.map(v => v.rangeHighway))
  const bestCharge  = Math.min(...vehicles.map(v => v.chargeTime1080))
  const bestPrice   = Math.min(...vehicles.map(v => v.price.total))

  return (
    <div style={{
      background: '#0D1F3C',
      border: '1px solid rgba(0,51,160,0.35)',
      overflow: 'hidden',
      overflowX: 'auto',
    }}>
      <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#0A1628', borderBottom: '1px solid rgba(0,51,160,0.5)' }}>
            {HEADERS.map(h => (
              <th key={h.label} style={{ padding: '12px 16px', textAlign: 'left' }}>
                <div className="font-data" style={{
                  fontSize: 8, letterSpacing: '0.2em', color: '#4A6080',
                  textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ color: '#0033A0', fontSize: 10 }}>{h.icon}</span>
                  {h.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, rowIdx) => {
            const brand = BRANDS[v.brand] ?? BRANDS.other
            const isEvenRow = rowIdx % 2 === 0
            const rowBg = isEvenRow ? 'rgba(0,51,160,0.04)' : 'transparent'
            const isBestCharge  = v.chargeTime1080 === bestCharge
            const isBestRange   = v.rangeWltp === bestRange
            const isBestHighway = v.rangeHighway === bestHighway
            const isBestPrice   = v.price.total === bestPrice

            return (
              <tr
                key={v.id}
                style={{
                  background: rowBg,
                  borderBottom: '1px solid rgba(0,51,160,0.2)',
                  transition: 'background 0.15s',
                }}
                className="hover:[background:rgba(0,51,160,0.12)]"
              >
                {/* Model */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 28, background: brand.color, flexShrink: 0 }} />
                    <div>
                      <div className="font-display" style={{ fontWeight: 600, fontSize: 13, color: '#F0F4FF', letterSpacing: '-0.01em' }}>
                        {v.model}
                      </div>
                      <div className="font-data" style={{ fontSize: 8, color: '#4A6080', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {v.trim}{v.color ? ` · ${v.color}` : ''}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Battery */}
                <td style={{ padding: '14px 16px' }}>
                  <span className="font-data" style={{ fontSize: 12, color: '#F0F4FF' }}>
                    {v.battery} <span style={{ fontSize: 9, color: '#4A6080' }}>kWh</span>
                  </span>
                  {v.batteryType && (
                    <div className="font-data" style={{ fontSize: 8, color: '#4A6080', marginTop: 2 }}>{v.batteryType}</div>
                  )}
                </td>

                {/* Charge */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isBestCharge && (
                      <span className="best-tri font-data" style={{ fontSize: 8, color: '#00D4FF' }}>▲</span>
                    )}
                    <span className={`font-data ${isBestCharge ? 'best-pulse' : ''}`} style={{
                      fontSize: 12, fontWeight: isBestCharge ? 700 : 400,
                      color: isBestCharge ? '#00D4FF' : v.chargeTime1080 > 35 ? '#FF6B00' : '#F0F4FF',
                      textShadow: isBestCharge ? '0 0 12px rgba(0,212,255,0.5)' : 'none',
                    }}>
                      ~{v.chargeTime1080} <span style={{ fontSize: 9, color: isBestCharge ? '#00D4FF80' : '#4A6080' }}>min</span>
                    </span>
                  </div>
                </td>

                {/* WLTP range */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isBestRange && (
                      <span className="best-tri font-data" style={{ fontSize: 8, color: '#00D4FF' }}>▲</span>
                    )}
                    <span className={`font-data ${isBestRange ? 'best-pulse' : ''}`} style={{
                      fontSize: 12, fontWeight: isBestRange ? 700 : 400,
                      color: isBestRange ? '#00D4FF' : '#F0F4FF',
                      textShadow: isBestRange ? '0 0 12px rgba(0,212,255,0.5)' : 'none',
                    }}>
                      {v.rangeWltp} <span style={{ fontSize: 9, color: isBestRange ? '#00D4FF80' : '#4A6080' }}>km</span>
                    </span>
                  </div>
                </td>

                {/* Highway range */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isBestHighway && (
                      <span className="best-tri font-data" style={{ fontSize: 8, color: '#00D4FF' }}>▲</span>
                    )}
                    <span className={`font-data ${isBestHighway ? 'best-pulse' : ''}`} style={{
                      fontSize: 12, fontWeight: isBestHighway ? 700 : 400,
                      color: isBestHighway ? '#00D4FF' : v.rangeHighway < 350 ? '#FF6B00' : '#F0F4FF',
                      textShadow: isBestHighway ? '0 0 12px rgba(0,212,255,0.5)' : 'none',
                    }}>
                      ~{v.rangeHighway} <span style={{ fontSize: 9, color: isBestHighway ? '#00D4FF80' : '#4A6080' }}>km</span>
                    </span>
                  </div>
                </td>

                {/* Price */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isBestPrice && (
                      <span className="best-tri font-data" style={{ fontSize: 8, color: '#00D4FF' }}>▲</span>
                    )}
                    <div>
                      <div className={`font-data ${isBestPrice ? 'best-pulse' : ''}`} style={{
                        fontSize: 12, fontWeight: 700,
                        color: isBestPrice ? '#00D4FF' : '#F0F4FF',
                        textShadow: isBestPrice ? '0 0 12px rgba(0,212,255,0.5)' : 'none',
                      }}>
                        {fmt(v.price.total)}
                      </div>
                      {v.extraDiscount && (
                        <div className="font-data" style={{ fontSize: 8, color: '#4A6080', marginTop: 2 }}>
                          ~{fmt(v.extraDiscount.result)} avec −{v.extraDiscount.percent}%
                        </div>
                      )}
                      <div className="font-data" style={{
                        fontSize: 8, marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: v.price.source !== 'catalogue' ? '#00D4FF80' : '#4A6080',
                      }}>
                        {v.price.source === 'offre'
                          ? `📄 ${v.price.concession}`
                          : v.price.source === 'devis'
                          ? '📄 DEVIS'
                          : 'CATALOGUE'}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
