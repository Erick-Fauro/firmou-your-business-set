import { createFileRoute, Link } from "@tanstack/react-router";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "firmou — agenda marcada, horário firmado" },
      {
        name: "description",
        content:
          "O firmou organiza os horários do seu negócio: agenda simples, link próprio e clientes sempre no lugar certo.",
      },
      { property: "og:title", content: "firmou — agenda marcada, horário firmado" },
      {
        property: "og:description",
        content:
          "O firmou organiza os horários do seu negócio: agenda simples, link próprio e clientes sempre no lugar certo.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-7">
        <Logo />
        <Link
          to="/login"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-16 md:pt-28">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">agenda simples</p>
        <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
          Agenda marcada, horário firmado.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          O firmou organiza os horários do seu estabelecimento em um só lugar, com um link
          próprio para seus clientes marcarem sem complicação.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link to="/signup">Criar minha conta</Link>
          </Button>
          <Link
            to="/login"
            className="text-sm text-foreground underline underline-offset-4"
          >
            Já uso o firmou
          </Link>
        </div>

        <div className="mt-24 grid gap-10 border-t border-border pt-12 md:grid-cols-3">
          <Feature
            title="Tudo em uma agenda"
            text="Seus horários, serviços e profissionais organizados sem planilha."
          />
          <Feature
            title="Seu link, seu espaço"
            text="firmou.com.br/seu-negocio — fácil de compartilhar no WhatsApp."
          />
          <Feature
            title="Feito para o dia a dia"
            text="Simples o bastante para usar entre um atendimento e outro."
          />
        </div>
      </main>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="font-display text-lg text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
