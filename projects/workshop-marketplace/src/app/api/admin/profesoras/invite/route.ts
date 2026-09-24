import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { professorId, email } = await req.json();
  if (!professorId || !email) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  // Create user in Supabase Auth
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/portal`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Link the auth user to the professor
  await prisma.professor.update({
    where: { id: professorId },
    data: { userId: data.user.id },
  });

  return NextResponse.json({ ok: true });
}
