import { supabase } from "@/integrations/supabase/client";

/**
 * public.professionals / public.professional_services already exist in the
 * project's Supabase database but are not part of the generated types file
 * (which is auto-generated and must not be edited). We use an untyped view of
 * the client for these two tables only.
 */
const db = supabase as unknown as {
  from: (table: string) => any;
};

export type Professional = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  active: boolean;
  created_at: string;
  service_ids: string[];
};

export type ProfessionalInput = {
  name: string;
  phone: string | null;
  active: boolean;
  serviceIds: string[];
};

export async function listProfessionals(businessId: string): Promise<Professional[]> {
  const { data, error } = await db
    .from("professionals")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  if (rows.length === 0) return [];

  const ids = rows.map((r) => String(r["id"]));
  const { data: links, error: linkError } = await db
    .from("professional_services")
    .select("professional_id, service_id")
    .in("professional_id", ids);

  if (linkError) throw linkError;

  const byProfessional = new Map<string, string[]>();
  for (const link of (links ?? []) as Array<{ professional_id: string; service_id: string }>) {
    const list = byProfessional.get(link.professional_id) ?? [];
    list.push(link.service_id);
    byProfessional.set(link.professional_id, list);
  }

  return rows.map((row) => ({
    id: String(row["id"]),
    business_id: String(row["business_id"]),
    name: String(row["name"] ?? ""),
    active: row["active"] !== false,
    created_at: String(row["created_at"] ?? ""),
    service_ids: byProfessional.get(String(row["id"])) ?? [],
  }));
}

async function syncServices(professionalId: string, serviceIds: string[]) {
  const { data, error } = await db
    .from("professional_services")
    .select("service_id")
    .eq("professional_id", professionalId);
  if (error) throw error;

  const current = new Set(
    ((data ?? []) as Array<{ service_id: string }>).map((r) => r.service_id),
  );
  const next = new Set(serviceIds);

  const toAdd = [...next].filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !next.has(id));

  if (toRemove.length) {
    const { error: removeError } = await db
      .from("professional_services")
      .delete()
      .eq("professional_id", professionalId)
      .in("service_id", toRemove);
    if (removeError) throw removeError;
  }

  if (toAdd.length) {
    const { error: addError } = await db
      .from("professional_services")
      .insert(toAdd.map((serviceId) => ({ professional_id: professionalId, service_id: serviceId })));
    if (addError) throw addError;
  }
}

export async function createProfessional(
  businessId: string,
  input: { name: string; active: boolean; serviceIds: string[] },
) {
  const { data, error } = await db
    .from("professionals")
    .insert({ business_id: businessId, name: input.name, active: input.active })
    .select("id")
    .single();
  if (error) throw error;

  await syncServices(String((data as { id: string }).id), input.serviceIds);
}

export async function updateProfessional(
  id: string,
  input: { name: string; active: boolean; serviceIds: string[] },
) {
  const { error } = await db
    .from("professionals")
    .update({ name: input.name, active: input.active })
    .eq("id", id);
  if (error) throw error;

  await syncServices(id, input.serviceIds);
}

export async function setProfessionalActive(id: string, active: boolean) {
  const { error } = await db.from("professionals").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteProfessional(id: string) {
  const { error } = await db.from("professionals").delete().eq("id", id);
  if (error) throw error;
}
