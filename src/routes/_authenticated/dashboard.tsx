import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getMyBusiness } from "@/lib/business";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — firmou" },
      { name: "description", content: "Acompanhe o dia do seu negócio no firmou." },
      { property: "og:title", content: "Painel — firmou" },
      { property: "og:description", content: "Acompanhe o dia do seu negócio no firmou." },
    ],
  }),
  component: DashboardPage,
});

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function DashboardPage() {
  const navigate = useNavigate();

  const { data: business, isLoading } = useQuery({
    queryKey: ["my-business"],
    queryFn: getMyBusiness,
  });

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  useEffect(() => {
    if (!isLoading && business === null) navigate({ to: "/onboarding", replace: true });
  }, [business, isLoading, navigate]);

  const userName =
    (user?.user_metadata?.["full_name"] as string | undefined) || user?.email || "";
  const firstName = userName.split(" ")[0] ?? "";

  return (
    <DashboardShell business={business ?? null} userName={userName}>
      <header>
        <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aqui está o que está acontecendo hoje.
        </p>
      </header>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <EmptyPanel
          title="Agendamentos de hoje"
          message="Nenhum agendamento para hoje."
          className="lg:col-span-2"
        />
        <EmptyPanel title="Próximos clientes" message="Nenhum cliente na fila ainda." />
        <EmptyPanel
          title="Horários disponíveis"
          message="Defina seus horários para começar a receber agendamentos."
          className="lg:col-span-3"
        />
      </div>

      <div className="mt-10">
        <Button asChild>
          <Link to="/services">Configurar meus serviços</Link>
        </Button>
      </div>
    </DashboardShell>
  );
}

function EmptyPanel({
  title,
  message,
  className,
}: {
  title: string;
  message: string;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card p-6 ${className ?? ""}`}>
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <p className="mt-6 text-sm text-muted-foreground">{message}</p>
    </section>
  );
}
