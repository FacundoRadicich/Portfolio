import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { WorkshopCard } from "@/components/workshops/WorkshopCard";
import { getUser } from "@/lib/supabase-server";
import { getUserProfile, getUserFavorites, getUserAttendance } from "@/lib/db-users";
import { getWorkshopBySlug } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";

export default async function CuentaPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.id);
  if (!profile) redirect("/registro");

  // Obtener IDs de favoritos y talleres con asistencia
  const [favoriteIds, attendanceIds] = await Promise.all([
    getUserFavorites(user.id),
    getUserAttendance(user.id),
  ]);

  // Obtener talleres favoritos
  let favoriteWorkshops: any[] = [];
  if (favoriteIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("Workshop")
      .select("*, professor:Professor(*), categories:CategoriesOnWorkshops(category:Category(*))")
      .in("id", favoriteIds)
      .eq("active", true)
      .order("date", { ascending: true });
    favoriteWorkshops = data ?? [];
  }

  // Obtener talleres con asistencia (historial)
  let attendanceWorkshops: any[] = [];
  if (attendanceIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("Workshop")
      .select("*, professor:Professor(*), categories:CategoriesOnWorkshops(category:Category(*))")
      .in("id", attendanceIds)
      .order("date", { ascending: false });
    attendanceWorkshops = data ?? [];
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F5F5]">
        {/* Header */}
        <div className="bg-white border-b border-[#E0E0E0] py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-black text-4xl text-[#111111]">
              Hola, {profile.name.split(" ")[0]} 👋
            </h1>
            <p className="text-[#777777] mt-1">{profile.province}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Favoritos", value: favoriteIds.length },
              { label: "Talleres reservados", value: attendanceIds.length },
              { label: "Notificaciones", value: [profile.notifyEmail && "Email", profile.notifyWhatsapp && "WhatsApp"].filter(Boolean).join(" + ") || "Ninguna" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-[#E0E0E0] p-5">
                <p className="font-black text-2xl text-[#111111]">{value}</p>
                <p className="text-xs text-[#777777] mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Favoritos */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-black text-2xl text-[#111111]">Mis favoritos</h2>
              <span className="text-xs font-black bg-white border border-[#E0E0E0] text-[#777777] px-2.5 py-0.5 rounded-full">
                {favoriteWorkshops.length}
              </span>
            </div>
            {favoriteWorkshops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteWorkshops.map(w => <WorkshopCard key={w.id} workshop={w as any} />)}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E0E0E0] p-10 text-center">
                <p className="text-[#AAAAAA] mb-3">Todavía no guardaste ningún taller.</p>
                <Link href="/talleres" className="text-sm font-bold text-[#00BBAD] hover:underline">
                  Explorar talleres →
                </Link>
              </div>
            )}
          </section>

          {/* Historial */}
          {attendanceWorkshops.length > 0 && (
            <section>
              <h2 className="font-black text-2xl text-[#111111] mb-6">Mis talleres</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendanceWorkshops.map(w => <WorkshopCard key={w.id} workshop={w as any} />)}
              </div>
            </section>
          )}

          {/* Configuración */}
          <section>
            <h2 className="font-black text-2xl text-[#111111] mb-6">Mi perfil</h2>
            <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#777777]">Nombre</span>
                <span className="font-bold">{profile.name}</span>
              </div>
              <div className="flex justify-between border-t border-[#F5F5F5] pt-3">
                <span className="text-[#777777]">Teléfono</span>
                <span className="font-bold">{profile.phone}</span>
              </div>
              <div className="flex justify-between border-t border-[#F5F5F5] pt-3">
                <span className="text-[#777777]">Provincia</span>
                <span className="font-bold">{profile.province}</span>
              </div>
              <div className="flex justify-between border-t border-[#F5F5F5] pt-3">
                <span className="text-[#777777]">Notificaciones</span>
                <span className="font-bold">
                  {[profile.notifyEmail && "Email", profile.notifyWhatsapp && "WhatsApp"].filter(Boolean).join(", ") || "Ninguna"}
                </span>
              </div>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
