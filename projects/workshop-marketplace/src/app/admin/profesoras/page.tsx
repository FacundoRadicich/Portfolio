// @ts-nocheck
import Link from "next/link";
import Image from "next/image";
import { TierBadge } from "@/components/professors/TierBadge";
import { getProfessors } from "@/lib/db";

export default async function AdminProfesorasPage() {
  const professors = await getProfessors(false);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)]">Profesoras</h1>
        <Link href="/admin/profesoras/nueva"
          className="bg-[var(--color-chalk-terracotta)] hover:bg-[var(--color-chalk-terracotta-dark)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Nueva profesora
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-[var(--color-chalk-sand)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-chalk-cream)] text-[var(--color-chalk-charcoal)]/50 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Profesora</th>
              <th className="text-left px-5 py-3">Tier</th>
              <th className="text-left px-5 py-3">Localidad</th>
              <th className="text-left px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-chalk-sand)]">
            {professors.map((p) => (
              <tr key={p.id} className="hover:bg-[var(--color-chalk-cream)]/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                      <Image src={p.photoUrl} alt={p.name} fill className="object-cover" sizes="36px" />
                    </div>
                    <span className="font-medium text-[var(--color-chalk-espresso)]">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3"><TierBadge tier={p.tier} /></td>
                <td className="px-5 py-3 text-[var(--color-chalk-charcoal)]/60">{p.city}, {p.province}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {p.active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/profesoras/${p.id}`} className="text-xs text-[var(--color-chalk-terracotta)] hover:underline">Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
