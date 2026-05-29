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

const BRANDS: Record<string, { color: string; callsign: string }> = {
  xpeng:   { color: '#00D4FF', callsign: 'XPENG' },
  renault: { color: '#FF6B00', callsign: 'RENAULT' },
  vw:      { color: '#60A5FA', callsign: 'VW GROUP' },
  skoda:   { color: '#4ADE80', callsign: 'ŠKODA' },
  kia:     { color: '#F87171', callsign: 'KIA' },
  audi:    { color: '#C084FC', callsign: 'AUDI' },
  other:   { color: '#94A3B8', callsign: 'UNIT' },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function SpecRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '1px solid rgba(0,51,160,0.2)',
    }}>
      <span className="font-data" style={{ fontSize: 9, letterSpacing: '0.15em', color: '#4A6080', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span className="font-data" style={{ fontSize: 12, fontWeight: 700, color: highlight ? '#00D4FF' : '#F0F4FF' }}>
        {value}
      </span>
    </div>
  )
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const v: Vehicle | undefined = vehicles.find(v => v.id === id)
  if (!v) notFound()

  const brand = BRANDS[v.brand] ?? BRANDS.other
  const isDevis = v.price.source !== 'catalogue'

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', color: '#F0F4FF' }}>
      {/* Grid bg */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(0,51,160,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,51,160,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />
      <div aria-hidden style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 240, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 960, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Back link */}
        <Link href="/" className="font-data" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 9, letterSpacing: '0.2em', color: '#4A6080', textTransform: 'uppercase',
          textDecoration: 'none', marginBottom: '2rem',
          transition: 'color 0.15s',
        }}>
          ← RETOUR AU COMPARATIF
        </Link>

        {/* Hero image */}
        {v.imageUrl && (
          <div style={{
            position: 'relative', height: 320, borderRadius: 0,
            overflow: 'hidden', background: '#0D1F3C', marginBottom: '2rem',
            border: `1px solid ${brand.color}30`,
            clipPath: 'polygon(32px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 32px)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.imageUrl}
              alt={`${v.model} ${v.trim}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(to bottom, rgba(0,51,160,0.35) 0%, rgba(10,22,40,0.88) 100%)`,
            }} />
            {/* Corner diagonal SVG */}
            <svg aria-hidden style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, zIndex: 2 }}>
              <line x1="0" y1="31" x2="31" y2="0" stroke={brand.color} strokeWidth="1.5" opacity="0.8" />
            </svg>
            {/* Callsign badge */}
            <div className="font-data" style={{
              position: 'absolute', top: 16, left: 20, zIndex: 3,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: brand.color,
              background: 'rgba(10,22,40,0.7)', border: `1px solid ${brand.color}40`,
              padding: '4px 10px', backdropFilter: 'blur(4px)', textTransform: 'uppercase',
            }}>
              ◉ {brand.callsign}
            </div>
            {v.color && (
              <span className="font-data" style={{ position: 'absolute', bottom: 16, left: 20, zIndex: 2, fontSize: 10, color: '#F0F4FF80', letterSpacing: '0.1em' }}>
                {v.color}
              </span>
            )}
          </div>
        )}

        {/* Title + price */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div>
            <h1 className="font-display" style={{ fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.4rem)', letterSpacing: '-0.03em', color: '#F0F4FF', lineHeight: 1.1 }}>
              {v.model}
            </h1>
            <p className="font-data" style={{ fontSize: 10, color: '#4A6080', marginTop: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {v.trim}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-data" style={{ fontSize: 28, fontWeight: 700, color: '#F0F4FF', letterSpacing: '-0.02em' }}>
              {fmt(v.price.total)}
            </div>
            <div className="font-data" style={{
              fontSize: 9, letterSpacing: '0.15em', marginTop: 4, textTransform: 'uppercase',
              color: isDevis ? '#00D4FF' : '#4A6080',
            }}>
              {isDevis ? `📄 ${v.price.concession ?? 'offre commerciale'}` : 'PRIX CATALOGUE'}
            </div>
            {v.price.validUntil && (
              <div className="font-data" style={{ fontSize: 8, color: '#4A6080', marginTop: 2, letterSpacing: '0.08em' }}>
                val. {new Date(v.price.validUntil).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

          {/* Specs */}
          <section style={{ background: '#0D1F3C', border: '1px solid rgba(0,51,160,0.35)', padding: '1.25rem 1.5rem' }}>
            <div className="font-data" style={{
              fontSize: 8, letterSpacing: '0.25em', color: brand.color, textTransform: 'uppercase',
              marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 20, height: 1, background: brand.color, display: 'inline-block' }} />
              FICHE TECHNIQUE
            </div>
            <SpecRow label="Batterie"            value={`${v.battery} kWh${v.batteryType ? ` · ${v.batteryType}` : ''}`} />
            <SpecRow label="Recharge 10→80 %"    value={`~${v.chargeTime1080} min`} highlight={v.chargeTime1080 <= 20} />
            <SpecRow label="Puissance de charge" value={`${v.chargePower} kW`} />
            {v.voltage && <SpecRow label="Architecture"    value={`${v.voltage} V`} highlight />}
            <SpecRow label="Autonomie WLTP"      value={`${v.rangeWltp} km`}    highlight={v.rangeWltp >= 600} />
            <SpecRow label="Autonomie autoroute" value={`~${v.rangeHighway} km`} />
            <SpecRow label="Puissance moteur"    value={`${v.power} ch`} />
            <SpecRow label="Transmission"        value={v.drivetrain} />
            {v.acceleration && <SpecRow label="0 – 100 km/h" value={`${v.acceleration} s`} />}
          </section>

          {/* Price detail */}
          <section style={{ background: '#0D1F3C', border: '1px solid rgba(0,51,160,0.35)', padding: '1.25rem 1.5rem' }}>
            <div className="font-data" style={{
              fontSize: 8, letterSpacing: '0.25em', color: brand.color, textTransform: 'uppercase',
              marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 20, height: 1, background: brand.color, display: 'inline-block' }} />
              DÉTAIL DU PRIX
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {v.price.catalogue != null && (
                <div className="font-data" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4A6080' }}>
                  <span>Prix catalogue</span><span>{fmt(v.price.catalogue)}</span>
                </div>
              )}
              {v.price.options != null && (
                <div className="font-data" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4A6080' }}>
                  <span>Options</span><span>+ {fmt(v.price.options)}</span>
                </div>
              )}
              {v.price.supplements != null && (
                <div className="font-data" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4A6080' }}>
                  <span>Suppléments</span><span>+ {fmt(v.price.supplements)}</span>
                </div>
              )}
              {v.price.remiseCommerciale != null && (
                <div className="font-data" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#FF6B00' }}>
                  <span>Remise commerciale</span><span>− {fmt(v.price.remiseCommerciale)}</span>
                </div>
              )}
              {v.price.remiseCEE != null && (
                <div className="font-data" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#FF6B00' }}>
                  <span>Remise CEE</span><span>− {fmt(v.price.remiseCEE)}</span>
                </div>
              )}
              <div className="font-data" style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700,
                color: '#F0F4FF', borderTop: '1px solid rgba(0,51,160,0.3)', paddingTop: 10, marginTop: 4,
              }}>
                <span>TOTAL</span>
                <span style={{ color: brand.color }}>{fmt(v.price.total)}</span>
              </div>
            </div>

            {v.extraDiscount && (
              <div style={{
                marginTop: 16, padding: '12px',
                background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)',
              }}>
                <div className="font-data" style={{ fontSize: 9, color: '#FF6B00', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>
                  💡 {v.extraDiscount.label}
                </div>
                <div className="font-data" style={{ fontSize: 10, color: '#4A6080' }}>
                  Remise {v.extraDiscount.percent} % = − {fmt(v.price.total * v.extraDiscount.percent / 100)}
                </div>
                <div className="font-data" style={{ fontSize: 12, fontWeight: 700, color: '#00D4FF', marginTop: 6 }}>
                  PRIX POTENTIEL : {fmt(v.extraDiscount.result)}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Tags + Notes */}
        <section style={{ marginTop: '1.5rem', background: '#0D1F3C', border: '1px solid rgba(0,51,160,0.35)', padding: '1.25rem 1.5rem' }}>
          <div className="font-data" style={{
            fontSize: 8, letterSpacing: '0.25em', color: brand.color, textTransform: 'uppercase',
            marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 20, height: 1, background: brand.color, display: 'inline-block' }} />
            ÉQUIPEMENTS &amp; NOTES
          </div>
          <p className="font-body" style={{ fontSize: 13, color: '#4A6080', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 12 }}>
            {v.notes}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {v.tags.map(tag => (
              <span key={tag} className="font-data" style={{
                fontSize: 8, padding: '3px 10px', color: '#4A6080',
                background: 'rgba(0,51,160,0.1)', border: '1px solid rgba(0,51,160,0.25)',
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </section>

        <p className="font-data" style={{ marginTop: '2rem', textAlign: 'center', fontSize: 8, color: '#4A6080', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          DONNÉES MISES À JOUR LE{' '}
          {new Date(v.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
        </p>
      </div>
    </div>
  )
}
