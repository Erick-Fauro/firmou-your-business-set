import { supabase } from "@/integrations/supabase/client";

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  phone: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
};

export async function getMyBusiness(): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, owner_id, name, slug, phone, description, address, city, state")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as Business) ?? null;
}
