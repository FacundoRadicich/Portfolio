"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PROVINCES } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WHATSAPP_COMMUNITY = "https://chat.whatsapp.com/COMUNIDAD_OMC"; // reemplazar con link real

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "bienvenida">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", province: "",
    notifyEmail: true, notifyWhatsapp: true,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al registrarse.");
      setLoading(false);
      return;
    }

    // Iniciar sesión automáticamente
    await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setStep("bienvenida");
    setLoading(false);
  }

  if (step === "bienvenida") {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-[#00BBAD]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎨</span>
          </div>
          <h1 className="font-black text-2xl text-[#111111] mb-2">
            ¡Bienvenida, {form.name.split(" ")[0]}!
          </h1>
          <p className="text-[#777777] text-sm mb-8">
            Tu cuenta fue creada. Ahora podés guardar talleres favoritos y reservar con tus datos ya cargados.
          </p>

          <div className="space-y-3">
            <a
              href={WHATSAPP_COMMUNITY}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25d366] hover:bg-[#1ebe57] text-white font-black py-3 rounded-full transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.557 4.126 1.526 5.858L.078 23.506a.5.5 0 0 0 .614.614l5.652-1.448A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.515-5.228-1.407l-.374-.22-3.882.995.994-3.88-.22-.375A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Unirme al grupo de la comunidad
            </a>
            <button
              onClick={() => router.push("/talleres")}
              className="w-full border border-[#E0E0E0] text-[#333333] font-bold py-3 rounded-full hover:border-[#00BBAD] hover:text-[#00BBAD] transition-colors"
            >
              Ver talleres →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="font-black text-2xl text-[#00BBAD]">OH My Chalk!</Link>
          <h1 className="font-black text-2xl text-[#111111] mt-4">Creá tu cuenta</h1>
          <p className="text-sm text-[#777777] mt-1">
            Guardá talleres favoritos y reservá con tus datos ya cargados.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Nombre completo *</label>
            <input name="name" required value={form.name} onChange={handleChange}
              placeholder="María González"
              className="w-full border border-[#E0E0E0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00BBAD]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Email *</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange}
              placeholder="maria@email.com"
              className="w-full border border-[#E0E0E0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00BBAD]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Contraseña *</label>
            <input name="password" type="password" required minLength={6} value={form.password} onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className="w-full border border-[#E0E0E0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00BBAD]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Teléfono / WhatsApp *</label>
            <input name="phone" required value={form.phone} onChange={handleChange}
              placeholder="1112345678"
              className="w-full border border-[#E0E0E0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00BBAD]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Provincia *</label>
            <select name="province" required value={form.province} onChange={handleChange}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-[#00BBAD] bg-white">
              <option value="">— Elegí tu provincia —</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Notificaciones */}
          <div className="bg-[#F5F5F5] rounded-xl p-4 space-y-2">
            <p className="text-xs font-black text-[#555555] uppercase tracking-wider mb-3">Quiero recibir novedades por:</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="notifyEmail" checked={form.notifyEmail} onChange={handleChange} className="rounded" />
              <span className="text-sm font-bold text-[#333333]">📧 Email</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="notifyWhatsapp" checked={form.notifyWhatsapp} onChange={handleChange} className="rounded" />
              <span className="text-sm font-bold text-[#333333]">📱 WhatsApp</span>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#00BBAD] hover:bg-[#009e92] text-white font-black py-3 rounded-full transition-colors disabled:opacity-60">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-xs text-center text-[#AAAAAA] mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-[#00BBAD] font-bold hover:underline">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}
