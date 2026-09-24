// @ts-nocheck
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/supabase-server";
import { getProfessorWithWorkshopsByUserId } from "@/lib/db";
import { WorkshopCard } from "@/components/workshops/WorkshopCard";
import { TierBadge } from "@/components/professors/TierBadge";

export default async function PortalDashboard() {
  const user = await getUser();
  if (!user) redirect("/portal/login");

  const professor = await getProfessorWithWorkshopsByUserId(user.id);

  // Sin perfil o perfil incompleto → onboarding
  if (!professor || !professor.bio || !professor.photoUrl || !professor.whatsapp) {
    redirect("/portal/onboarding");
  }

  const now = new Date().toISOString();
  const upcoming = professor.workshops.filter((w) => w.date >= now);
  const past = professor.workshops.filter((w) => w.date < now);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)]">
            Hola, {professor.name.split(" ")[0]} 👋
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <TierBadge tier={professor.tier} />
            <span className="text-sm text-[var(--color-chalk-charcoal)]/50">{professor.city}, {professor.province}</span>
          </div>
        </div>
        <Link href="/portal/talleres/nuevo"
          className="bg-[var(--color-chalk-terracotta)] hover:bg-[var(--color-chalk-terracotta-dark)] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          + Nuevo taller
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Talleres totales", value: professor.workshops.length },
          { label: "Próximos", value: upcoming.length, color: "text-green-600" },
          { label: "Realizados", value: past.length },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-[var(--color-chalk-sand)] p-5">
            <p className={`text-3xl font-bold ${color ?? "text-[var(--color-chalk-espresso)]"}`}>{value}</p>
            <p className="text-xs text-[var(--color-chalk-charcoal)]/50 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display text-2xl font-light text-[var(--color-chalk-espresso)] mb-5">Mis próximos talleres</h2>

      {upcoming.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {upcoming.map((w) => (
            <div key={w.id} className="relative">
              <WorkshopCard workshop={w as any} />
              <Link href={`/portal/talleres/${w.id}`}
                className="absolute top-3 right-3 bg-white/90 text-xs font-medium px-2 py-1 rounded-lg text-[var(--color-chalk-terracotta)] hover:bg-white transition-colors shadow-sm">
                Editar
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--color-chalk-sand)] p-8 text-center">
          <p className="text-[var(--color-chalk-charcoal)]/50 mb-4">Todavía no tenés talleres próximos.</p>
          <Link href="/portal/talleres/nuevo" className="text-sm font-medium text-[var(--color-chalk-terracotta)] hover:underline">
            Crear tu primer taller →
          </Link>
        </div>
      )}
    </div>
  );
}
