// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROVINCES } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");

  function addSpecialty() {
    const s = specialtyInput.trim();
    if (s && !specialties.includes(s)) {
      setSpecialties(prev => [...prev, s]);
    }
    setSpecialtyInput("");
  }

  function removeSpecialty(s: string) {
    setSpecialties(prev => prev.filter(x => x !== s));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    fd.set("specialties", specialties.join(","));

    const res = await fetch("/api/portal/onboarding", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const { error: err } = await res.json();
      setError(err ?? "Error al guardar el perfil.");
      setLoading(false);
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  const inputClass = "w-full border border-[#E0E0E0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00BBAD]";

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 w-full max-w-lg">
        <div className="mb-8">
          <span className="text-xs font-black bg-[#00BBAD]/10 text-[#00BBAD] px-3 py-1 rounded-full uppercase tracking-wider">
            Paso 1 de 1
          </span>
          <h1 className="font-black text-2xl text-[#111111] mt-4">Completá tu perfil</h1>
          <p className="text-sm text-[#777777] mt-1">
            Con esta info vas a aparecer en el marketplace de OH My Chalk!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">URL de tu foto de perfil *</label>
            <input name="photoUrl" type="url" required placeholder="https://..." className={inputClass} />
            <p className="text-xs text-[#AAAAAA] mt-1">Podés usar el link de tu foto de Instagram o Google Drive</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Bio / Presentación *</label>
            <textarea
              name="bio" required rows={4} maxLength={500}
              placeholder="Contá quién sos, cuántos años de experiencia tenés, qué te apasiona de la pintura tiza..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">WhatsApp *</label>
            <input name="whatsapp" required placeholder="5491112345678" className={inputClass} />
            <p className="text-xs text-[#AAAAAA] mt-1">Código de país + número, sin + ni espacios</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Instagram</label>
            <input name="instagram" placeholder="@tuperfil" className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#555555] mb-2">Especialidades</label>
            <div className="flex gap-2">
              <input
                value={specialtyInput}
                onChange={e => setSpecialtyInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSpecialty(); }}}
                placeholder="Ej: Muebles, Decoupage..."
                className={inputClass}
              />
              <button type="button" onClick={addSpecialty}
                className="bg-[#F5F5F5] border border-[#E0E0E0] px-4 rounded-lg text-sm font-bold hover:border-[#00BBAD] transition-colors shrink-0">
                +
              </button>
            </div>
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {specialties.map(s => (
                  <span key={s} className="flex items-center gap-1 bg-[#F5F5F5] border border-[#E0E0E0] text-sm px-3 py-1 rounded-full">
                    {s}
                    <button type="button" onClick={() => removeSpecialty(s)} className="text-[#AAAAAA] hover:text-[#e80c87] ml-1">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-[#00BBAD] hover:bg-[#009e92] text-white font-black py-3 rounded-full transition-colors disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Publicar mi perfil →"}
          </button>
        </form>
      </div>
    </div>
  );
}
