import type { Metadata } from "next";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { ProfessorCard } from "@/components/professors/ProfessorCard";
import { getProfessorsByTier } from "@/lib/db";

export const metadata: Metadata = {
  title: "Profesoras de Pintura Tiza",
  description: "Conocé a todas las profesoras certificadas de OH My Chalk! en Argentina.",
};

export default async function ProfesorasPage() {
  const groups = await getProfessorsByTier();
  const professors = groups.flatMap((g) => g.professors);

  return (
    <>
      <Navbar />
      <main className="bg-white min-h-screen">
        {/* Header — fondo lila */}
        <div className="border-b border-[#D0B0E0]" style={{ background: 'linear-gradient(135deg, #C9B4D6 0%, #DBC8E8 100%)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="font-black text-5xl sm:text-6xl text-[#111111]">Nuestras profesoras</h1>
            <p className="mt-2 text-[#555555] font-bold">
              {professors.length} profesora{professors.length !== 1 ? "s" : ""} en todo el país
            </p>
          </div>
        </div>

        {/* Grid plano ordenado por tier */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {professors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {professors.map((p) => (
                <ProfessorCard key={p.id} professor={p as any} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-[#AAAAAA]">
              <p className="font-black text-2xl mb-2">No hay profesoras todavía</p>
              <p className="text-sm">Pronto se van a sumar.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
