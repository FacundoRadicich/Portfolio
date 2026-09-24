import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED = new Set([
  'whatsapp_click',
  'call_click',
  'web_click',
  'tienda_click',
  'instagram_click',
  'search',
])

type Body = {
  type?: string
  sucursalId?: string | null
  query?: string | null
  localidad?: string | null
  resultsCount?: number | null
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }

  if (!body.type || !ALLOWED.has(body.type)) {
    return Response.json({ error: 'invalid type' }, { status: 400 })
  }

  const jar = await cookies()
  let anonId = jar.get('omc_anon')?.value
  if (!anonId) {
    anonId = randomUUID()
    jar.set('omc_anon', anonId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
  }

  const { error } = await supabaseAdmin.from('Event').insert({
    id: randomUUID(),
    type: body.type,
    sucursalId: body.sucursalId ?? null,
    query: body.query?.slice(0, 120) ?? null,
    localidad: body.localidad?.slice(0, 120) ?? null,
    resultsCount: typeof body.resultsCount === 'number' ? body.resultsCount : null,
    anonId,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
