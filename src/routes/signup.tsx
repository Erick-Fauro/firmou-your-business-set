import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Criar conta — firmou" },
      {
        name: "description",
        content: "Crie sua conta no firmou e organize os horários do seu negócio.",
      },
      { property: "og:title", content: "Criar conta — firmou" },
      {
        property: "og:description",
        content: "Crie sua conta no firmou e organize os horários do seu negócio.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name.trim() },
      },
    });

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "Este email já está cadastrado."
          : signUpError.message,
      );
      setLoading(false);
      return;
    }

    if (!data.session) {
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    navigate({ to: "/onboarding", replace: true });
  }

  if (checkEmail) {
    return (
      <AuthLayout
        title="Confirme seu email."
        subtitle={`Enviamos um link de confirmação para ${email}. Depois de confirmar, é só entrar.`}
        footer={
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Ir para o login
          </Link>
        }
      >
        <div />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crie sua conta."
      subtitle="Sua agenda organizada em poucos minutos."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Use ao menos 6 caracteres.</p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </AuthLayout>
  );
}
