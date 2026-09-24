import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { addFavorite, removeFavorite, isFavorite } from "@/lib/db-users";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/user/favorite?workshopId=xxx
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ favorited: false, authenticated: false });

  const { searchParams } = new URL(request.url);
  const workshopId = searchParams.get("workshopId");
  if (!workshopId) return Response.json({ favorited: false });

  const favorited = await isFavorite(user.id, workshopId);
  return Response.json({ favorited, authenticated: true });
}

// POST /api/user/favorite
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "No autenticado." }, { status: 401 });

  const { workshopId, action } = await request.json(); // action: 'add' | 'remove'
  if (!workshopId) return Response.json({ error: "workshopId requerido." }, { status: 400 });

  if (action === "remove") {
    await removeFavorite(user.id, workshopId);
  } else {
    await addFavorite(user.id, workshopId);
  }

  return Response.json({ success: true });
}
