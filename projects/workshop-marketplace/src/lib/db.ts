/**
 * Data access layer — uses Supabase REST API (HTTPS) instead of direct Prisma/TCP.
 * supabaseAdmin uses the service_role key which bypasses RLS.
 */
import { supabaseAdmin } from './supabase'
import type { Tier } from '@/types'
import slugify from 'slugify'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DBProfessor = {
  id: string; slug: string; name: string; bio: string; photoUrl: string
  coverUrl: string | null; tier: Tier; whatsapp: string; instagram: string | null
  facebook: string | null; specialties: string[]; province: string; city: string
  active: boolean; userId: string | null; createdAt: string; updatedAt: string
}

export type DBCategory = { id: string; name: string }

export type DBWorkshop = {
  id: string; slug: string; title: string; description: string; photoUrl: string
  date: string; duration: string; price: number | null; province: string; city: string
  maxSpots: number | null; whatsappMsg: string; whatsappNum: string; active: boolean
  professorId: string; createdAt: string; updatedAt: string
}

export type DBWorkshopWithProfessor = DBWorkshop & {
  professor: DBProfessor
  categories: { category: DBCategory }[]
}

export type DBProfessorWithWorkshops = DBProfessor & {
  workshops: DBWorkshopWithProfessor[]
}

// ── Workshops ─────────────────────────────────────────────────────────────────

const WORKSHOP_WITH_RELATIONS = `*, professor:Professor(*), categories:CategoriesOnWorkshops(category:Category(*))` as const

export async function getUpcomingWorkshops(limit = 6): Promise<DBWorkshopWithProfessor[]> {
  const { data, error } = await supabaseAdmin
    .from('Workshop')
    .select(WORKSHOP_WITH_RELATIONS)
    .eq('active', true)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as DBWorkshopWithProfessor[]
}

export async function getWorkshops(filters: {
  province?: string; categoryId?: string; month?: string; tier?: string
} = {}): Promise<DBWorkshopWithProfessor[]> {
  let q = supabaseAdmin.from('Workshop').select(WORKSHOP_WITH_RELATIONS).eq('active', true)

  if (filters.province) q = q.eq('province', filters.province)
  if (filters.month) {
    const start = new Date(`${filters.month}-01`)
    const end = new Date(start); end.setMonth(end.getMonth() + 1)
    q = q.gte('date', start.toISOString()).lt('date', end.toISOString())
  }

  const { data, error } = await q.order('date', { ascending: true })
  if (error) throw error

  let result = (data ?? []) as DBWorkshopWithProfessor[]

  if (filters.tier) result = result.filter(w => w.professor.tier === filters.tier)
  if (filters.categoryId) result = result.filter(w =>
    w.categories.some(c => c.category.id === filters.categoryId)
  )
  return result
}

export async function getWorkshopBySlug(slug: string): Promise<DBWorkshopWithProfessor | null> {
  const { data, error } = await supabaseAdmin
    .from('Workshop')
    .select(WORKSHOP_WITH_RELATIONS)
    .eq('slug', slug)
    .single()
  if (error) return null
  return data as DBWorkshopWithProfessor
}

export async function getRelatedWorkshops(workshopId: string, professorId: string, categoryIds: string[]): Promise<DBWorkshopWithProfessor[]> {
  const { data } = await supabaseAdmin
    .from('Workshop')
    .select(WORKSHOP_WITH_RELATIONS)
    .eq('active', true)
    .neq('id', workshopId)
    .gte('date', new Date().toISOString())
    .or(`professorId.eq.${professorId}`)
    .order('date', { ascending: true })
    .limit(3)
  return (data ?? []) as DBWorkshopWithProfessor[]
}

export async function getAllWorkshopsAdmin(): Promise<(DBWorkshop & { professor: DBProfessor })[]> {
  const { data, error } = await supabaseAdmin
    .from('Workshop')
    .select('*, professor:Professor(*)')
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as (DBWorkshop & { professor: DBProfessor })[]
}

export async function createWorkshopDB(data: {
  title: string; description: string; photoUrl: string; date: Date; duration: string
  price?: number | null; province: string; city: string; maxSpots?: number | null
  whatsappMsg: string; whatsappNum: string; professorId: string; active: boolean
  categoryIds: string[]
}) {
  const slug = slugify(data.title, { lower: true, strict: true }) + '-' + Date.now()
  const { data: workshop, error } = await supabaseAdmin
    .from('Workshop')
    .insert({
      slug, title: data.title, description: data.description, photoUrl: data.photoUrl,
      date: data.date.toISOString(), duration: data.duration, price: data.price ?? null,
      province: data.province, city: data.city, maxSpots: data.maxSpots ?? null,
      whatsappMsg: data.whatsappMsg, whatsappNum: data.whatsappNum,
      professorId: data.professorId, active: data.active,
    })
    .select()
    .single()
  if (error) throw error

  if (data.categoryIds.length > 0) {
    await supabaseAdmin.from('CategoriesOnWorkshops').insert(
      data.categoryIds.map(categoryId => ({ workshopId: workshop.id, categoryId }))
    )
  }
  return workshop
}

export async function updateWorkshopDB(id: string, data: {
  title: string; description: string; photoUrl: string; date: Date; duration: string
  price?: number | null; province: string; city: string; maxSpots?: number | null
  whatsappMsg: string; whatsappNum: string; professorId: string; active: boolean
  categoryIds: string[]
}) {
  const { error } = await supabaseAdmin
    .from('Workshop')
    .update({
      title: data.title, description: data.description, photoUrl: data.photoUrl,
      date: data.date.toISOString(), duration: data.duration, price: data.price ?? null,
      province: data.province, city: data.city, maxSpots: data.maxSpots ?? null,
      whatsappMsg: data.whatsappMsg, whatsappNum: data.whatsappNum,
      professorId: data.professorId, active: data.active,
    })
    .eq('id', id)
  if (error) throw error

  await supabaseAdmin.from('CategoriesOnWorkshops').delete().eq('workshopId', id)
  if (data.categoryIds.length > 0) {
    await supabaseAdmin.from('CategoriesOnWorkshops').insert(
      data.categoryIds.map(categoryId => ({ workshopId: id, categoryId }))
    )
  }
}

export async function deleteWorkshopDB(id: string) {
  await supabaseAdmin.from('Workshop').delete().eq('id', id)
}

// ── Professors ────────────────────────────────────────────────────────────────

export async function getProfessorsByTier(): Promise<{
  tier: Tier;
  label: string;
  dotColor: string;
  professors: DBProfessor[];
}[]> {
  const { data, error } = await supabaseAdmin
    .from('Professor')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  const professors = (data ?? []) as DBProfessor[];

  const TIER_ORDER: Tier[] = ['EMBAJADORA', 'INSTRUCTORA', 'COLABORADORA'];
  const TIER_META: Record<string, { label: string; dotColor: string }> = {
    EMBAJADORA:  { label: 'Embajadoras',  dotColor: '#e80c87' },
    INSTRUCTORA: { label: 'Instructoras', dotColor: '#00BBAD' },
    COLABORADORA:{ label: 'Colaboradoras',dotColor: '#111111' },
  };

  return TIER_ORDER
    .map(tier => ({
      tier,
      ...TIER_META[tier],
      professors: professors.filter(p => p.tier === tier),
    }))
    .filter(g => g.professors.length > 0);
}

export async function getProfessorsByCategory(): Promise<{
  category: DBCategory;
  professors: DBProfessor[];
}[]> {
  // Get all categories
  const { data: cats } = await supabaseAdmin
    .from('Category')
    .select('*')
    .order('name', { ascending: true });

  // Get all professors with their workshop categories
  const { data: profs } = await supabaseAdmin
    .from('Professor')
    .select('*, workshops:Workshop(categories:CategoriesOnWorkshops(category:Category(*)))')
    .eq('active', true)
    .order('name', { ascending: true });

  const categories = (cats ?? []) as DBCategory[];
  const professors = (profs ?? []) as any[];

  // Build a map: categoryId → Set of professor IDs
  const result = categories.map((cat) => {
    const matched = professors.filter((prof) =>
      prof.workshops?.some((w: any) =>
        w.categories?.some((c: any) => c.category?.id === cat.id)
      )
    );
    return { category: cat, professors: matched as DBProfessor[] };
  });

  // Also include professors without any category
  const allCatProfIds = new Set(result.flatMap((r) => r.professors.map((p) => p.id)));
  const uncategorized = professors.filter((p) => !allCatProfIds.has(p.id));

  if (uncategorized.length > 0) {
    result.push({ category: { id: 'other', name: 'Otras especialidades' }, professors: uncategorized as DBProfessor[] });
  }

  return result.filter((r) => r.professors.length > 0);
}

export async function getProfessors(onlyActive = true): Promise<DBProfessor[]> {
  let q = supabaseAdmin.from('Professor').select('*')
  if (onlyActive) q = q.eq('active', true)
  const { data, error } = await q.order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as DBProfessor[]
}

export async function getEmbajadoras(limit = 4): Promise<DBProfessor[]> {
  const { data, error } = await supabaseAdmin
    .from('Professor')
    .select('*')
    .eq('active', true)
    .eq('tier', 'EMBAJADORA')
    .order('name', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as DBProfessor[]
}

export async function getProfessorBySlug(slug: string): Promise<DBProfessorWithWorkshops | null> {
  const { data, error } = await supabaseAdmin
    .from('Professor')
    .select(`*, workshops:Workshop(${WORKSHOP_WITH_RELATIONS})`)
    .eq('slug', slug)
    .single()
  if (error) return null
  return data as DBProfessorWithWorkshops
}

export async function getProfessorByUserId(userId: string): Promise<DBProfessor | null> {
  const { data } = await supabaseAdmin
    .from('Professor')
    .select('*')
    .eq('userId', userId)
    .single()
  return (data as DBProfessor) ?? null
}

export async function getProfessorWithWorkshopsByUserId(userId: string): Promise<DBProfessorWithWorkshops | null> {
  const { data } = await supabaseAdmin
    .from('Professor')
    .select(`*, workshops:Workshop(${WORKSHOP_WITH_RELATIONS})`)
    .eq('userId', userId)
    .single()
  return (data as DBProfessorWithWorkshops) ?? null
}

export async function getAllProfessorsAdmin() {
  const { data, error } = await supabaseAdmin
    .from('Professor')
    .select('*, workshopCount:Workshop(count)')
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createProfessorDB(data: {
  name: string; bio: string; photoUrl: string; coverUrl?: string | null
  tier: Tier; whatsapp: string; instagram?: string | null; facebook?: string | null
  specialties: string[]; province: string; city: string; active: boolean
}) {
  const slug = slugify(data.name, { lower: true, strict: true })
  const { data: prof, error } = await supabaseAdmin
    .from('Professor')
    .insert({ slug, ...data })
    .select()
    .single()
  if (error) throw error
  return prof
}

export async function updateProfessorDB(id: string, data: Partial<DBProfessor>) {
  const { error } = await supabaseAdmin.from('Professor').update(data).eq('id', id)
  if (error) throw error
}

export async function linkProfessorToUser(professorId: string, userId: string) {
  const { error } = await supabaseAdmin
    .from('Professor')
    .update({ userId })
    .eq('id', professorId)
  if (error) throw error
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<DBCategory[]> {
  const { data, error } = await supabaseAdmin
    .from('Category')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as DBCategory[]
}

export async function createCategoryDB(name: string) {
  const { error } = await supabaseAdmin.from('Category').insert({ name })
  if (error) throw error
}

export async function deleteCategoryDB(id: string) {
  await supabaseAdmin.from('Category').delete().eq('id', id)
}

// ── Subscribers ───────────────────────────────────────────────────────────────

export async function createSubscriber(data: { name: string; email: string; phone: string; city: string }) {
  const { error } = await supabaseAdmin.from('Subscriber').insert(data)
  if (error) {
    if (error.code === '23505') throw new Error('DUPLICATE_EMAIL')
    throw error
  }
}

export async function getSubscribers() {
  const { data, error } = await supabaseAdmin
    .from('Subscriber')
    .select('*')
    .order('createdAt', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ── Admin stats ───────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [professors, workshops, upcoming, subscribers] = await Promise.all([
    supabaseAdmin.from('Professor').select('*', { count: 'exact', head: true }).eq('active', true),
    supabaseAdmin.from('Workshop').select('*', { count: 'exact', head: true }).eq('active', true),
    supabaseAdmin.from('Workshop').select('*', { count: 'exact', head: true }).eq('active', true).gte('date', new Date().toISOString()),
    supabaseAdmin.from('Subscriber').select('*', { count: 'exact', head: true }),
  ])
  return {
    totalProfessors: professors.count ?? 0,
    totalWorkshops: workshops.count ?? 0,
    upcomingWorkshops: upcoming.count ?? 0,
    subscribers: subscribers.count ?? 0,
  }
}
