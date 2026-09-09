import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonPage } from "@/components/dashboard/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({
    meta: [
      { title: "Agenda — firmou" },
      { name: "description", content: "Veja e organize os horários do seu negócio." },
      { property: "og:title", content: "Agenda — firmou" },
      { property: "og:description", content: "Veja e organize os horários do seu negócio." },
    ],
  }),
  component: () => (
    <ComingSoonPage
      title="Agenda"
      message="Seus horários e agendamentos aparecerão aqui."
    />
  ),
});
