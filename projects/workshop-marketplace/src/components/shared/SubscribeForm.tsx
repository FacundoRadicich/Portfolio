"use client";

import { useState } from "react";

type Props = {
  variant?: "footer" | "modal" | "inline";
};

export function SubscribeForm({ variant = "inline" }: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      city: formData.get("city") as string,
    };

    const res = await fetch("/api/suscriptoras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setStep("success");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
    }
    setLoading(false);
  }

  if (step === "success") {
    return (
      <p className="text-sm font-black text-white">
        ¡Gracias! Te avisamos cuando haya talleres cerca tuyo. 🎨
      </p>
    );
  }

  const isFooter = variant === "footer";

  const inputClass = isFooter
    ? "w-full bg-white text-[#111111] placeholder-[#999999] font-bold rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
    : "w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00BBAD] bg-white";

  const btnClass = isFooter
    ? "w-full bg-[#111111] hover:bg-[#333333] text-white text-sm font-black py-2.5 rounded-lg transition-colors disabled:opacity-60"
    : "w-full bg-[#00BBAD] hover:bg-[#009e92] text-white text-sm font-black py-2.5 rounded-lg transition-colors disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="name" required placeholder="Tu nombre" className={inputClass} />
      <input name="email" type="email" required placeholder="tu@email.com" className={inputClass} />
      <input name="phone" type="tel" required placeholder="WhatsApp" className={inputClass} />
      <input name="city" required placeholder="Tu localidad" className={inputClass} />
      {error && <p className={`text-xs font-bold ${isFooter ? "text-white/80" : "text-red-500"}`}>{error}</p>}
      <button type="submit" disabled={loading} className={btnClass}>
        {loading ? "Enviando..." : "Registrarme"}
      </button>
    </form>
  );
}
