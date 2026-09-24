import { getPdvAdminList } from "@/lib/pdv-admin";
import { PdvAdminTable } from "@/components/pdv/PdvAdminTable";

export default async function AdminPdvPage() {
  const clientes = await getPdvAdminList();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const sinResponder = clientes.filter((c) => !c.validatedAt).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-chalk-espresso)]">Puntos de venta</h1>
        <p className="text-sm text-[var(--color-chalk-charcoal)]/50 mt-1">
          {clientes.length} comercios activos · {sinResponder} sin responder la validación
        </p>
      </div>
      <PdvAdminTable clientes={clientes} baseUrl={baseUrl} />
    </div>
  );
}
