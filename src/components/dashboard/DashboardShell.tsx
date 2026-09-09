import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Home,
  LogOut,
  Scissors,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import type { Business } from "@/lib/business";

type NavItem = { label: string; to: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { label: "Início", to: "/dashboard", icon: Home },
  { label: "Agenda", to: "/schedule", icon: CalendarDays },
  { label: "Serviços", to: "/services", icon: Scissors },
  { label: "Profissionais", to: "/professionals", icon: Users },
  { label: "Configurações", to: "/settings", icon: Settings },
];

export function DashboardShell({
  business,
  userName,
  children,
}: {
  business: Business | null;
  userName: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="px-6 py-7">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            >
              <item.icon className="size-4 opacity-70" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {business?.name ?? "Seu estabelecimento"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{userName}</p>
          <button
            onClick={handleSignOut}
            className="mt-3 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border px-5 py-4 md:hidden">
        <Logo className="text-xl" />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <LogOut className="size-3.5" />
          Sair
        </button>
      </header>

      <main className="flex-1 px-5 pb-28 pt-8 md:px-10 md:pb-12 md:pt-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card px-1 py-2 md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{ className: "text-foreground" }}
            className="flex flex-1 flex-col items-center gap-1 py-1 text-[11px] text-muted-foreground"
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
