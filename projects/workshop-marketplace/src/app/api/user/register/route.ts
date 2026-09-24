import { supabaseAdmin } from "@/lib/supabase";
import { createUserProfile } from "@/lib/db-users";

export async function POST(request: Request) {
  const { name, email, password, phone, province, notifyEmail, notifyWhatsapp } = await request.json();

  if (!name || !email || !password || !phone || !province) {
    return Response.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
  }

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.includes("already registered")
      ? "Ya existe una cuenta con ese email."
      : authError.message;
    return Response.json({ error: msg }, { status: 400 });
  }

  // 2. Crear perfil de usuaria
  try {
    await createUserProfile({
      userId: authData.user.id,
      name,
      phone,
      province,
      notifyEmail: notifyEmail ?? true,
      notifyWhatsapp: notifyWhatsapp ?? true,
    });
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return Response.json({ error: "Error al crear el perfil." }, { status: 500 });
  }

  return Response.json({ success: true });
}
