"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, ArrowRight } from "lucide-react";

type Match = {
  id: string;
  razonSocial: string;
  sucursales: { nombre: string; localidad: string | null }[];
};

export default function ValidarBuscarPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState<Match | null>(null);
  const [cuit, setCuit] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  // Búsqueda en vivo (debounced) mientras se escribe
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) {
      setMatches([]);
      setSearched(false);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      setSelected(null);
      try {
        const res = await fetch(`/api/validar/buscar?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setMatches(data.matches ?? []);
        setSearched(true);
      } catch {
        if (!ctrl.signal.aborted) setMatches([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  async function reclamar(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError("");
    setClaiming(true);
    try {
      const res = await fetch("/api/validar/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: selected.id, cuit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos verificar. Probá de nuevo.");
        setClaiming(false);
        return;
      }
      router.push(`/validar/${data.token}`);
    } catch {
      setError("Error de conexión. Probá de nuevo.");
      setClaiming(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b border-[#E0E0E0]">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00BBAD]" />
            <span className="font-black text-xl tracking-tight text-[#111]">OH My Chalk!</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 sm:p-8">
          <span className="text-xs font-black bg-[#00BBAD]/10 text-[#009e92] px-3 py-1 rounded-full uppercase tracking-wider">
            Punto de venta
          </span>
          <h1 className="font-black text-2xl text-[#111] mt-3 mb-1">Validá los datos de tu local</h1>
          <p className="text-sm text-[#555] mb-6">
            Buscá tu local por nombre para confirmar que seguís vendiendo Oh My Chalk y
            actualizar tus datos en el mapa.
          </p>

          <div className="relative mb-5">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Empezá a escribir el nombre de tu local…"
              autoFocus
              className="w-full border border-[#E0E0E0] rounded-full pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#00BBAD]"
            />
            {searching && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00BBAD] animate-spin" />
            )}
          </div>

          {searched && matches.length === 0 && (
            <p className="text-sm text-[#777] text-center py-4">
              No encontramos locales con ese nombre. Probá con otra parte del nombre.
            </p>
          )}

          {matches.length > 0 && !selected && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-[#999] uppercase tracking-widest">Elegí tu local</p>
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelected(m); setError(""); }}
                  className="text-left flex items-center justify-between border border-[#E0E0E0] rounded-xl px-4 py-3 hover:border-[#00BBAD] transition-colors"
                >
                  <span>
                    <span className="block font-black text-sm text-[#111]">
                      {m.sucursales[0]?.nombre ?? m.razonSocial}
                    </span>
                    <span className="block text-xs text-[#777]">
                      {[
                        m.sucursales[0]?.localidad,
                        m.sucursales.length > 1 ? `+${m.sucursales.length - 1} sucursal(es)` : null,
                        `(${m.razonSocial})`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <ArrowRight size={16} className="text-[#00BBAD]" />
                </button>
              ))}
            </div>
          )}

          {selected && (
            <form onSubmit={reclamar} className="border border-[#E0E0E0] rounded-xl p-4">
              <p className="font-black text-sm text-[#111] mb-1">{selected.razonSocial}</p>
              <p className="text-xs text-[#777] mb-4">
                Para confirmar que sos vos, ingresá el CUIT o DNI con el que estás registrado.
              </p>
              <input
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                placeholder="CUIT o DNI"
                inputMode="numeric"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00BBAD] mb-3"
              />
              {error && <p className="text-sm text-[#c0392b] mb-3">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setSelected(null); setCuit(""); setError(""); }}
                  className="text-sm font-bold text-[#777] px-4 py-2.5"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={claiming || cuit.trim().length < 7}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#00BBAD] text-white font-black text-sm py-2.5 rounded-full hover:bg-[#009e92] transition-colors disabled:opacity-50"
                >
                  {claiming ? <Loader2 size={16} className="animate-spin" /> : "Continuar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
