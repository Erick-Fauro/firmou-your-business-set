import { supabase } from "@/integrations/supabase/client";

export type Service = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceInput = {
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  active: boolean;
};

export async function listServices(businessId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function createService(businessId: string, input: ServiceInput) {
  const { error } = await supabase.from("services").insert({
    business_id: businessId,
    ...input,
  });
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

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

/** Digits-only cents input -> "1.234,56" */
export function centsToMasked(digits: string): string {
  const cents = Number(digits.replace(/\D/g, "")) || 0;
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function maskedToNumber(masked: string): number {
  const digits = masked.replace(/\D/g, "");
  return (Number(digits) || 0) / 100;
}

export function numberToDigits(value: number): string {
  return String(Math.round(value * 100));
}
