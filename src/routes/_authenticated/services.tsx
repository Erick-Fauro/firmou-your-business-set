import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonPage } from "@/components/dashboard/ComingSoonPage";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({
    meta: [
      { title: "Serviços — firmou" },
      { name: "description", content: "Cadastre os serviços oferecidos pelo seu negócio." },
      { property: "og:title", content: "Serviços — firmou" },
      {
        property: "og:description",
        content: "Cadastre os serviços oferecidos pelo seu negócio.",
      },
    ],
  }),
  component: () => (
    <ComingSoonPage
      title="Serviços"
      message="Aqui você vai cadastrar o que oferece, a duração e o valor."
    />
  ),
});
