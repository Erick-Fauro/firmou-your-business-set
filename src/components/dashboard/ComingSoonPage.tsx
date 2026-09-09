import { useQuery } from "@tanstack/react-query";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { getMyBusiness } from "@/lib/business";

export function ComingSoonPage({ title, message }: { title: string; message: string }) {
  const { data: business } = useQuery({ queryKey: ["my-business"], queryFn: getMyBusiness });
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const userName =
    (user?.user_metadata?.["full_name"] as string | undefined) || user?.email || "";

  return (
    <DashboardShell business={business ?? null} userName={userName}>
      <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Em breve.
      </div>
    </DashboardShell>
  );
}
