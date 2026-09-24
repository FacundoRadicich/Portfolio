import type { Tier } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  tier: Tier;
  size?: "sm" | "md";
  showLabel?: boolean;
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

export function TierBadge({ tier, size = "sm", showLabel = false }: Props) {
  const dotSize = size === "md" ? "w-3 h-3" : "w-2 h-2";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("rounded-full shrink-0", dotSize, tierDot[tier])} />
      {showLabel && (
        <span className="text-xs font-bold text-[#333333]">{tierLabel[tier]}</span>
      )}
    </span>
  );
}
