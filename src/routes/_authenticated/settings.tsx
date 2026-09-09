import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonPage } from "@/components/dashboard/ComingSoonPage";

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
  component: () => (
    <ComingSoonPage
      title="Configurações"
      message="Dados do estabelecimento, link público e preferências."
    />
  ),
});
