// @ts-nocheck
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateWorkshop } from "@/lib/actions";
import { PROVINCES } from "@/types";

type Params = { id: string };

export default async function EditTallerPage(props: { params: Promise<Params> }) {
  const { id } = await props.params;

  const [workshop, professors, categories] = await Promise.all([
    prisma.workshop.findUnique({
      where: { id },
      include: { categories: true },
    }),
    prisma.professor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!workshop) notFound();

  const selectedCategoryIds = new Set(workshop.categories.map((c: { categoryId: string }) => c.categoryId));
  const updateWithId = updateWorkshop.bind(null, id);

  const inputClass = "w-full border border-[var(--color-chalk-sand)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-chalk-terracotta)]";
  const dateValue = workshop.date.toISOString().slice(0, 16);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)] mb-8">
        Editar taller
      </h1>

      <form action={updateWithId} className="space-y-5 bg-white rounded-2xl border border-[var(--color-chalk-sand)] p-6">
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Título *</label>
          <input name="title" required defaultValue={workshop.title} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Descripción *</label>
          <textarea name="description" required rows={4} defaultValue={workshop.description} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">URL foto *</label>
          <input name="photoUrl" required type="url" defaultValue={workshop.photoUrl} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Fecha y hora *</label>
            <input name="date" required type="datetime-local" defaultValue={dateValue} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Duración *</label>
            <input name="duration" required defaultValue={workshop.duration} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Precio (ARS)</label>
            <input name="price" type="number" min="0" defaultValue={workshop.price ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Cupos máximos</label>
            <input name="maxSpots" type="number" min="1" defaultValue={workshop.maxSpots ?? ""} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Provincia *</label>
            <select name="province" required defaultValue={workshop.province} className={inputClass}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Ciudad *</label>
            <input name="city" required defaultValue={workshop.city} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Profesora *</label>
          <select name="professorId" required defaultValue={workshop.professorId} className={inputClass}>
            {professors.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.tier})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-2">Categorías</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" name="cat" value={c.id}
                  defaultChecked={selectedCategoryIds.has(c.id)} className="rounded" />
                {c.name}
              </label>
            ))}
          </div>
          <input type="hidden" name="categoryIds" id="categoryIds"
            defaultValue={[...selectedCategoryIds].join(",")} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Mensaje WhatsApp *</label>
          <textarea name="whatsappMsg" required rows={2} defaultValue={workshop.whatsappMsg} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Número WhatsApp *</label>
          <input name="whatsappNum" required defaultValue={workshop.whatsappNum} className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="active" id="active" defaultChecked={workshop.active} className="rounded" />
          <label htmlFor="active" className="text-sm text-[var(--color-chalk-charcoal)]/70">Taller publicado</label>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `document.querySelector('form').addEventListener('submit', function() {
            const checked = [...document.querySelectorAll('[name="cat"]:checked')].map(cb => cb.value);
            document.getElementById('categoryIds').value = checked.join(',');
          });`
        }} />

        <div className="flex gap-3 pt-4 border-t border-[var(--color-chalk-sand)]">
          <button type="submit"
            className="bg-[var(--color-chalk-terracotta)] hover:bg-[var(--color-chalk-terracotta-dark)] text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            Guardar cambios
          </button>
          <a href="/admin/talleres"
            className="border border-[var(--color-chalk-sand)] text-[var(--color-chalk-charcoal)]/70 font-medium px-6 py-2.5 rounded-lg hover:bg-[var(--color-chalk-cream)] transition-colors">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
