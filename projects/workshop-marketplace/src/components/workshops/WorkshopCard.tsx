"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, Users } from "lucide-react";
import { WorkshopTypeBadge } from "./WorkshopTypeBadge";
import { TierBadge } from "@/components/professors/TierBadge";
import { FavoriteButton } from "./FavoriteButton";
import { formatPrice, formatDateShort, isPast } from "@/lib/utils";

type Workshop = {
  id: string; slug: string; title: string; photoUrl: string
  date: string; duration: string; price?: number | null; city: string; province: string
  maxSpots?: number | null; clickCount?: number; active: boolean
  workshopType?: string
  professor: { name: string; tier: string; photoUrl: string }
  categories: { category: { name: string } }[]
}

const typeBottomAccent: Record<string, string> = {
  TALLER:  "border-b-4 border-b-[#111111]",
  CURSO:   "border-b-4 border-b-[#00BBAD]",
  DEMO:    "border-b-4 border-b-[#e80c87]",
  ONLINE:  "border-b-4 border-b-[#888888]",
}

export function WorkshopCard({ workshop }: { workshop: Workshop }) {
  const past = isPast(workshop.date);
  const isPopular = (workshop.clickCount ?? 0) >= 5;
  const isFree = !workshop.price || workshop.price === 0;
  const type = workshop.workshopType ?? "TALLER";
  const bottomAccent = typeBottomAccent[type] ?? typeBottomAccent.TALLER;

  return (
    <Link href={`/talleres/${workshop.slug}`}
      className={`group block bg-white rounded-2xl overflow-hidden border border-[#E0E0E0] hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 ${bottomAccent}`}>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F5]">
        <Image
          src={workshop.photoUrl} alt={workshop.title} fill
          className={`object-cover object-top group-hover:scale-[1.04] transition-transform duration-500 ${past ? "grayscale opacity-50" : ""}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Top overlays */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <WorkshopTypeBadge type={type as any} />
          {isPopular && (
            <span className="text-xs font-black bg-white text-[#e80c87] px-2.5 py-0.5 rounded-full shadow-sm">
              🔥 Popular
            </span>
          )}
        </div>
        {/* Favorito */}
        {!past && (
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {isFree && (
              <span className="text-xs font-black bg-[#e80c87] text-white px-2.5 py-0.5 rounded-full">GRATIS</span>
            )}
            <FavoriteButton workshopId={workshop.id} />
          </div>
        )}
        {!isFree && past && (
          <div className="absolute top-3 right-3" />
        )}
        {past && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-black tracking-wider uppercase text-[#888888]">Realizado</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 pt-3.5">
        <h3 className="font-black text-[15px] text-[#111111] leading-snug line-clamp-2 mb-3">{workshop.title}</h3>

        {/* Professor */}
        <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-[#F0F0F0]">
          <TierBadge tier={workshop.professor.tier as any} size="sm" />
          <span className="text-xs font-bold text-[#555555]">{workshop.professor.name}</span>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-[11px] text-[#888888] font-bold">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-[#BBBBBB]" />
            {workshop.city}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} className="text-[#BBBBBB]" />
            {formatDateShort(workshop.date)}
            {workshop.duration && <span className="text-[#CCCCCC] ml-1">· {workshop.duration}</span>}
          </span>
          {workshop.maxSpots && (
            <span className="flex items-center gap-1">
              <Users size={11} className="text-[#BBBBBB]" />
              {workshop.maxSpots}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          {isFree ? (
            <span className="text-base font-black text-[#00BBAD]">Gratuito</span>
          ) : workshop.price ? (
            <span className="text-base font-black text-[#111111]">{formatPrice(workshop.price)}</span>
          ) : <span />}
          <span className="text-xs font-black text-[#00BBAD] opacity-0 group-hover:opacity-100 transition-opacity">
            Ver más →
          </span>
        </div>
      </div>
    </Link>
  );
}
