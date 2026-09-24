"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, LocateFixed, Star } from "lucide-react";
import {
  type PdvPin,
  type PdvCategoria,
  CATEGORIA_LABEL,
  CATEGORIA_COLOR,
} from "@/lib/pdv-types";
import { track } from "@/lib/track-client";

const CATEGORIAS = Object.keys(CATEGORIA_LABEL) as PdvCategoria[];
const LIST_LIMIT = 80;

function strip(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function waLink(num: string, msg?: string): string {
  const d = num.replace(/\D/g, "");
  const q = msg ? `?text=${encodeURIComponent(msg)}` : "";
  return `https://wa.me/${d}${q}`;
}

function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function popupNode(p: PdvPin): HTMLElement {
  const el = document.createElement("div");
  el.style.minWidth = "190px";
  const color = CATEGORIA_COLOR[p.categoria];
  const partes = [p.address, p.localidad, p.provincia].filter(Boolean).join(", ");
  el.innerHTML = `
    <div style="font-weight:700;font-size:14px;color:#111;margin-bottom:2px">${esc(p.nombre)}</div>
    <div style="font-size:12px;color:${color};font-weight:700;margin-bottom:4px">● ${CATEGORIA_LABEL[p.categoria]}</div>
    <div style="font-size:12px;color:#555;margin-bottom:8px">${esc(partes)}</div>
    ${p.horario ? `<div style="font-size:11px;color:#777;margin-bottom:8px">🕑 ${esc(p.horario)}</div>` : ""}
    <div data-actions style="display:flex;flex-wrap:wrap;gap:6px"></div>
  `;
  const actions = el.querySelector("[data-actions]") as HTMLElement;

  const btn = (label: string, bg: string, fg: string, onClick: () => void) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = `cursor:pointer;border:none;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700;background:${bg};color:${fg}`;
    b.addEventListener("click", onClick);
    actions.appendChild(b);
  };

  const waNum = p.whatsapp ?? p.phone;
  if (waNum)
    btn("WhatsApp", "#25d366", "#fff", () => {
      track("whatsapp_click", { sucursalId: p.id, localidad: p.localidad ?? undefined });
      const msg = `¡Hola ${p.nombre}! Los encontré en el mapa de Oh My Chalk 🎨 ¿Tienen stock disponible?`;
      window.open(waLink(waNum, msg), "_blank", "noopener,noreferrer");
    });
  if (p.tiendaOnline)
    btn("Tienda online", "#e80c87", "#fff", () => {
      track("tienda_click", { sucursalId: p.id });
      window.open(p.tiendaOnline!, "_blank", "noopener,noreferrer");
    });
  if (p.web && !p.tiendaOnline)
    btn("Web", "#00BBAD", "#04342C", () => {
      track("web_click", { sucursalId: p.id });
      window.open(p.web!, "_blank", "noopener,noreferrer");
    });
  if (p.instagram)
    btn("Instagram", "#F1EFE8", "#111", () => {
      track("instagram_click", { sucursalId: p.id });
      window.open(p.instagram!, "_blank", "noopener,noreferrer");
    });
  if (p.lat != null && p.lng != null)
    btn("Cómo llegar", "#F1EFE8", "#111", () => {
      window.open(mapsLink(p.lat!, p.lng!), "_blank", "noopener,noreferrer");
    });

  return el;
}

export function MapaExplorer({ pdvs }: { pdvs: PdvPin[] }) {
  const [query, setQuery] = useState("");
  const [cats, setCats] = useState<Set<PdvCategoria>>(new Set(CATEGORIAS));
  const [provincia, setProvincia] = useState("");
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const provincias = useMemo(
    () =>
      Array.from(new Set(pdvs.map((p) => p.provincia).filter(Boolean) as string[])).sort(
        (a, b) => a.localeCompare(b)
      ),
    [pdvs]
  );

  const visible = useMemo(() => {
    const q = strip(query.trim());
    const filtered = pdvs.filter((p) => {
      if (!cats.has(p.categoria)) return false;
      if (provincia && p.provincia !== provincia) return false;
      if (q && !strip(`${p.nombre} ${p.localidad ?? ""} ${p.provincia ?? ""}`).includes(q))
        return false;
      return true;
    });
    filtered.sort((a, b) => {
      if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
      if (userPos && a.lat != null && b.lat != null) {
        return (
          haversine(userPos, [a.lat, a.lng!]) - haversine(userPos, [b.lat, b.lng!])
        );
      }
      return (a.provincia ?? "").localeCompare(b.provincia ?? "") || a.nombre.localeCompare(b.nombre);
    });
    return filtered;
  }, [pdvs, query, cats, provincia, userPos]);

  // Init mapa (una vez)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (cancelled || !mapEl.current) return;
      const map = L.map(mapEl.current, { scrollWheelZoom: false }).setView([-38.4, -63.6], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      const cluster = (L as any).markerClusterGroup({ maxClusterRadius: 50 });
      map.addLayer(cluster);
      LRef.current = L;
      mapRef.current = map;
      clusterRef.current = cluster;
      setTimeout(() => map.invalidateSize(), 100);
      renderMarkers();
      const focusId = new URLSearchParams(window.location.search).get("focus");
      if (focusId) {
        const target = pdvs.find((x) => x.id === focusId && x.lat != null);
        if (target) setTimeout(() => flyTo(target), 600);
      }
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redibujar markers cuando cambian los filtros
  useEffect(() => {
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function renderMarkers() {
    const L = LRef.current;
    const cluster = clusterRef.current;
    if (!L || !cluster) return;
    cluster.clearLayers();
    const markers: any[] = [];
    for (const p of visible) {
      if (p.lat == null || p.lng == null) continue;
      const color = CATEGORIA_COLOR[p.categoria];
      const size = p.destacado ? 20 : 15;
      const ring = p.destacado ? "#BA7517" : "#fff";
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${ring};box-shadow:0 0 0 1px rgba(0,0,0,.25)"></span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const m = L.marker([p.lat, p.lng], { icon });
      m.bindPopup(() => popupNode(p));
      (m as any)._pdvId = p.id;
      markers.push(m);
    }
    cluster.addLayers(markers);
  }

  function flyTo(p: PdvPin) {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || p.lat == null || p.lng == null) return;
    map.flyTo([p.lat, p.lng], 14, { duration: 0.6 });
    const target = cluster.getLayers().find((m: any) => m._pdvId === p.id);
    if (target) cluster.zoomToShowLayer(target, () => target.openPopup());
  }

  function toggleCat(c: PdvCategoria) {
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next.size === 0 ? new Set(CATEGORIAS) : next;
    });
  }

  function geolocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  // Track de búsqueda (debounced)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const t = setTimeout(() => {
      track("search", { query: q, resultsCount: visible.length });
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const conCoords = visible.filter((p) => p.lat != null).length;

  return (
    <div className="grid lg:grid-cols-[1fr_minmax(320px,420px)] gap-4">
      {/* Mapa */}
      <div className="order-2 lg:order-1">
        <div
          ref={mapEl}
          className="w-full h-[420px] lg:h-[640px] rounded-2xl border border-[#E0E0E0] overflow-hidden z-0"
        />
      </div>

      {/* Panel */}
      <div className="order-1 lg:order-2 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o localidad…"
              className="w-full border border-[#E0E0E0] rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#00BBAD]"
            />
          </div>
          <button
            onClick={geolocate}
            title="Usar mi ubicación"
            className={`shrink-0 flex items-center gap-1 border rounded-full px-3 py-2.5 text-xs font-black transition-colors ${
              userPos
                ? "bg-[#00BBAD] text-white border-[#00BBAD]"
                : "border-[#E0E0E0] text-[#333] hover:border-[#00BBAD]"
            }`}
          >
            <LocateFixed size={15} /> Cerca
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIAS.map((c) => {
            const on = cats.has(c);
            return (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-opacity"
                style={{
                  borderColor: CATEGORIA_COLOR[c],
                  color: on ? "#fff" : CATEGORIA_COLOR[c],
                  background: on ? CATEGORIA_COLOR[c] : "transparent",
                  opacity: on ? 1 : 0.55,
                }}
              >
                {CATEGORIA_LABEL[c]}
              </button>
            );
          })}
        </div>

        <select
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
          className="border border-[#E0E0E0] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#00BBAD]"
        >
          <option value="">Todas las provincias</option>
          {provincias.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <p className="text-xs text-[#777] font-bold">
          {visible.length} puntos de venta{conCoords < visible.length ? ` · ${conCoords} en el mapa` : ""}
        </p>

        <div className="flex flex-col gap-2 lg:overflow-y-auto lg:max-h-[480px] pr-1">
          {visible.slice(0, LIST_LIMIT).map((p) => (
            <button
              key={p.id}
              onClick={() => flyTo(p)}
              className="text-left bg-white border border-[#E0E0E0] rounded-xl p-3 hover:border-[#00BBAD] transition-colors"
              style={{ borderLeft: `3px solid ${CATEGORIA_COLOR[p.categoria]}` }}
            >
              <div className="flex items-center gap-1.5">
                {p.destacado && <Star size={13} className="text-[#BA7517] shrink-0" fill="#BA7517" />}
                <span className="font-black text-sm text-[#111] leading-tight">{p.nombre}</span>
              </div>
              <span className="block text-xs text-[#777] mt-0.5">
                {[p.address, p.localidad, p.provincia].filter(Boolean).join(", ")}
              </span>
              {userPos && p.lat != null && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#00BBAD] font-bold mt-1">
                  <MapPin size={11} />
                  {Math.round(haversine(userPos, [p.lat, p.lng!]))} km
                </span>
              )}
            </button>
          ))}
          {visible.length > LIST_LIMIT && (
            <p className="text-xs text-[#999] text-center py-2">
              Mostrando {LIST_LIMIT} de {visible.length}. Refiná la búsqueda o el filtro.
            </p>
          )}
          {visible.length === 0 && (
            <p className="text-sm text-[#777] text-center py-6">
              No encontramos puntos de venta con esos filtros.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
