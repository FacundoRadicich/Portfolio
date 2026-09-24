// @ts-nocheck
import Link from "next/link";
import { getAdminStats } from "@/lib/db";

export default async function AdminDashboard() {
  const { totalProfessors, totalWorkshops, upcomingWorkshops, subscribers } = await getAdminStats();

  const stats = [
    { label: "Profesoras activas", value: totalProfessors, href: "/admin/profesoras", color: "bg-amber-50 text-amber-700" },
    { label: "Talleres totales", value: totalWorkshops, href: "/admin/talleres", color: "bg-blue-50 text-blue-700" },
    { label: "Talleres próximos", value: upcomingWorkshops, href: "/admin/talleres", color: "bg-green-50 text-green-700" },
    { label: "Suscriptoras", value: subscribers, href: "/admin/suscriptoras", color: "bg-pink-50 text-pink-700" },
  ];

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)] mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map(({ label, value, href, color }) => (
          <Link key={label} href={href} className={`${color} rounded-2xl p-6 hover:opacity-80 transition-opacity`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm mt-1 opacity-70">{label}</p>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/profesoras/nueva" className="block p-5 bg-white rounded-xl border border-[var(--color-chalk-sand)] hover:border-[var(--color-chalk-terracotta)] transition-colors">
          <p className="font-semibold text-[var(--color-chalk-espresso)]">+ Nueva profesora</p>
          <p className="text-xs text-[var(--color-chalk-charcoal)]/50 mt-1">Agregar profesora al marketplace</p>
        </Link>
        <Link href="/admin/talleres/nuevo" className="block p-5 bg-white rounded-xl border border-[var(--color-chalk-sand)] hover:border-[var(--color-chalk-terracotta)] transition-colors">
          <p className="font-semibold text-[var(--color-chalk-espresso)]">+ Nuevo taller</p>
          <p className="text-xs text-[var(--color-chalk-charcoal)]/50 mt-1">Publicar un nuevo taller</p>
        </Link>
        <Link href="/admin/suscriptoras" className="block p-5 bg-white rounded-xl border border-[var(--color-chalk-sand)] hover:border-[var(--color-chalk-terracotta)] transition-colors">
          <p className="font-semibold text-[var(--color-chalk-espresso)]">Exportar suscriptoras</p>
          <p className="text-xs text-[var(--color-chalk-charcoal)]/50 mt-1">Descargar CSV para campañas</p>
        </Link>
      </div>
    </div>
  );
}
