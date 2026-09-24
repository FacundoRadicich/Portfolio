import Link from "next/link";
import { getUser } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  // Sin usuario → solo renderizar children (ej: página de login)
  // Cada página protegida hace su propio redirect
  if (!user) return <>{children}</>;

  const professor = await prisma.professor.findUnique({
    where: { userId: user.id },
    select: { name: true, slug: true },
  });

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-[#111111] text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <span className="font-black text-xl text-[#00BBAD]">
            OH My Chalk
          </span>
          <p className="text-xs text-white/40 mt-1 truncate">
            {professor?.name ?? user.email}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/portal", label: "Mi panel" },
            { href: "/portal/perfil", label: "Mi perfil" },
            { href: "/portal/talleres/nuevo", label: "+ Nuevo taller" },
            ...(professor ? [{ href: `/profesoras/${professor.slug}`, label: "Ver mi página →" }] : []),
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <form action="/api/portal/logout" method="post">
            <button type="submit" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 bg-[#F5F5F5] overflow-auto">
        {children}
      </div>
    </div>
  );
}
