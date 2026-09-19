import { supabase } from "@/integrations/supabase/client";

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
