import { supabase } from "@/integrations/supabase/client";

export type Service = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  active: boolean;
};

export type ServiceInput = {
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  active: boolean;
};

const COLUMNS = "id, business_id, name, description, price, duration_minutes, active";

export async function getServices(businessId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select(COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as Service[]) ?? [];
}

export async function createService(businessId: string, input: ServiceInput) {
  const { error } = await supabase
    .from("services")
    .insert({ ...input, business_id: businessId });
  if (error) throw error;
}

export async function updateService(id: string, input: ServiceInput) {
  const { error } = await supabase.from("services").update(input).eq("id", id);
  if (error) throw error;
}

export async function setServiceActive(id: string, active: boolean) {
  const { error } = await supabase.from("services").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteService(id: string) {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value: number) {
  return brl.format(value);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
