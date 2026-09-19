import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDuration, formatPrice } from "@/lib/services";
import type { PublicService } from "@/lib/public-booking";

type ServiceCardProps = {
  service: PublicService;
  selected: boolean;
  onSelect: (serviceId: string) => void;
};

export function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service.id)}
      aria-pressed={selected}
      className={cn(
        "relative w-full rounded-xl border bg-card p-4 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-accent ring-2 ring-accent/50 bg-secondary/60"
          : "border-border hover:border-accent/50",
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}

      <h3 className="pr-8 font-display text-base text-foreground">
        {service.name}
      </h3>

      {service.description && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {service.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="font-medium text-foreground">
          {formatPrice(Number(service.price))}
        </span>
        <span
          className="text-muted-foreground"
          aria-label={`Duração: ${formatDuration(service.duration_minutes)}`}
        >
          {formatDuration(service.duration_minutes)}
        </span>
      </div>
    </button>
  );
}
