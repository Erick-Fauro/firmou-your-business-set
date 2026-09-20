import { cn } from "@/lib/utils";

type TimeSlotGridProps = {
  slots: string[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
};

export function TimeSlotGrid({ slots, selectedTime, onSelect }: TimeSlotGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((time) => {
        const selected = selectedTime === time;
        return (
          <button
            key={time}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(time)}
            className={cn(
              "rounded-lg border bg-card py-3 text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-accent bg-secondary/60 text-foreground ring-2 ring-accent/50"
                : "border-border text-foreground hover:border-accent/50",
            )}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}
