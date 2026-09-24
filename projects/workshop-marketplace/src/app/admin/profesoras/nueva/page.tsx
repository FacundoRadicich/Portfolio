// @ts-nocheck
import { createProfessor } from "@/lib/actions";
import { PROVINCES } from "@/types";

export default function NuevaProfesoraPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)] mb-8">
        Nueva profesora
      </h1>

      <form action={createProfessor} className="space-y-5 bg-white rounded-2xl border border-[var(--color-chalk-sand)] p-6">
        <ProfessorFormFields />
        <div className="flex gap-3 pt-4 border-t border-[var(--color-chalk-sand)]">
          <button type="submit"
            className="bg-[var(--color-chalk-terracotta)] hover:bg-[var(--color-chalk-terracotta-dark)] text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            Crear profesora
          </button>
          <a href="/admin/profesoras"
            className="border border-[var(--color-chalk-sand)] text-[var(--color-chalk-charcoal)]/70 font-medium px-6 py-2.5 rounded-lg hover:bg-[var(--color-chalk-cream)] transition-colors">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}

function ProfessorFormFields({ defaults }: { defaults?: Record<string, string | string[]> }) {
  const inputClass = "w-full border border-[var(--color-chalk-sand)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-chalk-terracotta)]";

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Nombre completo *</label>
        <input name="name" required defaultValue={defaults?.name as string} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Biografía *</label>
        <textarea name="bio" required rows={4} defaultValue={defaults?.bio as string} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">URL foto de perfil *</label>
          <input name="photoUrl" required type="url" defaultValue={defaults?.photoUrl as string} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">URL foto de cover</label>
          <input name="coverUrl" type="url" defaultValue={defaults?.coverUrl as string} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Tier *</label>
          <select name="tier" required className={inputClass}>
            <option value="COLABORADORA">Colaboradora</option>
            <option value="INSTRUCTORA">Instructora</option>
            <option value="EMBAJADORA">Embajadora</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">WhatsApp (con código de país) *</label>
          <input name="whatsapp" required placeholder="5491112345678" defaultValue={defaults?.whatsapp as string} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Instagram</label>
          <input name="instagram" placeholder="@usuario" defaultValue={defaults?.instagram as string} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Facebook (URL)</label>
          <input name="facebook" type="url" defaultValue={defaults?.facebook as string} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Provincia *</label>
          <select name="province" required className={inputClass}>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Ciudad *</label>
          <input name="city" required defaultValue={defaults?.city as string} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Especialidades (separadas por coma)</label>
        <input name="specialties" placeholder="Muebles, Decoupage, Técnicas vintage" defaultValue={defaults?.specialties as string} className={inputClass} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="active" id="active" defaultChecked className="rounded" />
        <label htmlFor="active" className="text-sm text-[var(--color-chalk-charcoal)]/70">Perfil activo (visible en el marketplace)</label>
      </div>
    </>
  );
}
