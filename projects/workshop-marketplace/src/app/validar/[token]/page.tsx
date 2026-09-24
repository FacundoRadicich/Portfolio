import type { Metadata } from "next";
import Link from "next/link";
import { getClienteByToken } from "@/lib/validar";
import { ValidarForm } from "@/components/pdv/ValidarForm";

export const metadata: Metadata = {
  title: "Validá tu local — Oh My Chalk!",
  robots: { index: false, follow: false },
};

export default async function ValidarTokenPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  const cliente = await getClienteByToken(token);

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
        {cliente ? (
          <ValidarForm cliente={cliente} token={token} />
        ) : (
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 text-center">
            <h1 className="font-black text-xl text-[#111] mb-2">Link inválido o vencido</h1>
            <p className="text-sm text-[#555] mb-6">
              No encontramos un local con este link. Puede que haya cambiado o que el link esté
              incompleto. Buscá tu local manualmente para validarlo.
            </p>
            <Link
              href="/validar"
              className="inline-block bg-[#00BBAD] text-white font-black text-sm px-6 py-3 rounded-full hover:bg-[#009e92] transition-colors"
            >
              Buscar mi local
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
