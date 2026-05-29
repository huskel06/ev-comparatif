export type Brand = 'xpeng' | 'renault' | 'vw' | 'skoda' | 'kia' | 'audi' | 'other'

export interface PriceDetail {
  catalogue: number
  options?: number
  supplements?: number
  remiseCommerciale?: number
  remiseCEE?: number
  total: number
  source: 'catalogue' | 'devis' | 'offre'
  concession?: string
  validUntil?: string
}

export interface ExtraDiscount {
  label: string
  percent: number
  appliedOn: 'catalogue' | 'total'
  result: number
}

export interface Vehicle {
  id: string
  brand: Brand
  model: string
  trim: string
  color?: string
  battery: number
  batteryType?: string
  chargePower: number
  chargeTime1080: number   // minutes
  rangeWltp: number        // km
  rangeHighway: number     // km
  power: number            // ch
  drivetrain: 'RWD' | 'AWD' | 'FWD'
  acceleration?: number    // 0-100 seconds
  voltage?: number         // V
  price: PriceDetail
  extraDiscount?: ExtraDiscount
  tags: string[]
  notes: string
  imageUrl?: string
  updatedAt: string
}
