import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PublicProfessional } from "@/lib/public-booking";

type ProfessionalCardProps = {
  professional: PublicProfessional;
  selected: boolean;
  onSelect: (professionalId: string) => void;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function ProfessionalCard({
  professional,
  selected,
  onSelect,
}: ProfessionalCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(professional.id)}
      aria-pressed={selected}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-accent ring-2 ring-accent/50 bg-secondary/60"
          : "border-border hover:border-accent/50",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
        {initials(professional.name) || "?"}
      </span>

      <span className="font-display text-base text-foreground">
        {professional.name}
      </span>

      {selected && (
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
