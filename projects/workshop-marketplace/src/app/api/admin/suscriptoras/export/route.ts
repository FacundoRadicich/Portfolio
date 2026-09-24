import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSubscribers } from "@/lib/db";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await getSubscribers();
  const header = "Nombre,Email,Teléfono,Localidad,Fecha de registro\n";
  const rows = subscribers.map((s: any) =>
    [`"${s.name}"`, `"${s.email}"`, `"${s.phone}"`, `"${s.city}"`, `"${new Date(s.createdAt).toLocaleDateString("es-AR")}"`].join(",")
  ).join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="suscriptoras-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
