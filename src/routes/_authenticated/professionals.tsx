import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonPage } from "@/components/dashboard/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/professionals")({
  head: () => ({
    meta: [
      { title: "Profissionais — firmou" },
      { name: "description", content: "Gerencie quem atende no seu estabelecimento." },
      { property: "og:title", content: "Profissionais — firmou" },
      { property: "og:description", content: "Gerencie quem atende no seu estabelecimento." },
    ],
  }),
  component: () => (
    <ComingSoonPage
      title="Profissionais"
      message="Cadastre quem atende e vincule aos horários."
    />
  ),
});
