import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { getMyBusiness } from "@/lib/business";
import {
  centsToMasked,
  createService,
  deleteService,
  formatDuration,
  formatPrice,
  listServices,
  maskedToNumber,
  numberToDigits,
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

function ServicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: business, isLoading: loadingBusiness } = useQuery({
    queryKey: ["my-business"],
    queryFn: getMyBusiness,
  });

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  useEffect(() => {
    if (!loadingBusiness && business === null) navigate({ to: "/onboarding", replace: true });
  }, [business, loadingBusiness, navigate]);

  const businessId = business?.id;

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => listServices(businessId!),
    enabled: !!businessId,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["services", businessId] });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setServiceActive(id, active),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      setToDelete(null);
      invalidate();
    },
  });

  const userName =
    (user?.user_metadata?.["full_name"] as string | undefined) || user?.email || "";

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setFormOpen(true);
  }

  return (
    <DashboardShell business={business ?? null} userName={userName}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground">
            Serviços
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O que você oferece, quanto custa e quanto tempo leva.
          </p>
        </div>
        {services && services.length > 0 ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Novo serviço
          </Button>
        ) : null}
      </header>

      <div className="mt-10">
        {loadingBusiness || loadingServices ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !services || services.length === 0 ? (
          <section className="rounded-xl border border-border bg-card px-6 py-14 text-center">
            <p className="text-sm text-muted-foreground">
              Você ainda não cadastrou nenhum serviço.
            </p>
            <Button className="mt-6" onClick={openCreate}>
              Cadastrar primeiro serviço
            </Button>
          </section>
        ) : (
          <ul className="space-y-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="rounded-xl border border-border bg-card p-5 sm:flex sm:items-start sm:justify-between sm:gap-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-medium text-foreground">{service.name}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        service.active
                          ? "bg-accent/15 text-accent-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {service.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {service.description ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">{service.description}</p>
                  ) : null}
                  <p className="mt-3 text-sm text-foreground">
                    {formatPrice(Number(service.price))}
                    <span className="text-muted-foreground">
                      {" "}
                      · {formatDuration(service.duration_minutes)}
                    </span>
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-3 sm:mt-0 sm:shrink-0">
                  <Switch
                    checked={service.active}
                    aria-label={service.active ? "Desativar serviço" : "Ativar serviço"}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: service.id, active: checked })
                    }
                  />
                  <Button variant="ghost" size="icon" aria-label="Editar serviço" onClick={() => openEdit(service)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir serviço"
                    onClick={() => setToDelete(service)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {businessId ? (
        <ServiceFormDialog
          key={editing?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          businessId={businessId}
          service={editing}
          onSaved={invalidate}
        />
      ) : null}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não poderá ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) deleteMutation.mutate(toDelete.id);
              }}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

function ServiceFormDialog({
  open,
  onOpenChange,
  businessId,
  service,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  service: Service | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [priceDigits, setPriceDigits] = useState(
    service ? numberToDigits(Number(service.price)) : "",
  );
  const [duration, setDuration] = useState(
    service ? String(service.duration_minutes) : "",
  );
  const [active, setActive] = useState(service?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
        price: maskedToNumber(priceDigits),
        duration_minutes: Number(duration),
        active,
      };
      if (service) await updateService(service.id, input);
      else await createService(businessId, input);
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
    },
    onError: () => setError("Não foi possível salvar. Tente novamente."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe o nome do serviço.");
      return;
    }
    const price = maskedToNumber(priceDigits);
    if (!Number.isFinite(price) || price < 0) {
      setError("O preço não pode ser negativo.");
      return;
    }
    const minutes = Number(duration);
    if (!Number.isInteger(minutes) || minutes <= 0) {
      setError("A duração deve ser maior que zero.");
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          <DialogDescription>
            Preencha as informações que seus clientes vão ver.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="service-name">Nome do serviço</Label>
            <Input
              id="service-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Corte de cabelo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-description">Descrição (opcional)</Label>
            <Textarea
              id="service-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre o serviço."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-price">Preço</Label>
              <div className="flex items-center rounded-lg border border-input bg-card px-3">
                <span className="text-sm text-muted-foreground">R$</span>
                <input
                  id="service-price"
                  inputMode="numeric"
                  value={centsToMasked(priceDigits)}
                  onChange={(e) => setPriceDigits(e.target.value.replace(/\D/g, ""))}
                  className="w-full flex-1 bg-transparent py-2.5 pl-2 text-sm text-foreground outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-duration">Duração (minutos)</Label>
              <Input
                id="service-duration"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value.replace(/\D/g, ""))}
                placeholder="30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <Label htmlFor="service-active">Serviço ativo</Label>
              <p className="text-xs text-muted-foreground">Fica disponível para agendamento.</p>
            </div>
            <Switch id="service-active" checked={active} onCheckedChange={setActive} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
