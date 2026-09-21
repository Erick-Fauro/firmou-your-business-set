import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { ProfessionalCard } from "@/components/booking/ProfessionalCard";
import { DateStrip } from "@/components/booking/DateStrip";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { formatDuration, formatPrice } from "@/lib/services";
import {
  BookingConflictError,
  createPublicAppointment,
  fetchActiveProfessionals,
  fetchActiveServices,
  fetchBookedSlots,
  fetchPublicBusiness,
  fetchPublicBusinessHours,
} from "@/lib/public-booking";
import { isValidPhone, maskPhone } from "@/lib/phone";
import {
  buildCalendar,
  buildTimeSlots,
  formatFullDate,
  toLocalIso,
} from "@/lib/availability";

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

type Step = "service" | "professional" | "schedule";

function PublicBookingPage() {
  const { businessId } = Route.useParams();

  const [step, setStep] = useState<Step>("service");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const businessQuery = useQuery({
    queryKey: ["public-business", businessId],
    queryFn: () => fetchPublicBusiness(businessId),
  });

  const servicesQuery = useQuery({
    queryKey: ["public-services", businessId],
    queryFn: () => fetchActiveServices(businessId),
  });

  const professionalsQuery = useQuery({
    queryKey: ["public-professionals", businessId],
    queryFn: () => fetchActiveProfessionals(businessId),
    enabled: step !== "service",
  });

  const hoursQuery = useQuery({
    queryKey: ["public-business-hours", businessId],
    queryFn: () => fetchPublicBusinessHours(businessId),
    enabled: step === "schedule",
  });

  const bookedQuery = useQuery({
    queryKey: ["public-booked-slots", businessId, selectedDate],
    queryFn: () => fetchBookedSlots(businessId, selectedDate!),
    enabled: step === "schedule" && !!selectedDate,
  });

  const services = servicesQuery.data ?? [];
  const professionals = professionalsQuery.data ?? [];
  const selectedService =
    services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedProfessional =
    professionals.find((p) => p.id === selectedProfessionalId) ?? null;

  // Only one active professional: pre-select it.
  useEffect(() => {
    if (step === "professional" && professionals.length === 1 && !selectedProfessionalId) {
      setSelectedProfessionalId(professionals[0]!.id);
    }
  }, [step, professionals, selectedProfessionalId]);

  const calendar = useMemo(
    () => buildCalendar(hoursQuery.data ?? []),
    [hoursQuery.data],
  );

  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedService || !selectedProfessionalId) return [];
    return buildTimeSlots({
      dateKey: selectedDate,
      hours: hoursQuery.data ?? [],
      durationMinutes: selectedService.duration_minutes,
      professionalId: selectedProfessionalId,
      booked: bookedQuery.data ?? [],
    });
  }, [
    selectedDate,
    selectedService,
    selectedProfessionalId,
    hoursQuery.data,
    bookedQuery.data,
  ]);

  if (businessQuery.isPending || servicesQuery.isPending) {
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    );
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

  const canContinue =
    step === "service"
      ? !!selectedServiceId
      : step === "professional"
        ? !!selectedProfessionalId
        : !!selectedTime;

  function goBack() {
    if (step === "professional") {
      setStep("service");
      return;
    }
    if (step === "schedule") {
      setSelectedDate(null);
      setSelectedTime(null);
      setStep("professional");
    }
  }

  function goNext() {
    if (step === "service") {
      setStep("professional");
      return;
    }
    if (step === "professional") setStep("schedule");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 py-4">
          {step !== "service" && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Voltar"
              className="-ml-1 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <Logo className="text-xl" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-40 pt-8">
        {step === "service" ? (
          <>
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
                <EmptyBox text="Este estabelecimento ainda não possui serviços disponíveis." />
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
          </>
        ) : (
          <>
            <Summary
              serviceLabel={
                selectedService
                  ? `${selectedService.name} · ${formatDuration(
                      selectedService.duration_minutes,
                    )} · ${formatPrice(Number(selectedService.price))}`
                  : null
              }
              professionalLabel={selectedProfessional?.name ?? null}
              dateLabel={
                selectedDate
                  ? `${formatFullDate(selectedDate)}${selectedTime ? ` · ${selectedTime}` : ""}`
                  : null
              }
            />

            {step === "professional" ? (
              <section className="mt-8">
                <h2 className="font-display text-lg text-foreground">
                  Escolha um profissional
                </h2>

                {professionalsQuery.isPending ? (
                  <SkeletonList />
                ) : professionalsQuery.isError ? (
                  <EmptyBox text="Não foi possível carregar os profissionais. Tente novamente mais tarde." />
                ) : professionals.length === 0 ? (
                  <EmptyBox text="Este estabelecimento ainda não possui profissionais disponíveis." />
                ) : (
                  <div className="mt-4 flex flex-col gap-3">
                    {professionals.map((professional) => (
                      <ProfessionalCard
                        key={professional.id}
                        professional={professional}
                        selected={selectedProfessionalId === professional.id}
                        onSelect={setSelectedProfessionalId}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <>
                <section className="mt-8">
                  <h2 className="font-display text-lg text-foreground">
                    Escolha uma data
                  </h2>

                  {hoursQuery.isPending ? (
                    <SkeletonList />
                  ) : hoursQuery.isError ? (
                    <EmptyBox text="Não foi possível carregar os dias de funcionamento. Tente novamente mais tarde." />
                  ) : calendar.every((day) => !day.available) ? (
                    <EmptyBox text="Este estabelecimento ainda não possui horários de funcionamento configurados." />
                  ) : (
                    <div className="mt-4">
                      <DateStrip
                        days={calendar}
                        selectedDate={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                      />
                    </div>
                  )}
                </section>

                {selectedDate && (
                  <section className="mt-8">
                    <h2 className="font-display text-lg text-foreground">
                      Escolha um horário
                    </h2>

                    {bookedQuery.isPending ? (
                      <SkeletonList />
                    ) : bookedQuery.isError ? (
                      <EmptyBox text="Não foi possível verificar a disponibilidade. Tente novamente mais tarde." />
                    ) : timeSlots.length === 0 ? (
                      <EmptyBox text="Nenhum horário disponível nesta data. Escolha outro dia." />
                    ) : (
                      <div className="mt-4">
                        <TimeSlotGrid
                          slots={timeSlots}
                          selectedTime={selectedTime}
                          onSelect={setSelectedTime}
                        />
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg px-5 py-4">
          <Button
            size="lg"
            className="w-full"
            disabled={!canContinue}
            onClick={goNext}
          >
            Continuar
          </Button>
        </div>
      </footer>
    </div>
  );
}

function Summary({
  serviceLabel,
  professionalLabel,
  dateLabel,
}: {
  serviceLabel: string | null;
  professionalLabel: string | null;
  dateLabel: string | null;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <dl className="space-y-2 text-sm">
        <SummaryRow label="Serviço" value={serviceLabel} />
        <SummaryRow label="Profissional" value={professionalLabel} />
        <SummaryRow label="Data" value={dateLabel} />
      </dl>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value ?? "—"}</dd>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

function SkeletonList() {
  return (
    <div className="mt-4 animate-pulse space-y-3" aria-busy="true">
      <div className="h-16 rounded-xl bg-muted" />
      <div className="h-16 rounded-xl bg-muted" />
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
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pt-8">{children}</main>
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
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
