import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/booking/ServiceCard";
import {
  fetchActiveServices,
  fetchPublicBusiness,
} from "@/lib/public-booking";

export const Route = createFileRoute("/agendar/$businessId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Agende seu horário — firmou" },
      {
        name: "description",
        content:
          "Escolha um serviço e agende seu horário de forma rápida e simples.",
      },
      { property: "og:title", content: "Agende seu horário — firmou" },
      {
        property: "og:description",
        content:
          "Escolha um serviço e agende seu horário de forma rápida e simples.",
      },
    ],
  }),
  component: PublicBookingPage,
});

function PublicBookingPage() {
  const { businessId } = Route.useParams();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );

  const businessQuery = useQuery({
    queryKey: ["public-business", businessId],
    queryFn: () => fetchPublicBusiness(businessId),
  });

  const servicesQuery = useQuery({
    queryKey: ["public-services", businessId],
    queryFn: () => fetchActiveServices(businessId),
  });

  if (businessQuery.isPending || servicesQuery.isPending) {
    return <PageShell><LoadingState /></PageShell>;
  }

  if (businessQuery.isError || servicesQuery.isError) {
    return (
      <PageShell>
        <StatusMessage
          title="Algo deu errado"
          text="Não foi possível carregar os dados deste estabelecimento. Tente novamente mais tarde."
        />
      </PageShell>
    );
  }

  const business = businessQuery.data;
  if (!business) {
    return (
      <PageShell>
        <StatusMessage
          title="Estabelecimento não encontrado"
          text="Confira o link de agendamento e tente novamente."
        />
      </PageShell>
    );
  }

  const services = servicesQuery.data ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-lg px-5 py-4">
          <Logo className="text-xl" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-40 pt-8">
        <section>
          <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground">
            {business.name}
          </h1>
          {business.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {business.description}
            </p>
          )}
          {(business.city || business.state) && (
            <p className="mt-2 text-sm text-muted-foreground">
              {[business.city, business.state].filter(Boolean).join(" - ")}
            </p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg text-foreground">
            Escolha um serviço
          </h2>

          {services.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Este estabelecimento ainda não possui serviços disponíveis.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedServiceId === service.id}
                  onSelect={setSelectedServiceId}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg px-5 py-4">
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedServiceId}
          >
            Continuar
          </Button>
        </div>
      </footer>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-lg px-5 py-4">
          <Logo className="text-xl" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pt-8">
        {children}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-2 animate-pulse space-y-4" aria-busy="true">
      <div className="h-8 w-2/3 rounded bg-muted" />
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="mt-8 h-24 rounded-xl bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
    </div>
  );
}

function StatusMessage({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-10 rounded-xl border border-border bg-card p-8 text-center">
      <h1 className="font-display text-xl text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
}
