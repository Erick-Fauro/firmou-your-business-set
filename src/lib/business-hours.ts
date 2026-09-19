import { supabase } from "@/integrations/supabase/client";

/**
 * public.business_hours already exists in the project's Supabase database but
 * is not part of the generated types file (auto-generated, must not be
 * edited). We use an untyped view of the client for this table only.
 */
const db = supabase as unknown as {
  from: (table: string) => any;
};

export type BusinessHours = {
  id: string;
  business_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export type DayHoursInput = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export async function listBusinessHours(businessId: string): Promise<BusinessHours[]> {
  const { data, error } = await db
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId)
    .order("day_of_week", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row["id"]),
    business_id: String(row["business_id"]),
    day_of_week: Number(row["day_of_week"]),
    open_time: row["open_time"] ? String(row["open_time"]).slice(0, 5) : null,
    close_time: row["close_time"] ? String(row["close_time"]).slice(0, 5) : null,
    is_closed: row["is_closed"] === true,
  }));
}

/**
 * Creates or updates one row per day, keyed by business_id + day_of_week.
 * Never duplicates an existing day.
 */
export async function saveBusinessHours(businessId: string, days: DayHoursInput[]) {
  const existing = await listBusinessHours(businessId);
  const byDay = new Map(existing.map((row) => [row.day_of_week, row]));

  for (const day of days) {
    const payload = {
      open_time: day.is_closed ? null : day.open_time,
      close_time: day.is_closed ? null : day.close_time,
      is_closed: day.is_closed,
    };

    const current = byDay.get(day.day_of_week);
    if (current) {
      const { error } = await db.from("business_hours").update(payload).eq("id", current.id);
      if (error) throw error;
    } else {
      const { error } = await db
        .from("business_hours")
        .insert({ business_id: businessId, day_of_week: day.day_of_week, ...payload });
      if (error) throw error;
    }
  }
}
