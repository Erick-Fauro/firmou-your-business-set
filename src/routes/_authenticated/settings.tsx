import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { getMyBusiness } from "@/lib/business";
import {
  listBusinessHours,
  saveBusinessHours,
  type DayHoursInput,
} from "@/lib/business-hours";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — firmou" },
      { name: "description", content: "Ajuste os dados do seu estabelecimento no firmou." },
      { property: "og:title", content: "Configurações — firmou" },
      {
        property: "og:description",
        content: "Ajuste os dados do seu estabelecimento no firmou.",
      },
    ],
  }),
  component: SettingsPage,
});

/** Display order: Monday first. day_of_week: 0 = Sunday … 6 = Saturday. */
const WEEK_DAYS: Array<{ day_of_week: number; label: string }> = [
  { day_of_week: 1, label: "Segunda-feira" },
  { day_of_week: 2, label: "Terça-feira" },
  { day_of_week: 3, label: "Quarta-feira" },
  { day_of_week: 4, label: "Quinta-feira" },
  { day_of_week: 5, label: "Sexta-feira" },
  { day_of_week: 6, label: "Sábado" },
  { day_of_week: 0, label: "Domingo" },
];

type DayState = {
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

const EMPTY_DAY: DayState = { open_time: "", close_time: "", is_closed: false };

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: business, isLoading: loadingBusiness } = useQuery({
    queryKey: ["my-business"],
    queryFn: getMyBusiness,
  });

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  useEffect(() => {
    if (!loadingBusiness && business === null) navigate({ to: "/onboarding", replace: true });
  }, [business, loadingBusiness, navigate]);

  const businessId = business?.id;

  const { data: hours, isLoading: loadingHours } = useQuery({
    queryKey: ["business-hours", businessId],
    queryFn: () => listBusinessHours(businessId!),
    enabled: !!businessId,
  });

  const [days, setDays] = useState<Record<number, DayState>>({});
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!hours || loaded) return;
    const next: Record<number, DayState> = {};
    for (const day of WEEK_DAYS) {
      const existing = hours.find((h) => h.day_of_week === day.day_of_week);
      next[day.day_of_week] = existing
        ? {
            open_time: existing.open_time ?? "",
            close_time: existing.close_time ?? "",
            is_closed: existing.is_closed,
          }
        : { ...EMPTY_DAY };
    }
    setDays(next);
    setLoaded(true);
  }, [hours, loaded]);

  const saveMutation = useMutation({
    mutationFn: (input: DayHoursInput[]) => saveBusinessHours(businessId!, input),
    onSuccess: () => {
      setFeedback({ kind: "success", text: "Horários atualizados com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["business-hours", businessId] });
    },
    onError: () =>
      setFeedback({
        kind: "error",
        text: "Não foi possível salvar os horários. Tente novamente.",
      }),
  });

  function updateDay(dayOfWeek: number, patch: Partial<DayState>) {
    setFeedback(null);
    setDays((prev) => ({ ...prev, [dayOfWeek]: { ...prev[dayOfWeek], ...patch } }));
  }

  function handleSave() {
    const payload: DayHoursInput[] = WEEK_DAYS.map(({ day_of_week }) => {
      const day = days[day_of_week] ?? EMPTY_DAY;
      return {
        day_of_week,
        is_closed: day.is_closed,
        open_time: day.is_closed ? null : day.open_time || null,
        close_time: day.is_closed ? null : day.close_time || null,
      };
    });

    for (const day of payload) {
      if (day.is_closed) continue;
      if (!day.open_time || !day.close_time) {
        setFeedback({
          kind: "error",
          text: "Informe os horários de abertura e fechamento para os dias abertos, ou marque o dia como Fechado.",
        });
        return;
      }
      if (day.close_time <= day.open_time) {
        setFeedback({
          kind: "error",
          text: "O horário de fechamento deve ser posterior ao horário de abertura.",
        });
        return;
      }
    }

    saveMutation.mutate(payload);
  }

  const userName =
    (user?.user_metadata?.["full_name"] as string | undefined) || user?.email || "";

  return (
    <DashboardShell business={business ?? null} userName={userName}>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dados do estabelecimento e preferências.
          </p>
        </div>

        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
            <Clock className="size-4 text-muted-foreground" />
            <div>
              <h2 className="text-base font-medium">Horários de funcionamento</h2>
              <p className="text-xs text-muted-foreground">
                Defina os horários gerais do estabelecimento para cada dia da semana.
              </p>
            </div>
          </div>

          {loadingBusiness || loadingHours || !loaded ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">Carregando horários…</p>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {WEEK_DAYS.map(({ day_of_week, label }) => {
                  const day = days[day_of_week] ?? EMPTY_DAY;
                  return (
                    <li
                      key={day_of_week}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center justify-between gap-4 sm:w-44 sm:justify-start">
                        <span className="text-sm font-medium">{label}</span>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch
                            checked={day.is_closed}
                            onCheckedChange={(checked) =>
                              updateDay(day_of_week, { is_closed: checked })
                            }
                            aria-label={`${label} fechado`}
                          />
                          Fechado
                        </label>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          day.is_closed ? "pointer-events-none opacity-40" : ""
                        }`}
                      >
                        <Input
                          type="time"
                          value={day.open_time}
                          disabled={day.is_closed}
                          onChange={(e) => updateDay(day_of_week, { open_time: e.target.value })}
                          aria-label={`${label} abertura`}
                          className="w-28"
                        />
                        <span className="text-xs text-muted-foreground">até</span>
                        <Input
                          type="time"
                          value={day.close_time}
                          disabled={day.is_closed}
                          onChange={(e) => updateDay(day_of_week, { close_time: e.target.value })}
                          aria-label={`${label} fechamento`}
                          className="w-28"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                {feedback ? (
                  <p
                    className={`text-sm ${
                      feedback.kind === "success" ? "text-primary" : "text-destructive"
                    }`}
                    role="status"
                  >
                    {feedback.text}
                  </p>
                ) : (
                  <span />
                )}
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="sm:ml-auto"
                >
                  {saveMutation.isPending ? "Salvando…" : "Salvar horários"}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
