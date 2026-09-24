// @ts-nocheck
import { getCategories } from "@/lib/db";
import { createCategory, deleteCategory } from "@/lib/actions";
import { supabaseAdmin } from "@/lib/supabase";

async function getCategoriesWithCount() {
  const { data } = await supabaseAdmin
    .from('Category')
    .select('*, workshops:CategoriesOnWorkshops(count)')
    .order('name', { ascending: true });
  return data ?? [];
}

export default async function AdminCategoriasPage() {
  const categories = await getCategoriesWithCount();

  return (
    <div className="p-8 max-w-lg">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)] mb-8">Categorías</h1>

      <form action={createCategory} className="flex gap-3 mb-8">
        <input name="name" required placeholder="Nueva categoría..."
          className="flex-1 border border-[var(--color-chalk-sand)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-chalk-terracotta)]" />
        <button type="submit"
          className="bg-[var(--color-chalk-terracotta)] hover:bg-[var(--color-chalk-terracotta-dark)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Agregar
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-[var(--color-chalk-sand)] divide-y divide-[var(--color-chalk-sand)]">
        {categories.map((c: any) => {
          const count = Array.isArray(c.workshops) ? c.workshops[0]?.count ?? 0 : 0;
          return (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <span className="font-medium text-[var(--color-chalk-espresso)]">{c.name}</span>
                <span className="text-xs text-[var(--color-chalk-charcoal)]/40 ml-2">{count} taller{count !== 1 ? "es" : ""}</span>
              </div>
              {count === 0 && (
                <form action={deleteCategory.bind(null, c.id)}>
                  <button type="submit" className="text-xs text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                </form>
              )}
            </div>
          );
        })}
        {categories.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-[var(--color-chalk-charcoal)]/40">No hay categorías todavía.</p>
        )}
      </div>
    </div>
  );
}
