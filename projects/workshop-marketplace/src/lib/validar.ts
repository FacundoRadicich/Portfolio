/**
 * Data access (SERVIDOR) del flujo de autovalidación de PDV por token.
 * Sin login: el token opaco del cliente es la credencial.
 */
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { supabaseAdmin } from './supabase'

export type SucursalEdit = {
  id: string | null
  nombre: string
  tipo: string
  phone: string | null
  whatsapp: string | null
  address: string | null
  localidad: string | null
  provincia: string | null
  horario: string | null
  descripcion: string | null
  exhibidorPie: boolean | null
  exhibidorMostrador: boolean | null
  muestrasPintadas: boolean | null
  muestrarioActualizado: boolean | null
  comentarios: string | null
}

export type ClienteEdit = {
  id: string
  razonSocial: string
  whatsapp: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  tiendaOnline: string | null
  web: string | null
  validatedAt: string | null
  active: boolean
  sucursales: SucursalEdit[]
}

const CLIENTE_SELECT =
  'id,razonSocial,whatsapp,phone,email,instagram,tiendaOnline,web,validatedAt,active,' +
  'sucursales:Sucursal(id,nombre,tipo,phone,whatsapp,address,localidad,provincia,horario,descripcion,' +
  'exhibidorPie,exhibidorMostrador,muestrasPintadas,muestrarioActualizado,comentarios)'

/** Carga la ficha editable del cliente a partir de su token. null si no existe. */
export async function getClienteByToken(token: string): Promise<ClienteEdit | null> {
  const { data, error } = await supabaseAdmin
    .from('Cliente')
    .select(CLIENTE_SELECT)
    .eq('validationToken', token)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as ClienteEdit) ?? null
}

// ── Validación de entrada ───────────────────────────────────────────────────

const msg = (campo: string, max: number) => `${campo}: máximo ${max} caracteres.`

const sucursalSchema = z.object({
  id: z.string().nullable(),
  nombre: z.string().trim().min(1, 'El nombre del local es obligatorio').max(120, msg('Nombre del local', 120)),
  tipo: z.string().trim().min(1).max(100, msg('Tipo de local', 100)),
  phone: z.string().trim().max(40, msg('Teléfono', 40)).nullish(),
  whatsapp: z.string().trim().max(40, msg('WhatsApp de la sucursal', 40)).nullish(),
  address: z.string().trim().max(250, msg('Dirección', 250)).nullish(),
  localidad: z.string().trim().max(80, msg('Localidad', 80)).nullish(),
  provincia: z.string().trim().max(100, msg('Provincia', 100)).nullish(),
  horario: z.string().trim().max(200, msg('Horario', 200)).nullish(),
  descripcion: z.string().trim().max(400, msg('Descripción', 400)).nullish(),
  exhibidorPie: z.boolean().nullable(),
  exhibidorMostrador: z.boolean().nullable(),
  muestrasPintadas: z.boolean().nullable(),
  muestrarioActualizado: z.boolean().nullable(),
  comentarios: z.string().trim().max(500, msg('Comentarios', 500)).nullish(),
})

export const validationSchema = z.object({
  sigueVendiendo: z.boolean(),
  whatsapp: z.string().trim().max(40, msg('WhatsApp', 40)).nullish(),
  phone: z.string().trim().max(40, msg('Teléfono', 40)).nullish(),
  email: z.string().trim().email('Email inválido').max(120, msg('Email', 120)).nullish().or(z.literal('')),
  instagram: z.string().trim().max(160, msg('Instagram', 160)).nullish(),
  tiendaOnline: z.string().trim().max(200, msg('Tienda online', 200)).nullish(),
  web: z.string().trim().max(200, msg('Web', 200)).nullish(),
  sucursales: z.array(sucursalSchema).max(50),
})

export type ValidationInput = z.infer<typeof validationSchema>

function clean(v: string | null | undefined): string | null {
  const s = (v ?? '').trim()
  return s === '' ? null : s
}

/**
 * Aplica la validación: actualiza contacto del cliente y reconcilia sus
 * sucursales (update existentes, inserta nuevas, borra las quitadas).
 * Marca validatedAt y active según "sigue vendiendo".
 */
export async function applyValidation(
  token: string,
  input: ValidationInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: cliente, error: e1 } = await supabaseAdmin
    .from('Cliente')
    .select('id, sucursales:Sucursal(id)')
    .eq('validationToken', token)
    .maybeSingle()
  if (e1) throw e1
  if (!cliente) return { ok: false, error: 'Link inválido o vencido.' }

  const clienteId = cliente.id as string
  const sigue = input.sigueVendiendo

  const { error: e2 } = await supabaseAdmin
    .from('Cliente')
    .update({
      whatsapp: clean(input.whatsapp),
      phone: clean(input.phone),
      email: clean(input.email),
      instagram: clean(input.instagram),
      tiendaOnline: clean(input.tiendaOnline),
      web: clean(input.web),
      active: sigue,
      validatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', clienteId)
  if (e2) return { ok: false, error: e2.message }

  // Reconciliar sucursales
  const existentes = ((cliente.sucursales ?? []) as { id: string }[]).map((s) => s.id)
  const enviadas = input.sucursales.filter((s) => s.id).map((s) => s.id as string)
  const aBorrar = existentes.filter((id) => !enviadas.includes(id))
  if (aBorrar.length) {
    await supabaseAdmin.from('Sucursal').delete().in('id', aBorrar)
  }

  for (const s of input.sucursales) {
    const fields = {
      nombre: s.nombre.trim(),
      tipo: s.tipo.trim() || 'Otro',
      phone: clean(s.phone),
      whatsapp: clean(s.whatsapp),
      address: clean(s.address),
      localidad: clean(s.localidad),
      provincia: clean(s.provincia),
      horario: clean(s.horario),
      descripcion: clean(s.descripcion),
      exhibidorPie: s.exhibidorPie,
      exhibidorMostrador: s.exhibidorMostrador,
      muestrasPintadas: s.muestrasPintadas,
      muestrarioActualizado: s.muestrarioActualizado,
      comentarios: clean(s.comentarios),
      updatedAt: new Date().toISOString(),
    }
    if (s.id) {
      await supabaseAdmin.from('Sucursal').update(fields).eq('id', s.id).eq('clienteId', clienteId)
    } else {
      await supabaseAdmin.from('Sucursal').insert({ id: randomUUID(), clienteId, active: true, ...fields })
    }
  }

  return { ok: true }
}

// ── Búsqueda genérica (fase 1 difusión) ─────────────────────────────────────

export type ClienteMatch = {
  id: string
  razonSocial: string
  sucursales: { nombre: string; localidad: string | null }[]
}

/**
 * Busca clientes por razón social O por nombre de local (sucursal).
 * NO expone el token.
 */
export async function searchClientes(q: string): Promise<ClienteMatch[]> {
  const term = q.trim()
  if (term.length < 3) return []
  const like = `%${term}%`

  const [porRazon, porLocal] = await Promise.all([
    supabaseAdmin.from('Cliente').select('id').ilike('razonSocial', like).eq('active', true).limit(20),
    supabaseAdmin
      .from('Sucursal')
      .select('clienteId, cliente:Cliente!inner(active)')
      .ilike('nombre', like)
      .eq('cliente.active', true)
      .limit(20),
  ])
  if (porRazon.error) throw porRazon.error
  if (porLocal.error) throw porLocal.error

  const ids = new Set<string>()
  for (const c of (porRazon.data ?? []) as { id: string }[]) ids.add(c.id)
  for (const s of (porLocal.data ?? []) as { clienteId: string }[]) ids.add(s.clienteId)
  if (ids.size === 0) return []

  const { data, error } = await supabaseAdmin
    .from('Cliente')
    .select('id,razonSocial, sucursales:Sucursal(nombre,localidad)')
    .in('id', Array.from(ids))
    .limit(15)
  if (error) throw error

  return ((data ?? []) as {
    id: string
    razonSocial: string
    sucursales: { nombre: string; localidad: string | null }[]
  }[]).map((c) => ({ id: c.id, razonSocial: c.razonSocial, sucursales: c.sucursales }))
}

/**
 * Reclama una ficha: dado un clienteId y el CUIT, si coincide devuelve el token
 * para redirigir a /validar/{token}. Evita que cualquiera edite datos ajenos.
 */
export async function tokenSiCuitCoincide(clienteId: string, cuit: string): Promise<string | null> {
  const digits = cuit.replace(/\D/g, '')
  if (digits.length < 7) return null
  const { data, error } = await supabaseAdmin
    .from('Cliente')
    .select('validationToken, cuit')
    .eq('id', clienteId)
    .maybeSingle()
  if (error) throw error
  if (!data || !data.cuit) return null
  const onFile = String(data.cuit).replace(/\D/g, '')
  return onFile && onFile === digits ? (data.validationToken as string) : null
}
