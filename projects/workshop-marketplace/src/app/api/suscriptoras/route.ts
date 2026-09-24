import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSubscriber } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  city: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  try {
    await createSubscriber(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'DUPLICATE_EMAIL') {
      return NextResponse.json({ error: "Ya estás registrada con ese email." }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
