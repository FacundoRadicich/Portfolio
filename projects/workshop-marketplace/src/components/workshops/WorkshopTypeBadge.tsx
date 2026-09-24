import { cn } from "@/lib/utils";

type WorkshopType = "TALLER" | "CURSO" | "DEMO" | "ONLINE";

const config: Record<WorkshopType, { label: string; classes: string }> = {
  TALLER:  { label: "Taller",        classes: "bg-[#111111] text-white" },
  CURSO:   { label: "Curso",         classes: "bg-[#00BBAD] text-white" },
  DEMO:    { label: "Demo gratuita", classes: "bg-[#e80c87] text-white" },
  ONLINE:  { label: "Online",        classes: "bg-[#F5F5F5] text-[#333333] border border-[#E0E0E0]" },
};

export function WorkshopTypeBadge({ type, size = "sm" }: { type: WorkshopType; size?: "sm" | "md" }) {
  const { label, classes } = config[type] ?? config.TALLER;
  return (
    <span className={cn(
      "inline-flex items-center font-bold rounded-full",
      size === "sm" ? "text-xs px-2.5 py-0.5" : "text-sm px-3 py-1",
      classes
    )}>
      {label}
    </span>
  );
}
