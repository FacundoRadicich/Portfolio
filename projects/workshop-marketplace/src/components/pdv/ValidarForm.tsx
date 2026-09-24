"use client";

import { useState } from "react";
import { Plus, Trash2, Check, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { PROVINCES } from "@/types";
import type { ClienteEdit, SucursalEdit } from "@/lib/validar";

const TIPOS = ["Librería/Artística", "Pinturería", "Taller", "Ferretería", "Otro"];

type ExposicionKey = "exhibidorPie" | "exhibidorMostrador" | "muestrasPintadas" | "muestrarioActualizado";

const EXPOSICION_FIELDS: { key: ExposicionKey; label: string }[] = [
  { key: "exhibidorPie", label: "Exhibidor de pie" },
  { key: "exhibidorMostrador", label: "Exhibidor de mostrador" },
  { key: "muestrasPintadas", label: "Tiene muestras pintadas" },
  { key: "muestrarioActualizado", label: "Muestrario actualizado (paleta nueva)" },
];

function SiNoToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  const base = "flex-1 text-xs font-bold py-2 rounded-lg border transition-colors";
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`${base} ${value === true ? "bg-[#00BBAD] text-white border-[#00BBAD]" : "border-[#E0E0E0] text-[#555] hover:border-[#00BBAD]"}`}
      >
        Sí
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`${base} ${value === false ? "bg-[#c0392b] text-white border-[#c0392b]" : "border-[#E0E0E0] text-[#555] hover:border-[#c0392b]"}`}
      >
        No
      </button>
    </div>
  );
}

const inputClass =
  "w-full border border-[#E0E0E0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00BBAD]";
const labelClass = "text-xs font-bold text-[#555] block mb-1";

function emptySucursal(): SucursalEdit {
  return {
    id: null,
    nombre: "",
    tipo: "Librería/Artística",
    phone: null,
    whatsapp: null,
    address: null,
    localidad: null,
    provincia: null,
    horario: null,
    descripcion: null,
    exhibidorPie: null,
    exhibidorMostrador: null,
    muestrasPintadas: null,
    muestrarioActualizado: null,
    comentarios: null,
  };
}

export function ValidarForm({ cliente, token }: { cliente: ClienteEdit; token: string }) {
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp ?? "");
  const [phone, setPhone] = useState(cliente.phone ?? "");
  const [email, setEmail] = useState(cliente.email ?? "");
  const [instagram, setInstagram] = useState(cliente.instagram ?? "");
  const [tiendaOnline, setTiendaOnline] = useState(cliente.tiendaOnline ?? "");
  const [web, setWeb] = useState(cliente.web ?? "");
  const [sucursales, setSucursales] = useState<SucursalEdit[]>(
    cliente.sucursales.length ? cliente.sucursales : [emptySucursal()]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"alta" | "baja" | null>(null);

  function updateSucursal(i: number, field: keyof SucursalEdit, value: string) {
    setSucursales((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );
  }

  function setSucursalBool(i: number, field: ExposicionKey, value: boolean) {
    setSucursales((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );
  }

  function addSucursal() {
    setSucursales((prev) => [...prev, emptySucursal()]);
  }

  function removeSucursal(i: number) {
    setSucursales((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(sigueVendiendo: boolean) {
    setError("");
    if (sigueVendiendo && sucursales.some((s) => !s.nombre.trim())) {
      setError("Cada sucursal necesita un nombre.");
      return;
    }
    if (
      sigueVendiendo &&
      sucursales.some((s) =>
        EXPOSICION_FIELDS.some(({ key }) => s[key] === null)
      )
    ) {
      setError("Respondé sí/no en cada pregunta de exposición para cada local.");
      return;
    }
    if (!sigueVendiendo && !confirm("¿Confirmás que ya no vendés Oh My Chalk? Tu local saldrá del mapa."))
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/validar/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sigueVendiendo,
          whatsapp,
          phone,
          email,
          instagram,
          tiendaOnline,
          web,
          sucursales,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos guardar. Probá de nuevo.");
        setLoading(false);
        return;
      }
      setDone(sigueVendiendo ? "alta" : "baja");
    } catch {
      setError("Error de conexión. Probá de nuevo.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#00BBAD]/10 flex items-center justify-center mx-auto mb-4">
          <Check className="text-[#00BBAD]" size={28} />
        </div>
        <h2 className="font-black text-xl text-[#111] mb-2">
          {done === "alta" ? "¡Gracias! Datos actualizados" : "Listo, te dimos de baja"}
        </h2>
        <p className="text-sm text-[#555] mb-6">
          {done === "alta"
            ? "Tu local ya figura actualizado en el mapa de puntos de venta."
            : "Tu local ya no aparece en el mapa. Si fue un error, escribinos."}
        </p>
        {done === "alta" && (
          <Link
            href={
              cliente.sucursales[0]?.id
                ? `/donde-comprar?focus=${cliente.sucursales[0].id}`
                : "/donde-comprar"
            }
            className="inline-block bg-[#00BBAD] text-white font-black text-sm px-6 py-3 rounded-full hover:bg-[#009e92] transition-colors"
          >
            Ver mi local en el mapa
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 sm:p-8">
      <div className="mb-6">
        <span className="text-xs font-black bg-[#00BBAD]/10 text-[#009e92] px-3 py-1 rounded-full uppercase tracking-wider">
          Validá tu local
        </span>
        <h1 className="font-black text-2xl text-[#111] mt-3">{cliente.razonSocial}</h1>
        <p className="text-sm text-[#555] mt-1">
          Revisá que esté todo bien y confirmá. Tarda 1 minuto.
        </p>
      </div>

      {/* Contacto */}
      <p className="text-xs font-black text-[#999] uppercase tracking-widest mb-3">
        Contacto (un WhatsApp para todas tus sucursales)
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <div>
          <label className={labelClass}>WhatsApp</label>
          <input className={inputClass} maxLength={40} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 11 5555 5555" />
        </div>
        <div>
          <label className={labelClass}>Teléfono</label>
          <input className={inputClass} maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Instagram</label>
          <input className={inputClass} maxLength={160} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@tulocal o link" />
        </div>
        <div>
          <label className={labelClass}>Tienda online</label>
          <input className={inputClass} maxLength={200} value={tiendaOnline} onChange={(e) => setTiendaOnline(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Web</label>
          <input className={inputClass} maxLength={200} value={web} onChange={(e) => setWeb(e.target.value)} />
        </div>
      </div>

      {/* Sucursales */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black text-[#999] uppercase tracking-widest">
          Tus sucursales (cada una es un punto en el mapa)
        </p>
        <button onClick={addSucursal} className="flex items-center gap-1 text-xs font-bold text-[#00BBAD] border border-[#00BBAD] rounded-full px-3 py-1.5 hover:bg-[#00BBAD]/5">
          <Plus size={14} /> Agregar
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {sucursales.map((s, i) => (
          <div key={s.id ?? `new-${i}`} className="border border-[#E0E0E0] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-sm font-black text-[#111]">
                <MapPin size={15} className="text-[#00BBAD]" />
                Sucursal {i + 1}
              </span>
              {sucursales.length > 1 && (
                <button onClick={() => removeSucursal(i)} className="text-[#c0392b] hover:text-[#a93226]" aria-label="Quitar sucursal">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nombre del local *</label>
                <input className={inputClass} maxLength={120} value={s.nombre} onChange={(e) => updateSucursal(i, "nombre", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Tipo de local</label>
                <select className={inputClass} value={s.tipo} onChange={(e) => updateSucursal(i, "tipo", e.target.value)}>
                  {!TIPOS.includes(s.tipo) && <option value={s.tipo}>{s.tipo}</option>}
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Localidad</label>
                <input className={inputClass} maxLength={80} value={s.localidad ?? ""} onChange={(e) => updateSucursal(i, "localidad", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>WhatsApp de esta sucursal</label>
                <input className={inputClass} maxLength={40} value={s.whatsapp ?? ""} onChange={(e) => updateSucursal(i, "whatsapp", e.target.value)} placeholder="Para hablar con el responsable" />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input className={inputClass} maxLength={40} value={s.phone ?? ""} onChange={(e) => updateSucursal(i, "phone", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Dirección</label>
                <input className={inputClass} maxLength={250} value={s.address ?? ""} onChange={(e) => updateSucursal(i, "address", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Provincia</label>
                <select className={inputClass} value={s.provincia ?? ""} onChange={(e) => updateSucursal(i, "provincia", e.target.value)}>
                  <option value="">—</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Horario</label>
                <input className={inputClass} maxLength={200} value={s.horario ?? ""} onChange={(e) => updateSucursal(i, "horario", e.target.value)} placeholder="Lun a Sáb 9–13 y 16–20" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E0E0E0]">
              <p className={labelClass}>Exposición en el local *</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {EXPOSICION_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-xs text-[#333] mb-1">{label}</p>
                    <SiNoToggle value={s[key]} onChange={(v) => setSucursalBool(i, key, v)} />
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <label className={labelClass}>Comentarios (opcional)</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  maxLength={500}
                  value={s.comentarios ?? ""}
                  onChange={(e) => updateSucursal(i, "comentarios", e.target.value)}
                  placeholder="Algo que no te preguntamos y quieras contarnos"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-[#c0392b] bg-[#c0392b]/5 border border-[#c0392b]/20 rounded-lg px-4 py-3 mb-4">
          {error}
        </p>
      )}

      <button
        onClick={() => submit(true)}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#00BBAD] text-white font-black py-4 rounded-full hover:bg-[#009e92] transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        Sí, sigo vendiendo Oh My Chalk
      </button>
      <button
        onClick={() => submit(false)}
        disabled={loading}
        className="w-full text-sm font-bold text-[#c0392b] py-3 mt-2 hover:underline disabled:opacity-60"
      >
        Ya no vendo OMC — darme de baja
      </button>
      <p className="text-center text-xs text-[#999] mt-3">
        Al confirmar, tu local queda actualizado en el mapa al instante.
      </p>
    </div>
  );
}
