import type { BookedSlot, PublicBusinessHours } from "@/lib/public-booking";

export const SLOT_STEP_MINUTES = 30;

export type CalendarDay = {
  /** "YYYY-MM-DD" */
  date: string;
  dayOfWeek: number;
  available: boolean;
};

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function weekdayLabel(dayOfWeek: number): string {
  return WEEKDAY_SHORT[dayOfWeek] ?? "";
}

export function formatDayNumber(key: string): string {
  return String(parseDateKey(key).getDate());
}

export function formatMonthShort(key: string): string {
  return MONTH_SHORT[parseDateKey(key).getMonth()] ?? "";
}

export function formatFullDate(key: string): string {
  const date = parseDateKey(key);
  return `${weekdayLabel(date.getDay())}, ${date.getDate()} de ${
    MONTH_SHORT[date.getMonth()]
  }`;
}

/** Next `days` days starting today; a day is available when business_hours says it is open. */
export function buildCalendar(
  hours: PublicBusinessHours[],
  days = 30,
  today = new Date(),
): CalendarDay[] {
  const byDay = new Map(hours.map((h) => [h.day_of_week, h]));
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dayOfWeek = date.getDay();
    const config = byDay.get(dayOfWeek);
    const available =
      !!config && !config.is_closed && !!config.open_time && !!config.close_time;
    return { date: toDateKey(date), dayOfWeek, available };
  });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function localDateTime(dateKey: string, minutes: number): Date {
  const date = parseDateKey(dateKey);
  date.setMinutes(minutes);
  return date;
}

/**
 * Start times (HH:MM) offered for a given day.
 * - starts every 30 min inside open_time..close_time
 * - the whole service duration must fit before close_time
 * - no overlap with slots already booked for the selected professional
 * - no times already in the past
 */
export function buildTimeSlots(params: {
  dateKey: string;
  hours: PublicBusinessHours[];
  durationMinutes: number;
  professionalId: string;
  booked: BookedSlot[];
  now?: Date;
}): string[] {
  const { dateKey, hours, durationMinutes, professionalId, booked } = params;
  const now = params.now ?? new Date();

  const dayOfWeek = parseDateKey(dateKey).getDay();
  const config = hours.find((h) => h.day_of_week === dayOfWeek);
  if (!config || config.is_closed || !config.open_time || !config.close_time) {
    return [];
  }

  const open = timeToMinutes(config.open_time);
  const close = timeToMinutes(config.close_time);
  if (close <= open || durationMinutes <= 0) return [];

  const busy = booked
    .filter((slot) => slot.professional_id === professionalId)
    .map((slot) => ({
      start: new Date(slot.start_time).getTime(),
      end: new Date(slot.end_time).getTime(),
    }));

  const slots: string[] = [];
  for (let start = open; start + durationMinutes <= close; start += SLOT_STEP_MINUTES) {
    const startAt = localDateTime(dateKey, start);
    if (startAt.getTime() <= now.getTime()) continue;

    const endAt = localDateTime(dateKey, start + durationMinutes);
    const overlaps = busy.some(
      (b) => startAt.getTime() < b.end && endAt.getTime() > b.start,
    );
    if (overlaps) continue;

    slots.push(minutesToTime(start));
  }

  return slots;
}
