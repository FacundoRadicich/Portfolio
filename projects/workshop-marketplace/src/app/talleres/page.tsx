import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { WorkshopCard } from "@/components/workshops/WorkshopCard";
import { WorkshopFilters } from "@/components/workshops/WorkshopFilters";
import { getWorkshops, getCategories } from "@/lib/db";

export const metadata: Metadata = {
  title: "Talleres de Pintura Tiza",
  description: "Encontrá talleres de pintura tiza en toda Argentina.",
};

type SearchParams = { province?: string; category?: string; month?: string; tier?: string };

export default async function TalleresPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;

  const [workshops, categories] = await Promise.all([
    getWorkshops({ province: searchParams.province, categoryId: searchParams.category, month: searchParams.month, tier: searchParams.tier }),
    getCategories(),
  ]);

  const now = new Date().toISOString();
  const upcoming = workshops.filter((w) => w.date >= now);
  const past = workshops.filter((w) => w.date < now);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">

        {/* Header */}
        <div className="bg-[#111111] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-black text-5xl sm:text-6xl text-white">Todos los talleres</h1>
            <p className="mt-2 text-white/50 font-bold">
              {upcoming.length} taller{upcoming.length !== 1 ? "es" : ""} próximo{upcoming.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filters strip */}
        <div className="bg-[#F5F5F5] border-b border-[#E0E0E0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Suspense>
              <WorkshopFilters categories={categories as any} currentFilters={searchParams} />
            </Suspense>
          </div>
        </div>

        {/* Upcoming workshops */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {upcoming.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((w) => <WorkshopCard key={w.id} workshop={w as any} />)}
              </div>
            ) : (
              <div className="text-center py-20 text-[#AAAAAA]">
                <p className="font-black text-2xl mb-2">No hay talleres próximos</p>
                <p className="text-sm">Probá con otros filtros o volvé pronto.</p>
              </div>
            )}
          </div>
        </div>

        {/* Past workshops — sección visualmente diferenciada */}
        {past.length > 0 && (
          <div className="bg-[#F5F5F5] border-t border-[#E8E8E8]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center gap-3 mb-8">
                <span className="w-2 h-6 bg-[#CCCCCC] rounded-full shrink-0" />
                <h2 className="font-black text-2xl text-[#999999]">Talleres realizados</h2>
                <span className="text-xs font-black bg-white border border-[#E0E0E0] text-[#AAAAAA] px-2.5 py-0.5 rounded-full">
                  {past.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {past.map((w) => <WorkshopCard key={w.id} workshop={w as any} />)}
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}
