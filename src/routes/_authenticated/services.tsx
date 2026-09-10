import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getMyBusiness } from "@/lib/business";
import {
  createService,
  deleteService,
  formatDuration,
  formatPrice,
  getServices,
  setServiceActive,
  updateService,
  type Service,
} from "@/lib/services";

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
  component: ServicesPage,
});

type FormState = {
  name: string;
  description: string;
  priceCents: number;
  duration: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  priceCents: 0,
  duration: "",
  active: true,
};

function formatCents(cents: number) {
  return ((cents || 0) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ServicesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<{ name?: string; price?: string; duration?: string }>({});

  const { data: business } = useQuery({ queryKey: ["my-business"], queryFn: getMyBusiness });

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", business?.id],
    queryFn: () => getServices(business!.id),
    enabled: !!business?.id,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["services", business?.id] });

  const saveMutation = useMutation({
    mutationFn: async (input: FormState) => {
      const payload = {
        name: input.name.trim(),
        description: input.description.trim() || null,
        price: input.priceCents / 100,
        duration_minutes: Number(input.duration),
        active: input.active,
      };
      if (editing) await updateService(editing.id, payload);
      else await createService(business!.id, payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Serviço atualizado." : "Serviço cadastrado.");
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: () => toast.error("Não foi possível salvar. Tente novamente."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setServiceActive(id, active),
    onSuccess: (_data, vars) => {
      toast.success(vars.active ? "Serviço ativado." : "Serviço desativado.");
      invalidate();
    },
    onError: () => toast.error("Não foi possível alterar o status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      toast.success("Serviço excluído.");
      setDeleting(null);
      invalidate();
    },
    onError: () => toast.error("Não foi possível excluir. Tente novamente."),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description ?? "",
      priceCents: Math.round(service.price * 100),
      duration: String(service.duration_minutes),
      active: service.active,
    });
    setErrors({});
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    const duration = Number(form.duration);
    if (!form.name.trim()) next.name = "Informe o nome do serviço.";
    if (form.priceCents < 0) next.price = "O preço não pode ser negativo.";
    if (!form.duration || !Number.isInteger(duration) || duration <= 0)
      next.duration = "A duração deve ser maior que zero.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    saveMutation.mutate(form);
  }

  const userName =
    (user?.user_metadata?.["full_name"] as string | undefined) || user?.email || "";

  return (
    <DashboardShell business={business ?? null} userName={userName}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground">
            Serviços
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre o que você oferece, com duração e valor.
          </p>
        </div>
        {services && services.length > 0 && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Novo serviço
          </Button>
        )}
      </header>

      <div className="mt-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando serviços…</p>
        ) : !services || services.length === 0 ? (
          <section className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <Scissors className="size-8 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Você ainda não cadastrou nenhum serviço.
            </p>
            <Button className="mt-6" onClick={openCreate}>
              Cadastrar primeiro serviço
            </Button>
          </section>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex flex-col rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium text-foreground">{service.name}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      service.active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {service.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                {service.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                )}
                <p className="mt-3 text-sm text-foreground">
                  <span className="font-semibold">{formatPrice(service.price)}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatDuration(service.duration_minutes)}
                  </span>
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={service.active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: service.id, active: checked })
                      }
                      disabled={toggleMutation.isPending}
                      aria-label={`Ativar ou desativar ${service.name}`}
                    />
                    {service.active ? "Ativo" : "Inativo"}
                  </label>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(service)}
                      aria-label={`Editar ${service.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(service)}
                      aria-label={`Excluir ${service.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Altere as informações do serviço."
                : "Preencha as informações do serviço que você oferece."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nome do serviço</Label>
              <Input
                id="service-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Corte de cabelo"
                maxLength={100}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-description">
                Descrição <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="service-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex.: Corte com tesoura e máquina, finalização inclusa."
                maxLength={500}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-price">Preço</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="service-price"
                    className="pl-9"
                    inputMode="numeric"
                    value={formatCents(form.priceCents)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priceCents: Number(e.target.value.replace(/\D/g, "").slice(0, 10)),
                      })
                    }
                  />
                </div>
                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-duration">Duração (minutos)</Label>
                <Input
                  id="service-duration"
                  inputMode="numeric"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value.replace(/\D/g, "").slice(0, 5) })
                  }
                  placeholder="60"
                />
                {errors.duration && (
                  <p className="text-xs text-destructive">{errors.duration}</p>
                )}
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm text-foreground">
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
              />
              Serviço ativo
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Salvando…"
                  : editing
                    ? "Salvar alterações"
                    : "Cadastrar serviço"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
