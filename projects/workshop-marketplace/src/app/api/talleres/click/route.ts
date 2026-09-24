import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { workshopId } = await req.json().catch(() => ({}));
  if (!workshopId) return NextResponse.json({ ok: false }, { status: 400 });

  await supabaseAdmin.rpc('increment_click', { workshop_id: workshopId });
  return NextResponse.json({ ok: true });
}
