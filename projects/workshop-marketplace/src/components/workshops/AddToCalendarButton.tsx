"use client";

import { CalendarPlus } from "lucide-react";

type Props = {
  title: string;
  date: string;
  duration: string;
  city: string;
  description: string;
};

export function AddToCalendarButton({ title, date, duration, city, description }: Props) {
  function handleClick() {
    const start = new Date(date);
    // Parse duration like "3 horas" → add hours
    const hours = parseInt(duration) || 2;
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${title} — OH My Chalk!`,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: description,
      location: city,
    });

    window.open(`https://calendar.google.com/calendar/render?${params}`, "_blank");
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 border border-[#E0E0E0] text-[#333333] font-bold text-sm py-2.5 rounded-full hover:border-[#00BBAD] hover:text-[#00BBAD] transition-colors"
    >
      <CalendarPlus size={15} />
      Agregar a Google Calendar
    </button>
  );
}
