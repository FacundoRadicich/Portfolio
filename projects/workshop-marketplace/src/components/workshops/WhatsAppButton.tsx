"use client";

import { MessageCircle } from "lucide-react";

type Props = {
  url: string;
  workshopId: string;
  label?: string;
  size?: "md" | "lg";
};

export function WhatsAppButton({ url, workshopId, label = "Reservar por WhatsApp", size = "lg" }: Props) {
  async function handleClick() {
    // Track el click general
    fetch("/api/talleres/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workshopId }),
    }).catch(() => {});
    // Registrar asistencia si está logueada
    fetch("/api/user/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workshopId }),
    }).catch(() => {});
    // Abrir WhatsApp
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#1ebe57] text-white font-black transition-colors rounded-full ${size === "lg" ? "py-4 text-base" : "py-2.5 text-sm"}`}
    >
      <MessageCircle size={size === "lg" ? 20 : 16} />
      {label}
    </button>
  );
}
