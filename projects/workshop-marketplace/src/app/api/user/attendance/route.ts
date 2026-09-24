import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { recordAttendance } from "@/lib/db-users";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ ok: true }); // silencioso si no está logueada

  const { workshopId } = await request.json();
  if (workshopId) await recordAttendance(user.id, workshopId);

  return Response.json({ ok: true });
}
