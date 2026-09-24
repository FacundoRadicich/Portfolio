// @ts-nocheck
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProfessor, deleteProfessor } from "@/lib/actions";
import { PROVINCES } from "@/types";

type Params = { id: string };

export default async function EditProfesoraPage(props: { params: Promise<Params> }) {
  const { id } = await props.params;
  const professor = await prisma.professor.findUnique({ where: { id } });
  if (!professor) notFound();

  const inputClass = "w-full border border-[var(--color-chalk-sand)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-chalk-terracotta)]";

  const updateWithId = updateProfessor.bind(null, id);
  const deleteWithId = deleteProfessor.bind(null, id);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)] mb-8">
        Editar: {professor.name}
      </h1>

      <form action={updateWithId} className="space-y-5 bg-white rounded-2xl border border-[var(--color-chalk-sand)] p-6">
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Nombre completo *</label>
          <input name="name" required defaultValue={professor.name} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Biografía *</label>
          <textarea name="bio" required rows={4} defaultValue={professor.bio} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">URL foto de perfil *</label>
            <input name="photoUrl" required type="url" defaultValue={professor.photoUrl} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">URL foto de cover</label>
            <input name="coverUrl" type="url" defaultValue={professor.coverUrl ?? ""} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Tier *</label>
            <select name="tier" required defaultValue={professor.tier} className={inputClass}>
              <option value="COLABORADORA">Colaboradora</option>
              <option value="INSTRUCTORA">Instructora</option>
              <option value="EMBAJADORA">Embajadora</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">WhatsApp *</label>
            <input name="whatsapp" required defaultValue={professor.whatsapp} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Instagram</label>
            <input name="instagram" defaultValue={professor.instagram ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Facebook (URL)</label>
            <input name="facebook" defaultValue={professor.facebook ?? ""} className={inputClass} />
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
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Especialidades (separadas por coma)</label>
          <input name="specialties" defaultValue={professor.specialties.join(", ")} className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="active" id="active" defaultChecked={professor.active} className="rounded" />
          <label htmlFor="active" className="text-sm text-[var(--color-chalk-charcoal)]/70">Perfil activo</label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-[var(--color-chalk-sand)]">
          <button type="submit"
            className="bg-[var(--color-chalk-terracotta)] hover:bg-[var(--color-chalk-terracotta-dark)] text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            Guardar cambios
          </button>
          <a href="/admin/profesoras"
            className="border border-[var(--color-chalk-sand)] text-[var(--color-chalk-charcoal)]/70 font-medium px-6 py-2.5 rounded-lg hover:bg-[var(--color-chalk-cream)] transition-colors">
            Cancelar
          </a>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-sm font-medium text-red-700 mb-2">Desactivar profesora</p>
        <p className="text-xs text-red-600/70 mb-3">La profesora y sus talleres dejarán de aparecer en el marketplace.</p>
        <form action={deleteWithId}>
          <button type="submit"
            className="text-xs text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-lg transition-colors">
            Desactivar
          </button>
        </form>
      </div>
    </div>
  );
}
