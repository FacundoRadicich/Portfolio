/**
 * Data access layer para usuarias finales (alumnas)
 */
import { supabaseAdmin } from './supabase'

export type DBUserProfile = {
  id: string
  userId: string
  name: string
  phone: string
  province: string
  notifyEmail: boolean
  notifyWhatsapp: boolean
  createdAt: string
}

export type DBFavorite = {
  id: string
  userId: string
  workshopId: string
  createdAt: string
}

// ── UserProfile ────────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<DBUserProfile | null> {
  const { data } = await supabaseAdmin
    .from('UserProfile')
    .select('*')
    .eq('userId', userId)
    .single()
  return (data as DBUserProfile) ?? null
}

export async function createUserProfile(data: {
  userId: string; name: string; phone: string
  province: string; notifyEmail: boolean; notifyWhatsapp: boolean
}) {
  const { error } = await supabaseAdmin.from('UserProfile').insert(data)
  if (error) throw error
}

export async function updateUserProfile(userId: string, data: Partial<DBUserProfile>) {
  const { error } = await supabaseAdmin.from('UserProfile').update(data).eq('userId', userId)
  if (error) throw error
}

export async function getAllUserProfiles() {
  const { data, error } = await supabaseAdmin
    .from('UserProfile')
    .select('*')
    .order('createdAt', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function getUserFavorites(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('Favorite')
    .select('workshopId')
    .eq('userId', userId)
  return (data ?? []).map((f: any) => f.workshopId)
}

export async function isFavorite(userId: string, workshopId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('Favorite')
    .select('id')
    .eq('userId', userId)
    .eq('workshopId', workshopId)
    .single()
  return !!data
}

export async function addFavorite(userId: string, workshopId: string) {
  const { error } = await supabaseAdmin.from('Favorite').insert({ userId, workshopId })
  if (error && error.code !== '23505') throw error // ignorar duplicado
}

export async function removeFavorite(userId: string, workshopId: string) {
  await supabaseAdmin.from('Favorite').delete().eq('userId', userId).eq('workshopId', workshopId)
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function recordAttendance(userId: string, workshopId: string) {
  const { error } = await supabaseAdmin
    .from('WorkshopAttendance')
    .insert({ userId, workshopId })
  if (error && error.code !== '23505') throw error // ignorar duplicado
}

export async function getUserAttendance(userId: string) {
  const { data } = await supabaseAdmin
    .from('WorkshopAttendance')
    .select('workshopId')
    .eq('userId', userId)
  return (data ?? []).map((a: any) => a.workshopId)
}
