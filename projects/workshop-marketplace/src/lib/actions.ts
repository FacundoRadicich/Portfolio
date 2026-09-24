// @ts-nocheck
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Tier } from "@prisma/client";
import {
  createProfessorDB, updateProfessorDB,
  createWorkshopDB, updateWorkshopDB, deleteWorkshopDB,
  createCategoryDB, deleteCategoryDB,
} from "./db";

const professorSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().min(1).max(1000),
  photoUrl: z.string().url(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  tier: z.enum(["EMBAJADORA", "INSTRUCTORA", "COLABORADORA"]),
  whatsapp: z.string().min(6).max(20),
  instagram: z.string().max(60).optional().or(z.literal("")),
  facebook: z.string().max(200).optional().or(z.literal("")),
  specialties: z.string(),
  province: z.string().min(1),
  city: z.string().min(1).max(100),
  active: z.string().optional(),
});

export async function createProfessor(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = professorSchema.parse(raw);
  const specialties = parsed.specialties.split(",").map((s) => s.trim()).filter(Boolean);

  await createProfessorDB({
    name: parsed.name, bio: parsed.bio, photoUrl: parsed.photoUrl,
    coverUrl: parsed.coverUrl || null, tier: parsed.tier as Tier,
    whatsapp: parsed.whatsapp, instagram: parsed.instagram || null,
    facebook: parsed.facebook || null, specialties,
    province: parsed.province, city: parsed.city, active: parsed.active === "on",
  });

  revalidatePath("/admin/profesoras");
  revalidatePath("/profesoras");
  redirect("/admin/profesoras");
}

export async function updateProfessor(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = professorSchema.parse(raw);
  const specialties = parsed.specialties.split(",").map((s) => s.trim()).filter(Boolean);

  await updateProfessorDB(id, {
    name: parsed.name, bio: parsed.bio, photoUrl: parsed.photoUrl,
    coverUrl: parsed.coverUrl || null, tier: parsed.tier as Tier,
    whatsapp: parsed.whatsapp, instagram: parsed.instagram || null,
    facebook: parsed.facebook || null, specialties,
    province: parsed.province, city: parsed.city, active: parsed.active === "on",
  });

  revalidatePath("/admin/profesoras");
  revalidatePath("/profesoras");
  redirect("/admin/profesoras");
}

export async function deleteProfessor(id: string) {
  await updateProfessorDB(id, { active: false });
  revalidatePath("/admin/profesoras");
  redirect("/admin/profesoras");
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
  active: z.string().optional(),
});

export async function createWorkshop(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = workshopSchema.parse(raw);
  const categoryIds = parsed.categoryIds?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  await createWorkshopDB({
    title: parsed.title, description: parsed.description, photoUrl: parsed.photoUrl,
    date: new Date(parsed.date), duration: parsed.duration,
    price: parsed.price ? parseInt(parsed.price, 10) : null,
    province: parsed.province, city: parsed.city,
    maxSpots: parsed.maxSpots ? parseInt(parsed.maxSpots, 10) : null,
    whatsappMsg: parsed.whatsappMsg, whatsappNum: parsed.whatsappNum,
    professorId: parsed.professorId, active: parsed.active === "on", categoryIds,
  });

  revalidatePath("/admin/talleres");
  revalidatePath("/talleres");
  redirect("/admin/talleres");
}

export async function updateWorkshop(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = workshopSchema.parse(raw);
  const categoryIds = parsed.categoryIds?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  await updateWorkshopDB(id, {
    title: parsed.title, description: parsed.description, photoUrl: parsed.photoUrl,
    date: new Date(parsed.date), duration: parsed.duration,
    price: parsed.price ? parseInt(parsed.price, 10) : null,
    province: parsed.province, city: parsed.city,
    maxSpots: parsed.maxSpots ? parseInt(parsed.maxSpots, 10) : null,
    whatsappMsg: parsed.whatsappMsg, whatsappNum: parsed.whatsappNum,
    professorId: parsed.professorId, active: parsed.active === "on", categoryIds,
  });

  revalidatePath("/admin/talleres");
  revalidatePath("/talleres");
  redirect("/admin/talleres");
}

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name?.trim()) return;
  await createCategoryDB(name.trim());
  revalidatePath("/admin/categorias");
}

export async function deleteCategory(id: string) {
  await deleteCategoryDB(id);
  revalidatePath("/admin/categorias");
}
