import { PrismaClient, Tier } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(__dirname, '..', '.env') })
config({ path: join(__dirname, '..', '.env.local'), override: true })

// Session pooler (5432), no transaction pooler (6543) — pgbouncer en modo
// transaction cuelga las queries de Prisma (ver scripts/migrate_push.py).
const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME ?? 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 5,
})
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  // Categories
  const cats = await Promise.all([
    prisma.category.upsert({ where: { name: 'Iniciación' }, update: {}, create: { name: 'Iniciación' } }),
    prisma.category.upsert({ where: { name: 'Muebles' }, update: {}, create: { name: 'Muebles' } }),
    prisma.category.upsert({ where: { name: 'Decoupage' }, update: {}, create: { name: 'Decoupage' } }),
    prisma.category.upsert({ where: { name: 'Técnicas Mixtas' }, update: {}, create: { name: 'Técnicas Mixtas' } }),
    prisma.category.upsert({ where: { name: 'Avanzado' }, update: {}, create: { name: 'Avanzado' } }),
  ])

  // Professors
  const prof1 = await prisma.professor.upsert({
    where: { slug: 'maria-garcia' },
    update: {},
    create: {
      slug: 'maria-garcia',
      name: 'María García',
      bio: 'Embajadora oficial de Oh My Chalk con 8 años de experiencia transformando muebles y espacios con pintura tiza. Especializada en técnicas de envejecido y decoupage.',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      tier: Tier.EMBAJADORA,
      whatsapp: '5491112345678',
      instagram: '@maria.chalk',
      specialties: ['Muebles', 'Decoupage', 'Envejecido'],
      province: 'Buenos Aires',
      city: 'CABA',
    },
  })

  const prof2 = await prisma.professor.upsert({
    where: { slug: 'laura-torres' },
    update: {},
    create: {
      slug: 'laura-torres',
      name: 'Laura Torres',
      bio: 'Instructora certificada de pintura tiza con talleres en toda la provincia de Córdoba. Me apasiona enseñar desde cero.',
      photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      tier: Tier.INSTRUCTORA,
      whatsapp: '5493512345678',
      instagram: '@lauratorres.chalk',
      specialties: ['Iniciación', 'Técnicas Mixtas'],
      province: 'Córdoba',
      city: 'Córdoba Capital',
    },
  })

  const prof3 = await prisma.professor.upsert({
    where: { slug: 'ana-fernandez' },
    update: {},
    create: {
      slug: 'ana-fernandez',
      name: 'Ana Fernández',
      bio: 'Colaboradora de Oh My Chalk en Rosario. Talleres pequeños y personalizados para quienes quieren aprender a su ritmo.',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      tier: Tier.COLABORADORA,
      whatsapp: '5493412345678',
      specialties: ['Iniciación', 'Muebles'],
      province: 'Santa Fe',
      city: 'Rosario',
    },
  })

  const prof4 = await prisma.professor.upsert({
    where: { slug: 'sofia-martinez' },
    update: {},
    create: {
      slug: 'sofia-martinez',
      name: 'Sofía Martínez',
      bio: 'Instructora de Oh My Chalk en Mendoza. Talleres de técnicas mixtas combinando pintura tiza con texturas y estarcido.',
      photoUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400',
      tier: Tier.INSTRUCTORA,
      whatsapp: '5492611234567',
      instagram: '@sofia.chalk.mza',
      specialties: ['Técnicas Mixtas', 'Avanzado'],
      province: 'Mendoza',
      city: 'Mendoza Capital',
    },
  })

  const prof5 = await prisma.professor.upsert({
    where: { slug: 'carla-gimenez' },
    update: {},
    create: {
      slug: 'carla-gimenez',
      name: 'Carla Giménez',
      bio: 'Colaboradora de Oh My Chalk en La Plata. Grupos reducidos, foco en principiantes y primeras piezas.',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      tier: Tier.COLABORADORA,
      whatsapp: '5492211234567',
      instagram: '@carla.chalk',
      specialties: ['Iniciación'],
      province: 'Buenos Aires',
      city: 'La Plata',
    },
  })

  const prof6 = await prisma.professor.upsert({
    where: { slug: 'valentina-ruiz' },
    update: {},
    create: {
      slug: 'valentina-ruiz',
      name: 'Valentina Ruiz',
      bio: 'Embajadora de Oh My Chalk en Mar del Plata, con más de 10 años de trayectoria en restauración y pintura decorativa.',
      photoUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
      tier: Tier.EMBAJADORA,
      whatsapp: '5492231234567',
      instagram: '@valen.chalk',
      facebook: 'valentinaruizchalk',
      specialties: ['Muebles', 'Avanzado', 'Decoupage'],
      province: 'Buenos Aires',
      city: 'Mar del Plata',
    },
  })

  // Workshops
  const now = new Date()
  const next = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  type WorkshopSeed = {
    title: string
    description: string
    photoUrl: string
    date: Date
    duration: string
    price: number
    province: string
    city: string
    maxSpots: number
    whatsappMsg: string
    whatsappNum: string
    professorId: string
    categoryIndexes: number[]
  }

  const workshopUpsert = (slug: string, w: WorkshopSeed) =>
    prisma.workshop.upsert({
      where: { slug },
      update: {
        title: w.title,
        description: w.description,
        photoUrl: w.photoUrl,
        date: w.date,
        duration: w.duration,
        price: w.price,
        province: w.province,
        city: w.city,
        maxSpots: w.maxSpots,
        whatsappMsg: w.whatsappMsg,
        whatsappNum: w.whatsappNum,
        active: true,
      },
      create: {
        slug,
        title: w.title,
        description: w.description,
        photoUrl: w.photoUrl,
        date: w.date,
        duration: w.duration,
        price: w.price,
        province: w.province,
        city: w.city,
        maxSpots: w.maxSpots,
        whatsappMsg: w.whatsappMsg,
        whatsappNum: w.whatsappNum,
        professorId: w.professorId,
        categories: { create: w.categoryIndexes.map((i) => ({ categoryId: cats[i].id })) },
      },
    })

  await workshopUpsert('taller-iniciacion-caba-junio', {
    title: 'Taller de Iniciación en Pintura Tiza',
    description: 'Aprendé desde cero las técnicas básicas de la pintura tiza Oh My Chalk. Incluye materiales y una pieza para llevarte a casa.',
    photoUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800',
    date: next(9),
    duration: '4 horas',
    price: 18000,
    province: 'Buenos Aires',
    city: 'CABA',
    maxSpots: 8,
    whatsappMsg: 'Hola! Me interesa el Taller de Iniciación en Pintura Tiza. ¿Hay cupos disponibles?',
    whatsappNum: '5491112345678',
    professorId: prof1.id,
    categoryIndexes: [0, 1],
  })

  await workshopUpsert('taller-muebles-vintage-caba', {
    title: 'Muebles Vintage: Técnicas de Envejecido',
    description: 'Dominá el arte del envejecido y craquelado para darle nueva vida a tus muebles con un look vintage auténtico.',
    photoUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    date: next(23),
    duration: '6 horas',
    price: 26000,
    province: 'Buenos Aires',
    city: 'CABA',
    maxSpots: 6,
    whatsappMsg: 'Hola! Me interesa el taller de Muebles Vintage. ¿Hay cupos disponibles?',
    whatsappNum: '5491112345678',
    professorId: prof1.id,
    categoryIndexes: [1, 4],
  })

  await workshopUpsert('taller-iniciacion-cordoba', {
    title: 'Primer Paso en Pintura Tiza',
    description: 'Taller para principiantes en Córdoba Capital. Sin experiencia previa necesaria. Todos los materiales incluidos.',
    photoUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
    date: next(14),
    duration: '3 horas',
    price: 14000,
    province: 'Córdoba',
    city: 'Córdoba Capital',
    maxSpots: 10,
    whatsappMsg: 'Hola Laura! Me interesa el Taller Primer Paso en Pintura Tiza. ¿Hay cupos?',
    whatsappNum: '5493512345678',
    professorId: prof2.id,
    categoryIndexes: [0],
  })

  await workshopUpsert('taller-decoupage-caba-pasado', {
    title: 'Decoupage y Pintura Tiza',
    description: 'Taller combinado de decoupage con pintura tiza. Una técnica hermosa para decorar todo tipo de superficies.',
    photoUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    date: next(18),
    duration: '5 horas',
    price: 20000,
    province: 'Buenos Aires',
    city: 'CABA',
    maxSpots: 8,
    whatsappMsg: 'Hola! Me interesa el taller de Decoupage. ¿Tienen fechas próximas?',
    whatsappNum: '5491112345678',
    professorId: prof1.id,
    categoryIndexes: [2],
  })

  await workshopUpsert('taller-rosario-inicio', {
    title: 'Iniciación Grupal — Rosario',
    description: 'Grupo reducido (máx 5 personas) para aprender juntas en un ambiente cálido y personalizado.',
    photoUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    date: next(12),
    duration: '3 horas',
    price: 12000,
    province: 'Santa Fe',
    city: 'Rosario',
    maxSpots: 5,
    whatsappMsg: 'Hola Ana! Me interesa el taller de iniciación en Rosario. ¿Hay cupos?',
    whatsappNum: '5493412345678',
    professorId: prof3.id,
    categoryIndexes: [0, 1],
  })

  await workshopUpsert('taller-tecnicas-mixtas-mendoza', {
    title: 'Técnicas Mixtas: Textura y Estarcido',
    description: 'Combiná pintura tiza con pastas texturadas y estarcido para lograr piezas con relieve y personalidad.',
    photoUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800',
    date: next(20),
    duration: '5 horas',
    price: 21000,
    province: 'Mendoza',
    city: 'Mendoza Capital',
    maxSpots: 8,
    whatsappMsg: 'Hola Sofía! Me interesa el taller de Técnicas Mixtas. ¿Hay cupos?',
    whatsappNum: '5492611234567',
    professorId: prof4.id,
    categoryIndexes: [3],
  })

  await workshopUpsert('taller-avanzado-mendoza', {
    title: 'Nivel Avanzado: Restauración de Muebles',
    description: 'Para quienes ya tienen experiencia y quieren perfeccionar técnicas de restauración completa.',
    photoUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
    date: next(40),
    duration: '8 horas',
    price: 32000,
    province: 'Mendoza',
    city: 'Mendoza Capital',
    maxSpots: 6,
    whatsappMsg: 'Hola Sofía! Me interesa el taller Avanzado de Restauración. ¿Hay cupos?',
    whatsappNum: '5492611234567',
    professorId: prof4.id,
    categoryIndexes: [4, 1],
  })

  await workshopUpsert('taller-iniciacion-la-plata', {
    title: 'Primeros Pasos en Pintura Tiza — La Plata',
    description: 'Grupo chico para dar tus primeros pasos con la pintura tiza en un ambiente relajado.',
    photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
    date: next(11),
    duration: '3 horas',
    price: 13000,
    province: 'Buenos Aires',
    city: 'La Plata',
    maxSpots: 6,
    whatsappMsg: 'Hola Carla! Me interesa el taller de iniciación en La Plata. ¿Hay cupos?',
    whatsappNum: '5492211234567',
    professorId: prof5.id,
    categoryIndexes: [0],
  })

  await workshopUpsert('taller-muebles-mar-del-plata', {
    title: 'Restauración de Muebles — Mar del Plata',
    description: 'Aprendé a restaurar y transformar muebles antiguos con pintura tiza, cera y técnicas de envejecido.',
    photoUrl: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800',
    date: next(17),
    duration: '6 horas',
    price: 25000,
    province: 'Buenos Aires',
    city: 'Mar del Plata',
    maxSpots: 8,
    whatsappMsg: 'Hola Valentina! Me interesa el taller de Restauración de Muebles. ¿Hay cupos?',
    whatsappNum: '5492231234567',
    professorId: prof6.id,
    categoryIndexes: [1, 4],
  })

  await workshopUpsert('taller-decoupage-mar-del-plata', {
    title: 'Decoupage Avanzado — Mar del Plata',
    description: 'Técnicas avanzadas de decoupage combinadas con pintura tiza para piezas únicas de decoración.',
    photoUrl: 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=800',
    date: next(30),
    duration: '5 horas',
    price: 23000,
    province: 'Buenos Aires',
    city: 'Mar del Plata',
    maxSpots: 8,
    whatsappMsg: 'Hola Valentina! Me interesa el taller de Decoupage Avanzado. ¿Hay cupos?',
    whatsappNum: '5492231234567',
    professorId: prof6.id,
    categoryIndexes: [2, 4],
  })

  console.log('✅ Seed completado')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
