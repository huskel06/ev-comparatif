import { Vehicle } from '@/types/vehicle'

export const vehicles: Vehicle[] = [
  {
    id: 'scenic-etech-esprit-alpine',
    brand: 'renault',
    model: 'Scénic E-Tech 220',
    trim: 'Esprit Alpine Grande Autonomie',
    color: 'Gris Schiste / Toit Noir',
    battery: 87,
    batteryType: 'NMC',
    chargePower: 150,
    chargeTime1080: 38,
    rangeWltp: 625,
    rangeHighway: 480,
    power: 220,
    drivetrain: 'RWD',
    price: {
      catalogue: 46990,
      options: 8300,
      supplements: 882,
      remiseCommerciale: 2000,
      remiseCEE: 8240,
      total: 46186,
      source: 'offre',
      concession: 'Renault Cannes RRG',
      validUntil: '2026-05-29',
    },
    extraDiscount: {
      label: 'Remise 15% supplémentaire envisageable',
      percent: 15,
      appliedOn: 'total',
      result: 39258,
    },
    consumptionKwh: 14.0,
    tags: ['RWD', 'Solarbay', 'Grande autonomie', 'CEE incluse', 'Offre Renault Cannes'],
    notes: 'Toit Solarbay · Harman Kardon · Pack Augmented Vision & ADAS · Peinture bi-ton · Sellerie maille embossée',
    // Photo éditoriale 2026 – Gris Schiste Satin / Toit Noir étoilé – Le Nouvel Automobiliste
    imageUrl: 'https://i0.wp.com/lenouvelautomobiliste.fr/wp-content/uploads/2026/02/Essai-Renault-Scenic-E-Tech-Electric-Esprit-Alpine-LV-Exterieur-844.jpg',
    updatedAt: '2026-05-29',
  },

  {
    // Devis VGRF Côte d'Azur Mougins – Julien Caravel – 30/05/2026
    id: 'vw-id4-gtx-340-life-max',
    brand: 'vw',
    model: 'ID.4 GTX 340',
    trim: 'Life Max',
    color: 'Noir Ebène',
    battery: 77,
    batteryType: 'NMC',
    chargePower: 175,
    chargeTime1080: 28,
    rangeWltp: 516,
    rangeHighway: 380,
    power: 340,
    drivetrain: 'AWD',
    acceleration: 5.4,
    price: {
      catalogue: 55000,
      options: 800,        // Peinture Noir Ebène
      supplements: 1416,   // Pack livraison 1 102 € + Certificat immat. 314 €
      remiseCommerciale: 8056,
      remiseCEE: 5170,
      total: 43990,
      source: 'offre',
      concession: 'VGRF Côte d\'Azur Mougins',
      validUntil: '2026-06-14',
    },
    consumptionKwh: 16.0,
    tags: ['AWD', '4MOTION', 'GTX Sport', 'CEE incluse', 'Offre VGRF Mougins'],
    notes: '4MOTION · 0–100 en 5,4 s · Sellerie ArtVelours · Peinture Noir Ebène métallisée · Devis Julien Caravel 30/05',
    // Render officiel imagin.studio – Deep Black Pearl (= Noir Ebène) – vue 3/4 avant
    imageUrl: 'https://cdn.imagin.studio/getImage?customer=carwow&make=volkswagen&modelFamily=id-4&paintId=deep-black-pearl&angle=03&width=1600',
    updatedAt: '2026-05-30',
  },

  {
    // Devis VGRF Côte d'Azur Mougins – Oidih Hoummada – 30/05/2026
    id: 'skoda-enyaq-coupe-85-sportline',
    brand: 'skoda',
    model: 'Enyaq Coupé 85',
    trim: 'Sportline',
    color: 'Noir Magic Nacre',
    battery: 82,
    batteryType: 'NMC',
    chargePower: 175,
    chargeTime1080: 29,
    rangeWltp: 557,
    rangeHighway: 395,
    power: 286,
    drivetrain: 'RWD',
    acceleration: 6.7,
    price: {
      catalogue: 54390,
      options: 4740,       // Pack Maxx 3 490 € + Noir Magic Nacre 700 € + Contrat service 550 €
      supplements: 1077,   // Pack livraison 703 € + Certificat immat. 374 €
      remiseCommerciale: 8500,
      remiseCEE: 5170,
      total: 46537,
      source: 'offre',
      concession: 'VGRF Côte d\'Azur Mougins',
      validUntil: '2026-06-14',
    },
    consumptionKwh: 15.5,
    tags: ['RWD', 'Pack Maxx', 'Canton Sound', 'CEE incluse', 'Sportline', 'Offre VGRF Mougins'],
    notes: 'Pack Maxx : HUD réalité augmentée · Caméra 360° · Crystal Face 2.0 · DCC+ Suspensions pilotées · Son Canton · Sièges AV réglables él. mémoire · Remote Park Assist · Sellerie suédine noir perforé Sportline',
    // Photo éditoriale 2024 – Enyaq Coupé Sportline couleur sombre (Noir Magic Nacre) – testecar.com
    imageUrl: 'https://testecar.com/wp-content/uploads/2024/10/skoda-enyaq-coupe-vue-face-1024x682.png',
    updatedAt: '2026-05-30',
  },
]
