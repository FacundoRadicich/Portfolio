"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { PROVINCES } from "@/types";

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  currentFilters: {
    province?: string;
    category?: string;
    month?: string;
    tier?: string;
  };
};

export function WorkshopFilters({ categories, currentFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = () => router.push(pathname);

  const hasFilters = Object.values(currentFilters).some(Boolean);

  // Generate next 6 months for date filter
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
    };
  });

  const selectClass =
    "text-sm border border-[var(--color-chalk-sand)] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[var(--color-chalk-terracotta)] text-[var(--color-chalk-charcoal)]";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={currentFilters.province ?? ""}
        onChange={(e) => updateFilter("province", e.target.value)}
        className={selectClass}
        aria-label="Filtrar por provincia"
      >
        <option value="">Todas las provincias</option>
        {PROVINCES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        value={currentFilters.category ?? ""}
        onChange={(e) => updateFilter("category", e.target.value)}
        className={selectClass}
        aria-label="Filtrar por categoría"
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={currentFilters.month ?? ""}
        onChange={(e) => updateFilter("month", e.target.value)}
        className={selectClass}
        aria-label="Filtrar por mes"
      >
        <option value="">Cualquier fecha</option>
        {months.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <select
        value={currentFilters.tier ?? ""}
        onChange={(e) => updateFilter("tier", e.target.value)}
        className={selectClass}
        aria-label="Filtrar por nivel de profesora"
      >
        <option value="">Todas las profesoras</option>
        <option value="EMBAJADORA">✦ Embajadoras</option>
        <option value="INSTRUCTORA">◆ Instructoras</option>
        <option value="COLABORADORA">● Colaboradoras</option>
      </select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-[var(--color-chalk-terracotta)] hover:underline"
        >
          Limpiar filtros ✕
        </button>
      )}
    </div>
  );
}
