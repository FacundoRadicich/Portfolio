// @ts-nocheck
import { getSubscribers } from "@/lib/db";

export default async function AdminSuscriptorasPage() {
  const subscribers = await getSubscribers();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)]">Suscriptoras</h1>
          <p className="text-sm text-[var(--color-chalk-charcoal)]/50 mt-1">{subscribers.length} registradas en total</p>
        </div>
        <a href="/api/admin/suscriptoras/export"
          className="bg-[var(--color-chalk-espresso)] hover:bg-[var(--color-chalk-charcoal)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Exportar CSV
        </a>
      </div>
      <div className="bg-white rounded-2xl border border-[var(--color-chalk-sand)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-chalk-cream)] text-[var(--color-chalk-charcoal)]/50 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Nombre</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">WhatsApp</th>
              <th className="text-left px-5 py-3">Localidad</th>
              <th className="text-left px-5 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-chalk-sand)]">
            {subscribers.map((s: any) => (
              <tr key={s.id} className="hover:bg-[var(--color-chalk-cream)]/50">
                <td className="px-5 py-3 font-medium">{s.name}</td>
                <td className="px-5 py-3 text-[var(--color-chalk-charcoal)]/60">{s.email}</td>
                <td className="px-5 py-3 text-[var(--color-chalk-charcoal)]/60">{s.phone}</td>
                <td className="px-5 py-3 text-[var(--color-chalk-charcoal)]/60">{s.city}</td>
                <td className="px-5 py-3 text-[var(--color-chalk-charcoal)]/40 text-xs">{new Date(s.createdAt).toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
