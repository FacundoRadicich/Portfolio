/**
 * Data access (SERVIDOR) de Puntos de Venta para el mapa público "dónde comprar".
 * Usa la REST API de Supabase con service_role (igual que lib/db.ts).
 * Filtra mayoristas: el cliente final solo ve MINORISTA / AMBOS activos.
 */
import { supabaseAdmin } from './supabase'
import { type PdvPin, categoriaDe } from './pdv-types'

export type { PdvPin } from './pdv-types'

type Row = {
  id: string; nombre: string; tipo: string; phone: string | null; whatsapp: string | null
  address: string | null; localidad: string | null; provincia: string | null
  horario: string | null; descripcion: string | null; tiendaOnline: string | null
  web: string | null; instagram: string | null; facebook: string | null
  lat: number | null; lng: number | null
  cliente: {
    razonSocial: string; whatsapp: string | null; phone: string | null
    instagram: string | null; facebook: string | null; tiendaOnline: string | null
    web: string | null; destacado: boolean
  }
}

const SELECT =
  'id,nombre,tipo,phone,whatsapp,address,localidad,provincia,horario,descripcion,tiendaOnline,web,instagram,facebook,lat,lng,' +
  'cliente:Cliente!inner(razonSocial,whatsapp,phone,instagram,facebook,tiendaOnline,web,canal,active,destacado)'

/** Todas las sucursales visibles al CF (activas, cliente activo, no mayorista). */
export async function getPdvForMap(): Promise<PdvPin[]> {
  const { data, error } = await supabaseAdmin
    .from('Sucursal')
    .select(SELECT)
    .eq('active', true)
    .eq('cliente.active', true)
    .neq('cliente.canal', 'MAYORISTA')
    .limit(2000)

  if (error) throw error

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo,
    categoria: categoriaDe(r.tipo),
    destacado: r.cliente.destacado,
    razonSocial: r.cliente.razonSocial,
    whatsapp: r.whatsapp ?? r.cliente.whatsapp,
    phone: r.phone ?? r.cliente.phone,
    instagram: r.instagram ?? r.cliente.instagram,
    facebook: r.facebook ?? r.cliente.facebook,
    tiendaOnline: r.tiendaOnline ?? r.cliente.tiendaOnline,
    web: r.web ?? r.cliente.web,
    address: r.address,
    localidad: r.localidad,
    provincia: r.provincia,
    horario: r.horario,
    descripcion: r.descripcion,
    lat: r.lat,
    lng: r.lng,
  }))
}
