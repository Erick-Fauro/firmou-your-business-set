import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { listServices, type Service } from "@/lib/services";
import {
  createProfessional,
  deleteProfessional,
  listProfessionals,
  setProfessionalActive,
  updateProfessional,
  type Professional,
} from "@/lib/professionals";

export const Route = createFileRoute("/_authenticated/professionals")({
  head: () => ({
    meta: [
      { title: "Profissionais — firmou" },
      { name: "description", content: "Gerencie quem atende no seu estabelecimento." },
      { property: "og:title", content: "Profissionais — firmou" },
      {
        property: "og:description",
        content: "Gerencie quem atende no seu estabelecimento.",
      },
    ],
  }),
  component: ProfessionalsPage,
});

function ProfessionalsPage() {
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

  const { data: professionals, isLoading: loadingProfessionals } = useQuery({
    queryKey: ["professionals", businessId],
    queryFn: () => listProfessionals(businessId!),
    enabled: !!businessId,
  });

  const { data: services } = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => listServices(businessId!),
    enabled: !!businessId,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [toDelete, setToDelete] = useState<Professional | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["professionals", businessId] });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setProfessionalActive(id, active),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfessional(id),
    onSuccess: () => {
      setToDelete(null);
      setDeleteError(null);
      invalidate();
    },
    onError: () =>
      setDeleteError(
        "Não foi possível excluir este profissional porque ele já possui registros vinculados. Desative-o em vez de excluir.",
      ),
  });

  const userName =
    (user?.user_metadata?.["full_name"] as string | undefined) || user?.email || "";

  const serviceNameById = new Map((services ?? []).map((s) => [s.id, s.name]));

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(professional: Professional) {
    setEditing(professional);
    setFormOpen(true);
  }

  return (
    <DashboardShell business={business ?? null} userName={userName}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground">
            Profissionais
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quem atende no seu estabelecimento e o que cada um faz.
          </p>
        </div>
        {professionals && professionals.length > 0 ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Novo profissional
          </Button>
        ) : null}
      </header>

      <div className="mt-10">
        {loadingBusiness || loadingProfessionals ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !professionals || professionals.length === 0 ? (
          <section className="rounded-xl border border-border bg-card px-6 py-14 text-center">
            <p className="text-sm text-muted-foreground">
              Você ainda não cadastrou nenhum profissional.
            </p>
            <Button className="mt-6" onClick={openCreate}>
              Cadastrar primeiro profissional
            </Button>
          </section>
        ) : (
          <ul className="space-y-3">
            {professionals.map((professional) => (
              <li
                key={professional.id}
                className="rounded-xl border border-border bg-card p-5 sm:flex sm:items-start sm:justify-between sm:gap-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-medium text-foreground">{professional.name}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        professional.active
                          ? "bg-accent/15 text-accent-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {professional.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {professional.service_ids.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {professional.service_ids.map((serviceId) => (
                        <span
                          key={serviceId}
                          className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {serviceNameById.get(serviceId) ?? "Serviço"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Nenhum serviço vinculado.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3 sm:mt-0 sm:shrink-0">
                  <Switch
                    checked={professional.active}
                    aria-label={
                      professional.active ? "Desativar profissional" : "Ativar profissional"
                    }
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: professional.id, active: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar profissional"
                    onClick={() => openEdit(professional)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir profissional"
                    onClick={() => {
                      setDeleteError(null);
                      setToDelete(professional);
                    }}
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
        <ProfessionalFormDialog
          key={editing?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          businessId={businessId}
          professional={editing}
          services={services ?? []}
          onSaved={invalidate}
        />
      ) : null}

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) {
            setToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir profissional?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não poderá ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
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

function ProfessionalFormDialog({
  open,
  onOpenChange,
  businessId,
  professional,
  services,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  professional: Professional | null;
  services: Service[];
  onSaved: () => void;
}) {
  const [name, setName] = useState(professional?.name ?? "");
  const [phone, setPhone] = useState(professional?.phone ?? "");
  const [active, setActive] = useState(professional?.active ?? true);
  const [selected, setSelected] = useState<string[]>(professional?.service_ids ?? []);
  const [error, setError] = useState<string | null>(null);

  const allowedIds = new Set(services.map((s) => s.id));

  const mutation = useMutation({
    mutationFn: async () => {
      const input = {
        name: name.trim(),
        phone: phone.trim() || null,
        active,
        serviceIds: [...new Set(selected.filter((id) => allowedIds.has(id)))],
      };
      if (professional) await updateProfessional(professional.id, input);
      else await createProfessional(businessId, input);
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
    },
    onError: () => setError("Não foi possível salvar. Tente novamente."),
  });

  function toggleService(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((s) => s !== id)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe o nome do profissional.");
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{professional ? "Editar profissional" : "Novo profissional"}</DialogTitle>
          <DialogDescription>
            Cadastre quem atende e escolha os serviços que essa pessoa realiza.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="professional-name">Nome</Label>
            <Input
              id="professional-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ana Souza"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="professional-phone">Telefone (opcional)</Label>
            <Input
              id="professional-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-0000"
              inputMode="tel"
            />
          </div>


          <div className="space-y-2">
            <Label>Serviços realizados</Label>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cadastre serviços primeiro para vincular a este profissional.
              </p>
            ) : (
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
                  >
                    <Checkbox
                      checked={selected.includes(service.id)}
                      onCheckedChange={(checked) => toggleService(service.id, checked === true)}
                    />
                    <span className="truncate">{service.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <Label htmlFor="professional-active">Profissional ativo</Label>
              <p className="text-xs text-muted-foreground">Fica disponível para atendimentos.</p>
            </div>
            <Switch id="professional-active" checked={active} onCheckedChange={setActive} />
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
