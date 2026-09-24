import { PrismaClient, Canal } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: join(__dirname, '..', '.env') })
config({ path: join(__dirname, '..', '.env.local'), override: true })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 6543),
  database: process.env.DB_NAME ?? 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 5,
})
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

interface SucursalSeed {
  nombre: string
  tipo: string | null
  phone: string | null
  address: string | null
  barrio: string | null
  localidad: string | null
  provincia: string | null
  codigoPostal: string | null
  horario: string | null
  descripcion: string | null
  tiendaOnline: string | null
  web: string | null
  instagram: string | null
  facebook: string | null
  lat: number | null
  lng: number | null
}

interface ClienteSeed {
  slug: string
  validationToken: string
  razonSocial: string
  cuit: string | null
  canal: string
  destacado: boolean
  whatsapp: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  facebook: string | null
  tiendaOnline: string | null
  web: string | null
  active: boolean
  sucursales: SucursalSeed[]
}

async function main() {
  const file = join(__dirname, 'pdv-seed.json')
  const data: ClienteSeed[] = JSON.parse(readFileSync(file, 'utf-8'))

  let clientes = 0
  let sucursales = 0

  for (const c of data) {
    const cliente = await prisma.cliente.upsert({
      where: { slug: c.slug },
      update: {
        razonSocial: c.razonSocial,
        cuit: c.cuit,
        canal: c.canal as Canal,
        destacado: c.destacado,
        whatsapp: c.whatsapp,
        phone: c.phone,
        email: c.email,
        instagram: c.instagram,
        facebook: c.facebook,
        tiendaOnline: c.tiendaOnline,
        web: c.web,
        active: c.active,
      },
      create: {
        slug: c.slug,
        validationToken: c.validationToken,
        razonSocial: c.razonSocial,
        cuit: c.cuit,
        canal: c.canal as Canal,
        destacado: c.destacado,
        whatsapp: c.whatsapp,
        phone: c.phone,
        email: c.email,
        instagram: c.instagram,
        facebook: c.facebook,
        tiendaOnline: c.tiendaOnline,
        web: c.web,
        active: c.active,
      },
    })

    // Idempotente: reemplaza las sucursales del cliente en cada corrida
    await prisma.sucursal.deleteMany({ where: { clienteId: cliente.id } })
    await prisma.sucursal.createMany({
      data: c.sucursales.map((s) => ({
        clienteId: cliente.id,
        nombre: s.nombre,
        tipo: s.tipo ?? 'Otro',
        phone: s.phone,
        address: s.address,
        barrio: s.barrio,
        localidad: s.localidad,
        provincia: s.provincia,
        codigoPostal: s.codigoPostal,
        horario: s.horario,
        descripcion: s.descripcion,
        tiendaOnline: s.tiendaOnline,
        web: s.web,
        instagram: s.instagram,
        facebook: s.facebook,
        lat: s.lat,
        lng: s.lng,
      })),
    })

    clientes++
    sucursales += c.sucursales.length
  }

  console.log(`✅ Seed PDV completado: ${clientes} clientes, ${sucursales} sucursales`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
