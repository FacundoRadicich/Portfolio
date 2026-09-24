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

export default function RegistroProfesoraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", city: "", province: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Crear cuenta vía API
    const res = await fetch("/api/portal/register", {
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

    // 2. Iniciar sesión automáticamente
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError("Cuenta creada. Iniciá sesión manualmente.");
      router.push("/portal/login");
      return;
    }

    // 3. Ir al onboarding
    router.push("/portal/onboarding");
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="font-black text-2xl text-[#00BBAD]">OH My Chalk!</Link>
          <h1 className="font-black text-2xl text-[#111111] mt-4">Registrate como profesora</h1>
          <p className="text-sm text-[#777777] mt-1">
            Sumá tus talleres y llegá a alumnas de todo el país.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Nombre completo *</label>
            <input
              name="name" required value={form.name} onChange={handleChange}
              placeholder="María González"
              className="w-full border border-[#E0E0E0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00BBAD]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Email *</label>
            <input
              name="email" type="email" required value={form.email} onChange={handleChange}
              placeholder="maria@email.com"
              className="w-full border border-[#E0E0E0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00BBAD]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Contraseña *</label>
            <input
              name="password" type="password" required minLength={6} value={form.password} onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className="w-full border border-[#E0E0E0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00BBAD]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#555555] mb-1">Provincia *</label>
              <select
                name="province" required value={form.province} onChange={handleChange}
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-[#00BBAD] bg-white"
              >
                <option value="">— Elegí —</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#555555] mb-1">Ciudad *</label>
              <input
                name="city" required value={form.city} onChange={handleChange}
                placeholder="Córdoba"
                className="w-full border border-[#E0E0E0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00BBAD]"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-[#00BBAD] hover:bg-[#009e92] text-white font-black py-3 rounded-full transition-colors disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-xs text-center text-[#AAAAAA] mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/portal/login" className="text-[#00BBAD] font-bold hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
