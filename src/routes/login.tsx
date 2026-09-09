import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getMyBusiness } from "@/lib/business";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — firmou" },
      { name: "description", content: "Acesse sua agenda no firmou com email e senha." },
      { property: "og:title", content: "Entrar — firmou" },
      {
        property: "og:description",
        content: "Acesse sua agenda no firmou com email e senha.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : signInError.message,
      );
      setLoading(false);
      return;
    }

    try {
      const business = await getMyBusiness();
      navigate({ to: business ? "/dashboard" : "/onboarding", replace: true });
    } catch {
      navigate({ to: "/onboarding", replace: true });
    }
  }

  return (
    <AuthLayout
      title="Bem-vindo de volta."
      subtitle="Entre para acompanhar sua agenda."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-4"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthLayout>
  );
}
