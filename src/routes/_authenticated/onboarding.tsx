import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getMyBusiness } from "@/lib/business";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Configurar seu espaço — firmou" },
      { name: "description", content: "Cadastre seu estabelecimento no firmou em dois minutos." },
      { property: "og:title", content: "Configurar seu espaço — firmou" },
      {
        property: "og:description",
        content: "Cadastre seu estabelecimento no firmou em dois minutos.",
      },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = ["Negócio", "Localização", "Link"];

function OnboardingPage() {
  const navigate = useNavigate();
  const { data: existing, isLoading } = useQuery({
    queryKey: ["my-business"],
    queryFn: getMyBusiness,
  });

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) navigate({ to: "/dashboard", replace: true });
  }, [existing, navigate]);

  const generatedSlug = useMemo(() => slugify(name), [name]);
  const finalSlug = slugTouched ? slug : generatedSlug;

  async function handleFinish() {
    setSaving(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setError("Sessão expirada. Entre novamente.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("businesses").insert({
      owner_id: userId,
      name: name.trim(),
      slug: finalSlug,
      phone: phone.trim() || null,
      description: description.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
    });

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Esse link já está em uso. Escolha outro."
          : "Não foi possível salvar. Tente novamente.",
      );
      setSaving(false);
      return;
    }

    navigate({ to: "/dashboard", replace: true });
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </main>
    );
  }

  const canContinue =
    step === 0
      ? name.trim().length > 1 && phone.trim().length > 5
      : step === 1
        ? city.trim().length > 1 && state.trim().length > 0
        : finalSlug.length > 1;

  return (
    <main className="min-h-screen bg-background px-5 py-12">
      <div className="mx-auto w-full max-w-lg">
        <Logo />

        <h1 className="mt-10 font-display text-3xl leading-tight tracking-tight text-foreground">
          Vamos preparar seu espaço no Firmou.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Leva menos de dois minutos.</p>

        <div className="mt-8 flex items-center gap-2">
          {STEPS.map((label, index) => (
            <div key={label} className="flex flex-1 flex-col gap-2">
              <div
                className={`h-1 rounded-full ${index <= step ? "bg-accent" : "bg-secondary"}`}
              />
              <span
                className={`text-xs ${index === step ? "text-foreground" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-5">
          {step === 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nome do estabelecimento</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Barbearia do João"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte em poucas palavras o que você faz."
                />
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua das Flores, 120"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="SP"
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="slug">Seu link</Label>
                <div className="flex items-center rounded-lg border border-input bg-card px-3">
                  <span className="text-sm text-muted-foreground">firmou.com.br/</span>
                  <input
                    id="slug"
                    value={finalSlug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    className="flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Você pode ajustar o link antes de concluir.
                </p>
              </div>
            </>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex items-center gap-3 pt-2">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={saving}>
                Voltar
              </Button>
            ) : null}
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canContinue}>
                Continuar
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={!canContinue || saving}>
                {saving ? "Salvando..." : "Concluir"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
