// @ts-nocheck
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getUser } from "./supabase-server";
import {
  getProfessorByUserId, updateProfessorDB,
  createWorkshopDB, updateWorkshopDB, deleteWorkshopDB,
} from "./db";

const profileSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().min(1).max(1000),
  photoUrl: z.string().url(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  whatsapp: z.string().min(6).max(20),
  instagram: z.string().max(60).optional().or(z.literal("")),
  facebook: z.string().max(200).optional().or(z.literal("")),
  specialties: z.string(),
  province: z.string().min(1),
  city: z.string().min(1).max(100),
});

export async function updateProfessorProfile(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/portal/login");

  const professor = await getProfessorByUserId(user.id);
  if (!professor) redirect("/portal");

  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.parse(raw);
  const specialties = parsed.specialties.split(",").map((s) => s.trim()).filter(Boolean);

  await updateProfessorDB(professor.id, {
    name: parsed.name, bio: parsed.bio, photoUrl: parsed.photoUrl,
    coverUrl: parsed.coverUrl || null, whatsapp: parsed.whatsapp,
    instagram: parsed.instagram || null, facebook: parsed.facebook || null,
    specialties, province: parsed.province, city: parsed.city,
  });

  revalidatePath("/portal/perfil");
  revalidatePath("/profesoras");
  redirect("/portal");
}

const workshopSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  photoUrl: z.string().url(),
  date: z.string(),
  duration: z.string().min(1),
  price: z.string().optional(),
  province: z.string().min(1),
  city: z.string().min(1).max(100),
  maxSpots: z.string().optional(),
  whatsappMsg: z.string().min(1),
  whatsappNum: z.string().min(6).max(20),
  professorId: z.string().min(1),
  categoryIds: z.string().optional(),
});

export async function createWorkshopForProfessor(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/portal/login");

  const professor = await getProfessorByUserId(user.id);
  if (!professor) redirect("/portal");

  const raw = Object.fromEntries(formData.entries());
  const parsed = workshopSchema.parse(raw);
  if (parsed.professorId !== professor.id) redirect("/portal");

  const categoryIds = parsed.categoryIds?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  await createWorkshopDB({
    title: parsed.title, description: parsed.description, photoUrl: parsed.photoUrl,
    date: new Date(parsed.date), duration: parsed.duration,
    price: parsed.price ? parseInt(parsed.price, 10) : null,
    province: parsed.province, city: parsed.city,
    maxSpots: parsed.maxSpots ? parseInt(parsed.maxSpots, 10) : null,
    whatsappMsg: parsed.whatsappMsg, whatsappNum: parsed.whatsappNum,
    professorId: professor.id, active: true, categoryIds,
  });

  revalidatePath("/portal");
  revalidatePath("/talleres");
  redirect("/portal");
}

export async function updateWorkshopForProfessor(id: string, professorId: string, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/portal/login");

  const professor = await getProfessorByUserId(user.id);
  if (!professor || professor.id !== professorId) redirect("/portal");

  const raw = Object.fromEntries(formData.entries());
  const parsed = workshopSchema.parse({ ...raw, professorId });
  const categoryIds = parsed.categoryIds?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  await updateWorkshopDB(id, {
    title: parsed.title, description: parsed.description, photoUrl: parsed.photoUrl,
    date: new Date(parsed.date), duration: parsed.duration,
    price: parsed.price ? parseInt(parsed.price, 10) : null,
    province: parsed.province, city: parsed.city,
    maxSpots: parsed.maxSpots ? parseInt(parsed.maxSpots, 10) : null,
    whatsappMsg: parsed.whatsappMsg, whatsappNum: parsed.whatsappNum,
    professorId: professor.id, active: true, categoryIds,
  });

  revalidatePath("/portal");
  revalidatePath("/talleres");
  redirect("/portal");
}

export async function deleteWorkshopForProfessor(id: string, professorId: string) {
  const user = await getUser();
  if (!user) redirect("/portal/login");

  const professor = await getProfessorByUserId(user.id);
  if (!professor || professor.id !== professorId) redirect("/portal");

  await deleteWorkshopDB(id);

  revalidatePath("/portal");
  revalidatePath("/talleres");
  redirect("/portal");
}
