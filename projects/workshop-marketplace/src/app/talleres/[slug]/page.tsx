import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Clock, Users, ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { TierBadge } from "@/components/professors/TierBadge";
import { WorkshopCard } from "@/components/workshops/WorkshopCard";
import { WorkshopTypeBadge } from "@/components/workshops/WorkshopTypeBadge";
import { WhatsAppButton } from "@/components/workshops/WhatsAppButton";
import { AddToCalendarButton } from "@/components/workshops/AddToCalendarButton";
import { buildWorkshopWhatsAppUrl } from "@/lib/whatsapp";
import { formatPrice, formatDate, isPast } from "@/lib/utils";
import { getWorkshopBySlug, getRelatedWorkshops } from "@/lib/db";

type Params = { slug: string };

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await props.params;
  const workshop = await getWorkshopBySlug(slug);
  if (!workshop) return {};
  return {
    title: workshop.title,
    description: `${workshop.title} con ${workshop.professor.name} en ${workshop.city}.`,
  };
}

export default async function TallerDetailPage(props: { params: Promise<Params> }) {
  const { slug } = await props.params;
  const workshop = await getWorkshopBySlug(slug);
  if (!workshop) notFound();

  const related = await getRelatedWorkshops(workshop.id, workshop.professorId, workshop.categories.map(c => c.category.id));
  const waUrl = buildWorkshopWhatsAppUrl({ phone: workshop.whatsappNum, workshopTitle: workshop.title, date: new Date(workshop.date), city: workshop.city });
  const past = isPast(workshop.date);
  const isFree = !workshop.price || workshop.price === 0;

  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* Hero editorial — título e info encima de la foto */}
        <div className="relative h-72 sm:h-96 lg:h-[440px] overflow-hidden bg-[#111111]">
          <Image
            src={workshop.photoUrl} alt={workshop.title} fill
            className={`object-cover object-center transition-transform duration-700 ${past ? "grayscale opacity-40" : "opacity-70"}`}
            priority sizes="100vw"
          />
          {/* Gradiente: oscuro abajo donde va el texto, casi transparente arriba */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          {/* Contenido sobre la foto */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full left-0 right-0">
            {/* Top: breadcrumb + badge de realizado */}
            <div className="flex items-start justify-between">
              <Link href="/talleres" className="inline-flex items-center gap-1 text-xs font-bold text-white/60 hover:text-white transition-colors">
                <ChevronLeft size={14} /> Volver a talleres
              </Link>
              {past && (
                <span className="bg-white/90 text-xs font-black px-3 py-1.5 rounded-full text-[#555555]">Realizado</span>
              )}
            </div>

            {/* Bottom: tipo, título, meta */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <WorkshopTypeBadge type={(workshop as any).workshopType ?? "TALLER"} />
                {workshop.categories.map(({ category }) => (
                  <span key={category.id} className="text-xs bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-0.5 rounded-full text-white font-bold">{category.name}</span>
                ))}
              </div>
              <h1 className="font-black text-3xl sm:text-4xl lg:text-5xl text-white leading-tight max-w-2xl">{workshop.title}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-white/70 text-sm font-bold">
                <span className="flex items-center gap-1.5"><MapPin size={13} />{workshop.city}, {workshop.province}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} />{formatDate(workshop.date)}</span>
                {workshop.maxSpots && <span className="flex items-center gap-1.5"><Users size={13} />Máx. {workshop.maxSpots} personas</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main */}
            <div className="lg:col-span-2">
              <p className="text-[#444444] leading-relaxed text-[15px]">{workshop.description}</p>

              {/* Professor */}
              <div className="mt-10 p-5 border border-[#E0E0E0] rounded-2xl flex items-center gap-4 bg-white">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-[#E0E0E0]">
                  <Image src={workshop.professor.photoUrl} alt={workshop.professor.name} fill className="object-cover" sizes="56px" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#999999] font-bold mb-0.5 uppercase tracking-wider">Dictado por</p>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-[#111111]">{workshop.professor.name}</p>
                    <TierBadge tier={workshop.professor.tier as any} size="sm" />
                  </div>
                </div>
                <Link href={`/profesoras/${workshop.professor.slug}`} className="text-sm font-bold text-[#00BBAD] hover:underline shrink-0">Ver perfil →</Link>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 bg-white border border-[#E0E0E0] rounded-2xl overflow-hidden">
                {/* Barra de acento superior */}
                <div className="h-1.5 bg-[#00BBAD]" />
                <div className="p-6 space-y-4">
                  {isFree ? (
                    <p className="font-black text-3xl text-[#e80c87]">Gratuito</p>
                  ) : workshop.price ? (
                    <p className="font-black text-3xl text-[#111111]">{formatPrice(workshop.price)}</p>
                  ) : null}

                  {workshop.duration && (
                    <p className="text-sm text-[#999999]">Duración: <span className="font-bold text-[#333333]">{workshop.duration}</span></p>
                  )}

                  <div className="border-t border-[#F0F0F0] pt-4 space-y-3">
                    {!past ? (
                      <WhatsAppButton url={waUrl} workshopId={workshop.id} />
                    ) : (
                      <p className="text-center text-sm text-[#999999] font-bold">Este taller ya fue realizado</p>
                    )}

                    {!past && (
                      <AddToCalendarButton
                        title={workshop.title}
                        date={workshop.date}
                        duration={workshop.duration}
                        city={workshop.city}
                        description={workshop.description}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Talleres relacionados — sección diferenciada */}
        {related.length > 0 && (
          <div className="bg-[#F5F5F5] border-t border-[#E8E8E8] mt-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="font-black text-2xl text-[#111111] mb-8">Talleres relacionados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((w) => <WorkshopCard key={w.id} workshop={w as any} />)}
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}
