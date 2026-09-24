// @ts-nocheck
import Link from "next/link";
import { formatDate, formatPrice, isPast } from "@/lib/utils";
import { getAllWorkshopsAdmin } from "@/lib/db";

export default async function AdminTalleresPage() {
  const workshops = await getAllWorkshopsAdmin();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)]">Talleres</h1>
        <Link href="/admin/talleres/nuevo"
          className="bg-[var(--color-chalk-terracotta)] hover:bg-[var(--color-chalk-terracotta-dark)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Nuevo taller
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-[var(--color-chalk-sand)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-chalk-cream)] text-[var(--color-chalk-charcoal)]/50 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Taller</th>
              <th className="text-left px-5 py-3">Profesora</th>
              <th className="text-left px-5 py-3">Fecha</th>
              <th className="text-left px-5 py-3">Precio</th>
              <th className="text-left px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-chalk-sand)]">
            {workshops.map((w) => {
              const past = isPast(new Date(w.date));
              return (
                <tr key={w.id} className={`hover:bg-[var(--color-chalk-cream)]/50 transition-colors ${past ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-[var(--color-chalk-espresso)] line-clamp-1">{w.title}</p>
                    <p className="text-xs text-[var(--color-chalk-charcoal)]/40">{w.city}</p>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-chalk-charcoal)]/60">{w.professor.name}</td>
                  <td className="px-5 py-3 text-[var(--color-chalk-charcoal)]/60">{formatDate(new Date(w.date))}</td>
                  <td className="px-5 py-3 text-[var(--color-chalk-charcoal)]/60">{w.price ? formatPrice(w.price) : "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${!w.active ? "bg-gray-100 text-gray-500" : past ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700"}`}>
                      {!w.active ? "Inactivo" : past ? "Realizado" : "Próximo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/talleres/${w.id}`} className="text-xs text-[var(--color-chalk-terracotta)] hover:underline">Editar</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
