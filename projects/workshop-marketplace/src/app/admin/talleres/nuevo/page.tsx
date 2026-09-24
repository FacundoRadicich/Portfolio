// @ts-nocheck
import { getProfessors, getCategories } from "@/lib/db";
import { createWorkshop } from "@/lib/actions";
import { PROVINCES } from "@/types";

export default async function NuevoTallerPage() {
  const [professors, categories] = await Promise.all([getProfessors(true), getCategories()]);
  const inputClass = "w-full border border-[var(--color-chalk-sand)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-chalk-terracotta)]";

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)] mb-8">Nuevo taller</h1>
      <form action={createWorkshop} className="space-y-5 bg-white rounded-2xl border border-[var(--color-chalk-sand)] p-6">
        <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Título *</label><input name="title" required className={inputClass} /></div>
        <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Descripción *</label><textarea name="description" required rows={4} className={inputClass} /></div>
        <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">URL foto *</label><input name="photoUrl" required type="url" className={inputClass} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Fecha y hora *</label><input name="date" required type="datetime-local" className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Duración *</label><input name="duration" required placeholder="3 horas" className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Precio (ARS)</label><input name="price" type="number" min="0" className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Cupos máximos</label><input name="maxSpots" type="number" min="1" className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Provincia *</label>
            <select name="province" required className={inputClass}>{PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Ciudad *</label><input name="city" required className={inputClass} /></div>
        </div>
        <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Profesora *</label>
          <select name="professorId" required className={inputClass}>
            <option value="">— Seleccioná —</option>
            {professors.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.tier})</option>)}
          </select></div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-2">Categorías</label>
          <div className="flex flex-wrap gap-2">{categories.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" name="cat" value={c.id} className="rounded" />{c.name}
            </label>
          ))}</div>
          <input type="hidden" name="categoryIds" id="categoryIds" />
        </div>
        <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Mensaje WhatsApp *</label><textarea name="whatsappMsg" required rows={2} className={inputClass} /></div>
        <div><label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Número WhatsApp *</label><input name="whatsappNum" required placeholder="5491112345678" className={inputClass} /></div>
        <div className="flex items-center gap-2"><input type="checkbox" name="active" id="active" defaultChecked className="rounded" /><label htmlFor="active" className="text-sm text-[var(--color-chalk-charcoal)]/70">Publicar taller</label></div>
        <script dangerouslySetInnerHTML={{ __html: `document.querySelector('form').addEventListener('submit',function(){const c=[...document.querySelectorAll('[name="cat"]:checked')].map(cb=>cb.value);document.getElementById('categoryIds').value=c.join(',');});` }} />
        <div className="flex gap-3 pt-4 border-t border-[var(--color-chalk-sand)]">
          <button type="submit" className="bg-[var(--color-chalk-terracotta)] hover:bg-[var(--color-chalk-terracotta-dark)] text-white font-medium px-6 py-2.5 rounded-lg transition-colors">Crear taller</button>
          <a href="/admin/talleres" className="border border-[var(--color-chalk-sand)] text-[var(--color-chalk-charcoal)]/70 font-medium px-6 py-2.5 rounded-lg hover:bg-[var(--color-chalk-cream)] transition-colors">Cancelar</a>
        </div>
      </form>
    </div>
  );
}
