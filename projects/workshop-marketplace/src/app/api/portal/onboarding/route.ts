import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  // Obtener usuario autenticado
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado." }, { status: 401 });

  const fd = await request.formData();
  const photoUrl = fd.get("photoUrl") as string;
  const bio = fd.get("bio") as string;
  const whatsapp = fd.get("whatsapp") as string;
  const instagram = fd.get("instagram") as string;
  const specialtiesRaw = fd.get("specialties") as string;
  const specialties = specialtiesRaw ? specialtiesRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

  if (!photoUrl || !bio || !whatsapp) {
    return Response.json({ error: "Foto, bio y WhatsApp son obligatorios." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("Professor")
    .update({
      photoUrl,
      bio,
      whatsapp,
      instagram: instagram || null,
      specialties,
      active: true,
    })
    .eq("userId", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
