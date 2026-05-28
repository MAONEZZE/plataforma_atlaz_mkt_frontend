"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cadastroClienteSchema, type CadastroClienteInput } from "@/lib/utils/validations";
import { adminClientes, adminStages, adminProdutos } from "@/lib/api/admin";
import type { ClienteLinha } from "@/lib/api/admin";
import { listProdutos } from "@/lib/api/produtos";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { PasswordStrengthIndicator } from "@/components/forms/PasswordStrengthIndicator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 20;

function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  return phone.startsWith("+") ? phone : `+${phone}`;
}

interface ClientManageModalProps {
  client: ClienteLinha;
  onClose: () => void;
}

function ClientManageModal({ client, onClose }: ClientManageModalProps) {
  const queryClient = useQueryClient();

  const { data: produtos } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  const { data: allStages } = useQuery({
    queryKey: ["admin", "stages"],
    queryFn: adminStages.list,
  });

  const { data: clientStages } = useQuery({
    queryKey: ["admin", "clients", client.id, "stages"],
    queryFn: () => adminStages.getClientStages(client.id),
    retry: false,
  });

  const [attachedIds, setAttachedIds] = useState<Set<string>>(new Set());
  const [selectedProductId, setSelectedProductId] = useState<string>(
    client.product_id ?? "",
  );

  useEffect(() => {
    if (clientStages) {
      setAttachedIds(new Set(clientStages.map((s) => s.stage_id)));
    }
  }, [clientStages]);

  const productMut = useMutation({
    mutationFn: () =>
      adminProdutos.assignToClient(client.id, selectedProductId),
    onSuccess: () => {
      toast.success("Produto atribuído!");
      queryClient.invalidateQueries({ queryKey: ["admin", "clientes"] });
    },
    onError: () => toast.error("Erro ao atribuir produto."),
  });

  const stageMut = useMutation({
    mutationFn: async ({
      stage_id,
      attach,
    }: {
      stage_id: string;
      attach: boolean;
    }) => {
      if (attach) {
        await adminStages.attachToClient(client.id, stage_id);
      } else {
        await adminStages.detachFromClient(client.id, stage_id);
      }
      return { stage_id, attach };
    },
    onSuccess: ({ stage_id, attach }) => {
      setAttachedIds((prev) => {
        const next = new Set(prev);
        if (attach) next.add(stage_id);
        else next.delete(stage_id);
        return next;
      });
      toast.success(attach ? "Etapa adicionada." : "Etapa removida.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "clients", client.id, "stages"],
      });
    },
    onError: () => toast.error("Erro ao alterar etapa."),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Gerenciar — {client.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Produto</h3>
            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="">Sem produto</option>
                {produtos?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedProductId || productMut.isPending}
                onClick={() => productMut.mutate()}
              >
                {productMut.isPending ? "..." : "Salvar"}
              </Button>
            </div>
          </div>

          {/* Stages section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Etapas</h3>
            {!allStages ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : allStages.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma etapa cadastrada.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {allStages.map((s) => {
                  const attached = attachedIds.has(s.id);
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={attached}
                        disabled={stageMut.isPending}
                        onChange={(e) =>
                          stageMut.mutate({
                            stage_id: s.id,
                            attach: e.target.checked,
                          })
                        }
                        className="size-4 accent-[var(--color-primary)]"
                      />
                      <div className="min-w-0 flex-1">
                        {s.title && (
                          <p className="text-sm font-medium break-all">{s.title}</p>
                        )}
                        <p
                          className={
                            (s.title ? "text-xs text-muted-foreground" : "text-sm") +
                            " break-all whitespace-pre-wrap"
                          }
                        >
                          {s.text}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Fechar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClientesTable() {
  const [page, setPage] = useState(1);
  const [managing, setManaging] = useState<ClienteLinha | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "clientes", page],
    queryFn: () => adminClientes.list({ page, page_size: PAGE_SIZE }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (isError) return (
    <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
      Erro ao carregar clientes.
    </div>
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <GlassCard variant="solid" className="space-y-4 h-fit">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Clientes cadastrados</h2>
        <span className="text-xs text-muted-foreground">{total} registros</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-2 font-medium text-muted-foreground text-xs">Nome</th>
                <th className="text-left pb-2 font-medium text-muted-foreground text-xs">Email</th>
                <th className="text-left pb-2 font-medium text-muted-foreground text-xs">Telefone</th>
                {items[0]?.created_at && (
                  <th className="text-left pb-2 font-medium text-muted-foreground text-xs">Criado em</th>
                )}
                <th className="text-left pb-2 font-medium text-muted-foreground text-xs">Produto</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-4 font-medium break-all">{c.name}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground break-all">{c.email}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground break-all">{formatPhone(c.phone)}</td>
                  {c.created_at && (
                    <td className="py-2.5 text-muted-foreground text-xs">
                      {format(parseISO(c.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                  )}
                  <td className="py-2.5 pr-4 text-muted-foreground text-xs break-all">{c.product_name ?? "—"}</td>
                  <td className="py-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setManaging(c)}
                    >
                      Gerenciar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Anterior
          </button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Próximo
          </button>
        </div>
      )}

      {managing && (
        <ClientManageModal
          client={managing}
          onClose={() => setManaging(null)}
        />
      )}
    </GlassCard>
  );
}

export default function CadastrarClientePage() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<CadastroClienteInput>({
    resolver: zodResolver(cadastroClienteSchema),
    mode: "onTouched",
  });

  const password = watch("password") ?? "";

  const mut = useMutation({
    mutationFn: adminClientes.create,
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin", "clientes"] });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error("Email já cadastrado.");
      } else {
        toast.error("Erro ao cadastrar cliente.");
      }
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Cadastrar Cliente</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Cria uma nova conta de cliente na plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">
        {/* Left — form */}
        <GlassCard variant="solid" className="space-y-4">
          <form
            onSubmit={handleSubmit((d) => mut.mutate(d))}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name")} placeholder="Nome completo" />
              {errors.name && (
                <p className="text-xs text-danger">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                {...register("email")}
                placeholder="cliente@email.com"
              />
              {errors.email && (
                <p className="text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                {...register("password")}
              />
              <PasswordStrengthIndicator password={password} />
              {errors.password && (
                <p className="text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    international
                    defaultCountry="BR"
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v ?? "")}
                    className="flex h-9 items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50
                    [&_.PhoneInputCountry]:flex
                    [&_.PhoneInputCountry]:items-center
                    [&_.PhoneInputCountry]:pl-2
                    [&_.PhoneInputCountry]:gap-1
                    [&_.PhoneInputCountryIcon]:size-5
                    [&_.PhoneInputCountrySelect]:border-0
                    [&_.PhoneInputCountrySelect]:bg-transparent
                    [&_.PhoneInputCountrySelect]:text-foreground
                    [&_.PhoneInputCountrySelect]:outline-none
                    [&_.PhoneInputCountrySelect]:text-sm
                    [&_.PhoneInputCountrySelect]:px-1
                    [&_.PhoneInputInput]:flex-1
                    [&_.PhoneInputInput]:h-full
                    [&_.PhoneInputInput]:border-0
                    [&_.PhoneInputInput]:bg-transparent
                    [&_.PhoneInputInput]:px-2.5
                    [&_.PhoneInputInput]:text-sm
                    [&_.PhoneInputInput]:outline-none
                    [&_.PhoneInputInput]:ring-0
                    [&_.PhoneInputInput]:shadow-none
                    [&_.PhoneInputInput]:focus:outline-none
                    [&_.PhoneInputInput]:focus:ring-0
                    [&_.PhoneInputInput]:focus:shadow-none
                    [&_.PhoneInputInput]:placeholder:text-muted-foreground"
                  />
                )}
              />
              {errors.phone && (
                <p className="text-xs text-danger">{errors.phone.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || mut.isPending}
              className="w-full"
            >
              {mut.isPending ? "Cadastrando..." : "Cadastrar cliente"}
            </Button>
          </form>
        </GlassCard>

        {/* Right — clients table */}
        <ClientesTable />
      </div>
    </div>
  );
}
