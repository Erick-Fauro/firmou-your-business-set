import { cn } from "@/lib/utils";
import {
  formatDayNumber,
  formatMonthShort,
  weekdayLabel,
  type CalendarDay,
} from "@/lib/availability";

type DateStripProps = {
  days: CalendarDay[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
};

export function DateStrip({ days, selectedDate, onSelect }: DateStripProps) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-2">
      <div className="flex gap-2">
        {days.map((day) => {
          const selected = selectedDate === day.date;
          return (
            <button
              key={day.date}
              type="button"
              disabled={!day.available}
              aria-pressed={selected}
              onClick={() => onSelect(day.date)}
              className={cn(
                "flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl border bg-card py-3 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-accent ring-2 ring-accent/50 bg-secondary/60"
                  : "border-border hover:border-accent/50",
                !day.available && "cursor-not-allowed opacity-40 hover:border-border",
              )}
            >
              <span className="text-xs text-muted-foreground">
                {weekdayLabel(day.dayOfWeek)}
              </span>
              <span className="font-display text-lg text-foreground">
                {formatDayNumber(day.date)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatMonthShort(day.date)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
