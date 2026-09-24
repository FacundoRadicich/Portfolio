import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { TierBadge } from "@/components/professors/TierBadge";
import { WorkshopCard } from "@/components/workshops/WorkshopCard";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { getProfessorBySlug } from "@/lib/db";

type Params = { slug: string };

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await props.params;
  const prof = await getProfessorBySlug(slug);
  if (!prof) return {};
  return { title: prof.name, description: `Perfil de ${prof.name}, profesora de pintura tiza en ${prof.city}.` };
}

export default async function ProfesoraProfilePage(props: { params: Promise<Params> }) {
  const { slug } = await props.params;
  const professor = await getProfessorBySlug(slug);
  if (!professor) notFound();

  const now = new Date().toISOString();
  const upcoming = professor.workshops.filter((w) => w.date >= now);
  const past = professor.workshops.filter((w) => w.date < now).reverse();

  const waUrl = buildWhatsAppUrl(
    professor.whatsapp,
    `Hola ${professor.name.split(" ")[0]}! Vi tu perfil en OH My Chalk y me interesa conocer tus talleres.`
  );

  const TIER_COVER: Record<string, string> = {
    EMBAJADORA:   'linear-gradient(135deg, #f7d6eb 0%, #c40a72 100%)',
    INSTRUCTORA:  'linear-gradient(135deg, #c8eeec 0%, #009e92 100%)',
    COLABORADORA: 'linear-gradient(135deg, #e0e0e0 0%, #444444 100%)',
  };

  return (
    <>
      <Navbar />
      <main className="bg-[#F5F5F5] min-h-screen">
        <div className="bg-white border-b border-[#E0E0E0]">
          <div
            className="relative h-48 sm:h-64 overflow-hidden"
            style={{ background: TIER_COVER[professor.tier] }}
          >
            {professor.coverUrl && <Image src={professor.coverUrl} alt="" fill className="object-cover opacity-40" sizes="100vw" />}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg shrink-0">
                <Image src={professor.photoUrl} alt={professor.name} fill className="object-cover" sizes="160px" priority />
              </div>
              <div className="sm:mb-2">
                <TierBadge tier={professor.tier} size="md" />
                <h1 className="font-display text-4xl sm:text-5xl font-light text-[#111111] mt-2">{professor.name}</h1>
                <p className="text-[#333333]/60 mt-1">📍 {professor.city}, {professor.province}</p>
                <div className="flex gap-4 mt-3">
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium bg-[#25d366] text-white px-4 py-1.5 rounded-full hover:bg-[#1ebe57] transition-colors">WhatsApp</a>
                  {professor.instagram && (
                    <a href={`https://instagram.com/${professor.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium border border-[#E0E0E0] px-4 py-1.5 rounded-full hover:border-[#00BBAD] hover:text-[#00BBAD] transition-colors">Instagram</a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <aside className="lg:col-span-1 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#111111] mb-3">Sobre mí</h2>
                <p className="text-[#333333]/70 leading-relaxed text-sm">{professor.bio}</p>
              </div>
              {professor.specialties.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-[#333333]/50 uppercase tracking-wider mb-2">Especialidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {professor.specialties.map((s) => (
                      <span key={s} className="text-sm bg-white border border-[#E0E0E0] px-3 py-1 rounded-full text-[#333333]/70">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center bg-[#25d366] hover:bg-[#1ebe57] text-white font-medium py-3 px-6 rounded-full transition-colors">
                📲 Contactar por WhatsApp
              </a>
            </aside>

            <div className="lg:col-span-2">
              {upcoming.length > 0 && (
                <div className="mb-12">
                  <h2 className="font-display text-3xl font-light text-[#111111] mb-6">Próximos talleres</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {upcoming.map((w) => <WorkshopCard key={w.id} workshop={w as any} />)}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h2 className="font-display text-3xl font-light text-[#333333]/40 mb-6">Talleres realizados</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 opacity-60">
                    {past.map((w) => <WorkshopCard key={w.id} workshop={w as any} />)}
                  </div>
                </div>
              )}
              {upcoming.length === 0 && past.length === 0 && (
                <p className="text-[#333333]/40 font-display text-xl">Aún no hay talleres publicados.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
