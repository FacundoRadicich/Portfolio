import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Tier } from "@/types";

type Professor = {
  id: string; slug: string; name: string; photoUrl: string
  tier: Tier; city: string; province: string; specialties: string[]
}

const tierAccent: Record<Tier, string> = {
  EMBAJADORA:  "border-t-4 border-t-[#e80c87]",
  INSTRUCTORA: "border-t-4 border-t-[#00BBAD]",
  COLABORADORA:"border-t-4 border-t-[#111111]",
};

const tierDot: Record<Tier, string> = {
  EMBAJADORA:  "bg-[#e80c87]",
  INSTRUCTORA: "bg-[#00BBAD]",
  COLABORADORA:"bg-[#111111]",
};

const tierLabel: Record<Tier, string> = {
  EMBAJADORA:  "Embajadora",
  INSTRUCTORA: "Instructora",
  COLABORADORA:"Colaboradora",
};

export function ProfessorCard({ professor }: { professor: Professor }) {
  return (
    <Link href={`/profesoras/${professor.slug}`}
      className={`group block bg-white rounded-2xl overflow-hidden border border-[#E0E0E0] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${tierAccent[professor.tier]}`}>
      <div className="relative aspect-square overflow-hidden bg-[#F5F5F5]">
        <Image
          src={professor.photoUrl} alt={professor.name} fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      <div className="p-4">
        {/* Tier label */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-2 h-2 rounded-full shrink-0 ${tierDot[professor.tier]}`} />
          <span className="text-xs font-black uppercase tracking-wider text-[#888888]">
            {tierLabel[professor.tier]}
          </span>
        </div>

        <h3 className="font-black text-base text-[#111111] leading-tight">{professor.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-[#888888]">
          <MapPin size={11} className="text-[#AAAAAA] shrink-0" />
          <span>{professor.city}, {professor.province}</span>
        </div>
        {professor.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {professor.specialties.slice(0, 3).map((s) => (
              <span key={s} className="text-xs bg-[#F5F5F5] border border-[#E8E8E8] px-2 py-0.5 rounded-full text-[#555555] font-bold">{s}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
