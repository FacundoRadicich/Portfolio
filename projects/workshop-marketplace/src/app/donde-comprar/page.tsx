import type { Metadata } from "next";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { MapaExplorer } from "@/components/pdv/MapaExplorer";
import { getPdvForMap } from "@/lib/pdv";

export const metadata: Metadata = {
  title: "Dónde comprar Oh My Chalk! — Puntos de venta",
  description:
    "Encontrá tu punto de venta de pintura tiza Oh My Chalk! más cercano: librerías, artísticas, pinturerías y talleres en toda Argentina.",
};

export const revalidate = 600;

export default async function DondeComprarPage() {
  const pdvs = await getPdvForMap();

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <header className="mb-6 lg:mb-8">
          <span className="text-xs font-black bg-[#00BBAD]/10 text-[#009e92] px-3 py-1 rounded-full uppercase tracking-wider">
            Puntos de venta
          </span>
          <h1 className="font-black text-3xl lg:text-5xl text-[#111111] mt-4 tracking-tight">
            ¿Dónde comprar Oh My Chalk!?
          </h1>
          <p className="text-[#555] mt-3 max-w-2xl">
            Encontrá tu punto de venta más cercano. Activá tu ubicación para ver los que
            tenés cerca, o buscá por localidad. Tocá un local para contactarlo por WhatsApp,
            llamar o cómo llegar.
          </p>
        </header>

        <MapaExplorer pdvs={pdvs} />
      </main>
      <Footer />
    </>
  );
}
