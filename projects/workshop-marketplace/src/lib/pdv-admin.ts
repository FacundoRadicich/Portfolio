/** Data access (SERVIDOR) para el panel admin de Puntos de Venta. */
import { supabaseAdmin } from './supabase'

export type PdvAdminSucursal = {
  id: string
  nombre: string
  localidad: string | null
  provincia: string | null
  exhibidorPie: boolean | null
  exhibidorMostrador: boolean | null
  muestrasPintadas: boolean | null
  muestrarioActualizado: boolean | null
  comentarios: string | null
}

export type PdvAdminCliente = {
  id: string
  razonSocial: string
  whatsapp: string | null
  phone: string | null
  validationToken: string
  validatedAt: string | null
  sucursales: PdvAdminSucursal[]
}

const SELECT =
  'id,razonSocial,whatsapp,phone,validationToken,validatedAt,' +
  'sucursales:Sucursal(id,nombre,localidad,provincia,exhibidorPie,exhibidorMostrador,muestrasPintadas,muestrarioActualizado,comentarios)'

/** Todos los clientes PDV activos, con sus sucursales y estado de exposición. */
export async function getPdvAdminList(): Promise<PdvAdminCliente[]> {
  const { data, error } = await supabaseAdmin
    .from('Cliente')
    .select(SELECT)
    .eq('active', true)
    .order('razonSocial', { ascending: true })
    .limit(2000)

  if (error) throw error
  return (data ?? []) as unknown as PdvAdminCliente[]
}
