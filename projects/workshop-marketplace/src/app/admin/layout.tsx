// @ts-nocheck
import { cookies } from "next/headers";
import Link from "next/link";

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === process.env.ADMIN_SECRET;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();
  // Sin sesión → solo renderizar children (ej: /admin/login). El middleware
  // ya redirige a /admin/login para el resto de las rutas protegidas.
  if (!authed) return <>{children}</>;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[var(--color-chalk-charcoal)] text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <span className="font-display text-xl font-semibold text-[var(--color-chalk-terracotta)]">
            OMC Admin
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/profesoras", label: "Profesoras" },
            { href: "/admin/talleres", label: "Talleres" },
            { href: "/admin/pdv", label: "Puntos de venta" },
            { href: "/admin/categorias", label: "Categorías" },
            { href: "/admin/suscriptoras", label: "Suscriptoras" },
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
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 bg-[var(--color-chalk-cream)] overflow-auto">
        {children}
      </div>
    </div>
  );
}
