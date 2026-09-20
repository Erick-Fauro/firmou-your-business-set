import { supabase } from "@/integrations/supabase/client";

/** Untyped view for tables not present in the auto-generated types file. */
const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args: Record<string, unknown>) => any;
};

export type PublicBusiness = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
};

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
};

export type PublicProfessional = {
  id: string;
  name: string;
};

export type PublicBusinessHours = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export type BookedSlot = {
  professional_id: string;
  start_time: string;
  end_time: string;
};

export async function fetchPublicBusiness(
  businessId: string,
): Promise<PublicBusiness | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, description, address, city, state, phone")
    .eq("id", businessId)
    .maybeSingle();

  if (error) throw error;
  return (data as PublicBusiness | null) ?? null;
}

export async function fetchActiveServices(
  businessId: string,
): Promise<PublicService[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, price, duration_minutes")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PublicService[];
}

export async function fetchActiveProfessionals(
  businessId: string,
): Promise<PublicProfessional[]> {
  const { data, error } = await db
    .from("professionals")
    .select("id, name")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row["id"]),
    name: String(row["name"] ?? ""),
  }));
}

export async function fetchPublicBusinessHours(
  businessId: string,
): Promise<PublicBusinessHours[]> {
  const { data, error } = await db
    .from("business_hours")
    .select("day_of_week, open_time, close_time, is_closed")
    .eq("business_id", businessId);

  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    day_of_week: Number(row["day_of_week"]),
    open_time: row["open_time"] ? String(row["open_time"]).slice(0, 5) : null,
    close_time: row["close_time"] ? String(row["close_time"]).slice(0, 5) : null,
    is_closed: row["is_closed"] === true,
  }));
}

/** date must be "YYYY-MM-DD" */
export async function fetchBookedSlots(
  businessId: string,
  date: string,
): Promise<BookedSlot[]> {
  const { data, error } = await db.rpc("get_booked_slots", {
    p_business_id: businessId,
    p_date: date,
  });

  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    professional_id: String(row["professional_id"]),
    start_time: String(row["start_time"]),
    end_time: String(row["end_time"]),
  }));
}
