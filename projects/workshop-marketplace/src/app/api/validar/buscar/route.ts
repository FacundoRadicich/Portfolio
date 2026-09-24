import { searchClientes, tokenSiCuitCoincide } from '@/lib/validar'

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? ''
  if (q.trim().length < 3) return Response.json({ matches: [] })
  const matches = await searchClientes(q)
  return Response.json({ matches })
}

export async function POST(request: Request) {
  let body: { clienteId?: string; cuit?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Datos inválidos.' }, { status: 400 })
  }
  if (!body.clienteId || !body.cuit) {
    return Response.json({ error: 'Faltan datos.' }, { status: 400 })
  }
  const token = await tokenSiCuitCoincide(body.clienteId, body.cuit)
  if (!token) {
    return Response.json(
      { error: 'El CUIT/DNI no coincide con ese local. Revisá el número.' },
      { status: 403 }
    )
  }
  return Response.json({ token })
}
