"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { PdvAdminCliente } from "@/lib/pdv-admin";

function matches(cliente: PdvAdminCliente, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (cliente.razonSocial.toLowerCase().includes(q)) return true;
  return cliente.sucursales.some(
    (s) =>
      s.nombre.toLowerCase().includes(q) ||
      (s.localidad ?? "").toLowerCase().includes(q)
  );
}

function Bool({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-[#999]">—</span>;
  return value ? (
    <span className="text-[#00BBAD] font-bold">Sí</span>
  ) : (
    <span className="text-[#c0392b]">No</span>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs font-bold text-[#00BBAD] border border-[#00BBAD] rounded-full px-3 py-1.5 hover:bg-[#00BBAD]/5 transition-colors"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}

export function PdvAdminTable({ clientes, baseUrl }: { clientes: PdvAdminCliente[]; baseUrl: string }) {
  const [tab, setTab] = useState<"sin" | "respondieron">("sin");
  const [query, setQuery] = useState("");

  const sinResponder = useMemo(
    () => clientes.filter((c) => !c.validatedAt).filter((c) => matches(c, query)),
    [clientes, query]
  );
  const respondieron = useMemo(
    () => clientes.filter((c) => c.validatedAt).filter((c) => matches(c, query)),
    [clientes, query]
  );

  const visible = tab === "sin" ? sinResponder : respondieron;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab("sin")}
          className={`text-sm font-bold px-4 py-2 rounded-full transition-colors ${
            tab === "sin" ? "bg-[#111] text-white" : "bg-white text-[#555] border border-[#E0E0E0]"
          }`}
        >
          Sin responder ({sinResponder.length})
        </button>
        <button
          onClick={() => setTab("respondieron")}
          className={`text-sm font-bold px-4 py-2 rounded-full transition-colors ${
            tab === "respondieron" ? "bg-[#111] text-white" : "bg-white text-[#555] border border-[#E0E0E0]"
          }`}
        >
          Respondieron ({respondieron.length})
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por comercio o localidad…"
          className="ml-auto border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-[#00BBAD]"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden overflow-x-auto">
        {tab === "sin" ? (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] text-[#999] text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Comercio</th>
                <th className="text-left px-5 py-3">Localidad</th>
                <th className="text-left px-5 py-3">Contacto</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0]">
              {sinResponder.map((c) => (
                <tr key={c.id} className="hover:bg-[#F5F5F5]/50">
                  <td className="px-5 py-3 font-medium text-[#111]">{c.razonSocial}</td>
                  <td className="px-5 py-3 text-[#555]">
                    {[...new Set(c.sucursales.map((s) => s.localidad).filter(Boolean))].join(", ") || "—"}
                  </td>
                  <td className="px-5 py-3 text-[#555]">{c.whatsapp ?? c.phone ?? "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <CopyLinkButton url={`${baseUrl}/validar/${c.validationToken}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] text-[#999] text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Comercio / local</th>
                <th className="text-left px-5 py-3">Exhib. pie</th>
                <th className="text-left px-5 py-3">Exhib. mostrador</th>
                <th className="text-left px-5 py-3">Muestras pintadas</th>
                <th className="text-left px-5 py-3">Muestrario actualizado</th>
                <th className="text-left px-5 py-3">Comentarios</th>
                <th className="text-left px-5 py-3">Respondió</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0]">
              {respondieron.flatMap((c) =>
                c.sucursales.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F5F5F5]/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#111]">{c.razonSocial}</p>
                      <p className="text-xs text-[#999]">{s.nombre} — {s.localidad ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3"><Bool value={s.exhibidorPie} /></td>
                    <td className="px-5 py-3"><Bool value={s.exhibidorMostrador} /></td>
                    <td className="px-5 py-3"><Bool value={s.muestrasPintadas} /></td>
                    <td className="px-5 py-3"><Bool value={s.muestrarioActualizado} /></td>
                    <td className="px-5 py-3 text-xs text-[#555] max-w-[220px] truncate" title={s.comentarios ?? ""}>
                      {s.comentarios || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#999]">
                      {c.validatedAt ? new Date(c.validatedAt).toLocaleDateString("es-AR") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        {visible.length === 0 && (
          <p className="text-center text-sm text-[#999] py-10">Sin resultados.</p>
        )}
      </div>
    </div>
  );
}
