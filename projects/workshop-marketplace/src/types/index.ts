// Tier definido localmente — Prisma v7 no exporta enums desde @prisma/client
export type Tier = 'EMBAJADORA' | 'INSTRUCTORA' | 'COLABORADORA'

export type WorkshopFilters = {
  province?: string
  categoryId?: string
  month?: string
  tier?: Tier
}

export const TIER_LABELS: Record<Tier, string> = {
  EMBAJADORA: 'Embajadora',
  INSTRUCTORA: 'Instructora',
  COLABORADORA: 'Colaboradora',
}

export const TIER_COLORS: Record<Tier, string> = {
  EMBAJADORA: 'bg-amber-100 text-amber-800 border-amber-300',
  INSTRUCTORA: 'bg-slate-100 text-slate-700 border-slate-300',
  COLABORADORA: 'bg-orange-100 text-orange-700 border-orange-300',
}

export const PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Córdoba',
  'Santa Fe',
  'Mendoza',
  'Tucumán',
  'Entre Ríos',
  'Salta',
  'Misiones',
  'Chaco',
  'Corrientes',
  'Santiago del Estero',
  'San Juan',
  'Jujuy',
  'Río Negro',
  'Neuquén',
  'Formosa',
  'Chubut',
  'San Luis',
  'Catamarca',
  'La Rioja',
  'La Pampa',
  'Santa Cruz',
  'Tierra del Fuego',
]
