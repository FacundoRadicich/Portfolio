// @ts-nocheck
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { updateProfessorProfile } from "@/lib/portal-actions";
import { PROVINCES } from "@/types";

export default async function PortalPerfilPage() {
  const user = await getUser();
  if (!user) redirect("/portal/login");

  const professor = await prisma.professor.findUnique({
    where: { userId: user.id },
  });

  if (!professor) redirect("/portal");

  const inputClass = "w-full border border-[var(--color-chalk-sand)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-chalk-terracotta)]";

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)] mb-8">
        Mi perfil
      </h1>

      <form action={updateProfessorProfile} className="space-y-5 bg-white rounded-2xl border border-[var(--color-chalk-sand)] p-6">
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Nombre completo</label>
          <input name="name" required defaultValue={professor.name} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Biografía</label>
          <textarea name="bio" required rows={4} defaultValue={professor.bio} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">URL foto de perfil</label>
            <input name="photoUrl" required type="url" defaultValue={professor.photoUrl} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">URL foto de cover</label>
            <input name="coverUrl" type="url" defaultValue={professor.coverUrl ?? ""} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">WhatsApp (con código de país)</label>
          <input name="whatsapp" required defaultValue={professor.whatsapp} className={inputClass} />
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
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Provincia</label>
            <select name="province" required defaultValue={professor.province} className={inputClass}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Ciudad</label>
            <input name="city" required defaultValue={professor.city} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-chalk-charcoal)]/60 mb-1">Especialidades (separadas por coma)</label>
          <input name="specialties" defaultValue={professor.specialties.join(", ")} className={inputClass} />
        </div>

        <div className="pt-4 border-t border-[var(--color-chalk-sand)]">
          <button type="submit"
            className="bg-[var(--color-chalk-terracotta)] hover:bg-[var(--color-chalk-terracotta-dark)] text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
