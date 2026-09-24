// @ts-nocheck
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { createWorkshopForProfessor } from "@/lib/portal-actions";
import { PROVINCES } from "@/types";

export default async function PortalNuevoTallerPage() {
  const user = await getUser();
  if (!user) redirect("/portal/login");

  const professor = await prisma.professor.findUnique({ where: { userId: user.id } });
  if (!professor) redirect("/portal");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const inputClass = "w-full border border-[var(--color-chalk-sand)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-chalk-terracotta)]";

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)] mb-8">
        Nuevo taller
      </h1>

      <form action={createWorkshopForProfessor} className="space-y-5 bg-white rounded-2xl border border-[var(--color-chalk-sand)] p-6">
        <input type="hidden" name="professorId" value={professor.id} />

        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Título *</label>
          <input name="title" required className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Descripción *</label>
          <textarea name="description" required rows={4} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">URL foto *</label>
          <input name="photoUrl" required type="url" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Fecha y hora *</label>
            <input name="date" required type="datetime-local" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Duración *</label>
            <input name="duration" required placeholder="3 horas" className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Precio (ARS)</label>
            <input name="price" type="number" min="0" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Cupos máximos</label>
            <input name="maxSpots" type="number" min="1" className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Provincia *</label>
            <select name="province" required defaultValue={professor.province} className={inputClass}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Ciudad *</label>
            <input name="city" required defaultValue={professor.city} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-2">Categorías</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" name="cat" value={c.id} className="rounded" />
                {c.name}
              </label>
            ))}
          </div>
          <input type="hidden" name="categoryIds" id="categoryIds" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">
            Mensaje WhatsApp pre-cargado *
          </label>
          <textarea name="whatsappMsg" required rows={2}
            defaultValue={`Hola! Me interesa el taller de ${professor.name.split(" ")[0]}. ¿Hay cupos disponibles?`}
            className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">
            Número WhatsApp para reservas *
          </label>
          <input name="whatsappNum" required defaultValue={professor.whatsapp} className={inputClass} />
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `document.querySelector('form').addEventListener('submit', function() {
            const checked = [...document.querySelectorAll('[name="cat"]:checked')].map(cb => cb.value);
            document.getElementById('categoryIds').value = checked.join(',');
          });`
        }} />

        <div className="pt-4 border-t border-[var(--color-chalk-sand)]">
          <button type="submit"
            className="bg-[var(--color-chalk-terracotta)] hover:bg-[var(--color-chalk-terracotta-dark)] text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            Publicar taller
          </button>
        </div>
      </form>
    </div>
  );
}
