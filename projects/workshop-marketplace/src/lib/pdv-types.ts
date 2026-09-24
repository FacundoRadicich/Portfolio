/** Tipos y helpers puros de PDV (sin dependencias de servidor — seguro en cliente). */

export type PdvCategoria = 'libreria' | 'pintureria' | 'taller' | 'otro'

export type PdvPin = {
  id: string
  nombre: string
  tipo: string
  categoria: PdvCategoria
  destacado: boolean
  razonSocial: string
  whatsapp: string | null
  phone: string | null
  instagram: string | null
  facebook: string | null
  tiendaOnline: string | null
  web: string | null
  address: string | null
  localidad: string | null
  provincia: string | null
  horario: string | null
  descripcion: string | null
  lat: number | null
  lng: number | null
}

export const CATEGORIA_LABEL: Record<PdvCategoria, string> = {
  libreria: 'Librería / Artística',
  pintureria: 'Pinturería',
  taller: 'Taller',
  otro: 'Otro',
}

export const CATEGORIA_COLOR: Record<PdvCategoria, string> = {
  libreria: '#00BBAD',
  pintureria: '#e80c87',
  taller: '#BA7517',
  otro: '#5F5E5A',
}

export function categoriaDe(tipo: string | null): PdvCategoria {
  const t = (tipo ?? '').toLowerCase()
  if (t.includes('pintur')) return 'pintureria'
  if (t.includes('taller')) return 'taller'
  if (t.includes('librer') || t.includes('art')) return 'libreria'
  return 'otro'
}
