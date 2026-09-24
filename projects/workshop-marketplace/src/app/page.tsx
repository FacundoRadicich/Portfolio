import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Palette, Recycle, Hand, Users } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { WorkshopCard } from "@/components/workshops/WorkshopCard";
import { ProfessorCard } from "@/components/professors/ProfessorCard";
import { getUpcomingWorkshops, getEmbajadoras, getCategories } from "@/lib/db";

export const revalidate = 600;

export default async function HomePage() {
  const [upcomingWorkshops, embajadoras, categories] = await Promise.all([
    getUpcomingWorkshops(6),
    getEmbajadoras(4),
    getCategories(),
  ]);

  return (
    <>
      <Navbar />
      <main>

        {/* ── HERO — banner horizontal ──────────────────────────────────── */}
        <section className="relative h-[70vh] min-h-[480px] max-h-[640px] overflow-hidden">
          {/* Background image */}
          <Image
            src="https://plus.unsplash.com/premium_photo-1705717318393-fc1b452f6de8?w=1600&fit=crop&q=80"
            alt="Mujer pintando mueble con pintura tiza"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          {/* Gradient overlay: dark left, transparent right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="max-w-xl">
              <span className="inline-block text-xs font-black tracking-widest uppercase text-[#00BBAD] mb-4">
                Pintura tiza · Argentina
              </span>
              <h1 className="font-black text-5xl sm:text-6xl lg:text-7xl text-white leading-[1] mb-5">
                Encontrá tu
                <br />
                <span className="text-[#00BBAD]">próximo taller</span>
              </h1>
              <p className="text-base text-white/70 mb-8 leading-relaxed">
                Talleres, cursos y demos de pintura tiza en todo el país.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/talleres"
                  className="inline-flex items-center justify-center gap-2 bg-[#00BBAD] text-white font-black px-8 py-4 rounded-full hover:bg-[#009e92] transition-colors">
                  Ver talleres <ArrowRight size={18} />
                </Link>
                <Link href="/profesoras"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#111111] font-black px-8 py-4 rounded-full hover:bg-[#F5F5F5] transition-colors">
                  Las profesoras
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Category pills ────────────────────────────────────────────── */}
        <section className="bg-white border-b border-[#E0E0E0] py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-2 justify-center">
            <Link href="/talleres"
              className="text-xs font-black bg-[#111111] text-white px-4 py-2 rounded-full hover:bg-[#333333] transition-colors">
              Todos
            </Link>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/talleres?category=${cat.id}`}
                className="text-xs font-black bg-[#F5F5F5] border border-[#E0E0E0] px-4 py-2 rounded-full hover:bg-[#00BBAD] hover:text-white hover:border-[#00BBAD] transition-all">
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Próximos talleres ─────────────────────────────────────────── */}
        {upcomingWorkshops.length > 0 && (
          <section className="bg-[#F5F5F5] py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <span className="text-xs font-black tracking-widest uppercase text-[#00BBAD] block mb-1">Próximamente</span>
                  <h2 className="font-black text-3xl sm:text-4xl text-[#111111]">Talleres que se vienen</h2>
                </div>
                <Link href="/talleres" className="hidden sm:inline-flex items-center gap-1 text-sm font-black text-[#00BBAD] hover:underline">
                  Ver todos <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingWorkshops.map((w) => <WorkshopCard key={w.id} workshop={w as any} />)}
              </div>
            </div>
          </section>
        )}

        {/* ── Embajadoras ───────────────────────────────────────────────── */}
        {embajadoras.length > 0 && (
          <section className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="inline-block text-xs font-black tracking-widest uppercase bg-[#e80c87] text-white px-3 py-1 rounded-full mb-3">
                  Profesoras destacadas
                </span>
                <h2 className="font-black text-3xl sm:text-4xl text-[#111111]">Nuestras Embajadoras</h2>
                <p className="mt-3 text-[#777777] max-w-md mx-auto text-sm">
                  Las profesoras más destacadas de OH My Chalk! con años de experiencia.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {embajadoras.map((p) => <ProfessorCard key={p.id} professor={p as any} />)}
              </div>
              <div className="text-center mt-10">
                <Link href="/profesoras"
                  className="inline-flex items-center gap-2 border-2 border-[#111111] text-[#111111] font-black px-6 py-3 rounded-full hover:bg-[#111111] hover:text-white transition-colors">
                  Ver todas las profesoras
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Por qué — sección negra ───────────────────────────────────── */}
        <section className="bg-[#111111] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-black text-3xl sm:text-4xl text-white">¿Por qué aprender pintura tiza?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { Icon: Palette, title: "Transformá objetos", desc: "Dale nueva vida a muebles y accesorios con técnica artesanal.", accent: "#e80c87" },
                { Icon: Recycle, title: "Sustentable", desc: "Recuperar en lugar de tirar. Amigable con el ambiente.", accent: "#00BBAD" },
                { Icon: Hand, title: "Arte manual", desc: "Reconectate con el trabajo hecho a mano y la creatividad.", accent: "#e80c87" },
                { Icon: Users, title: "Comunidad", desc: "Formá parte de la comunidad de creadoras más grande del país.", accent: "#00BBAD" },
              ].map(({ Icon, title, desc, accent }) => (
                <div key={title} className="border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-colors">
                  <Icon size={28} style={{ color: accent }} className="mb-4" />
                  <h3 className="font-black text-white mb-2">{title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Profesoras ────────────────────────────────────────────── */}
        <section className="bg-[#F5F5F5] py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-black text-3xl sm:text-4xl text-[#111111] mb-4">¿Sos profesora de OH My Chalk!?</h2>
            <p className="text-[#555555] mb-8 max-w-lg mx-auto">
              Sumá tus talleres al marketplace y llegá a miles de alumnas en todo el país.
            </p>
            <a href="mailto:hola@ohmychalk.com.ar?subject=Quiero ser profesora en el marketplace"
              className="inline-flex items-center gap-2 bg-[#111111] text-white font-black px-8 py-4 rounded-full hover:bg-[#333333] transition-colors">
              Escribinos ✉
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
