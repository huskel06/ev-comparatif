'use client'

import { Vehicle } from '@/types/vehicle'

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function CompareTable({ vehicles }: { vehicles: Vehicle[] }) {
  const bestRange   = Math.max(...vehicles.map(v => v.rangeWltp))
  const bestHighway = Math.max(...vehicles.map(v => v.rangeHighway))
  const bestCharge  = Math.min(...vehicles.map(v => v.chargeTime1080))
  const bestPrice   = Math.min(...vehicles.map(v => v.price.total))

  return (
    <div className="bg-[#131d2e] border border-[#1e2d45] rounded-2xl overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr className="bg-[#0e1520] border-b border-[#1e2d45]">
            {['Modèle / Finition', 'Batterie', 'Recharge 10→80%', 'Autonomie WLTP', 'Autoroute', 'Prix offre'].map(h => (
              <th key={h} className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-slate-500 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vehicles.map(v => (
            <tr key={v.id} className="border-b border-[#1e2d45] last:border-0 hover:bg-[#0e1520]/60 transition-colors">
              <td className="px-5 py-4">
                <div className="font-display font-semibold text-sm text-slate-200 tracking-tight">{v.model}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{v.trim}{v.color ? ` · ${v.color}` : ''}</div>
              </td>
              <td className="px-5 py-4 text-sm text-slate-400">{v.battery} kWh{v.batteryType ? ` (${v.batteryType})` : ''}</td>
              <td className={`px-5 py-4 text-sm font-semibold ${v.chargeTime1080 === bestCharge ? 'text-emerald-400' : 'text-slate-400'}`}>
                ~{v.chargeTime1080} min {v.chargeTime1080 === bestCharge ? '⚡' : ''}
              </td>
              <td className={`px-5 py-4 text-sm font-semibold ${v.rangeWltp === bestRange ? 'text-emerald-400' : 'text-slate-400'}`}>
                {v.rangeWltp} km {v.rangeWltp === bestRange ? '🏆' : ''}
              </td>
              <td className={`px-5 py-4 text-sm font-semibold ${v.rangeHighway === bestHighway ? 'text-emerald-400' : 'text-slate-400'}`}>
                ~{v.rangeHighway} km {v.rangeHighway === bestHighway ? '🏆' : ''}
              </td>
              <td className="px-5 py-4">
                <div className={`text-sm font-bold ${v.price.total === bestPrice ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {fmt(v.price.total)} {v.price.total === bestPrice ? '✓' : ''}
                </div>
                {v.extraDiscount && (
                  <div className="text-[10px] text-slate-500 mt-0.5">~{fmt(v.extraDiscount.result)} avec −{v.extraDiscount.percent}%</div>
                )}
                <div className={`text-[10px] mt-0.5 ${v.price.source !== 'catalogue' ? 'text-emerald-500/70' : 'text-slate-600'}`}>
                  {v.price.source === 'offre' ? `📄 ${v.price.concession}` : v.price.source === 'devis' ? '📄 devis' : 'catalogue'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
