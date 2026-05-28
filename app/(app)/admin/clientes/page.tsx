"use client";

import { useState } from "react";
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
import { adminClientes } from "@/lib/api/admin";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { PasswordStrengthIndicator } from "@/components/forms/PasswordStrengthIndicator";

const PAGE_SIZE = 20;

function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  return phone.startsWith("+") ? phone : `+${phone}`;
}

function ClientesTable() {
  const [page, setPage] = useState(1);
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
          <table className="w-full text-sm">
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
                  <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{c.email}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{formatPhone(c.phone)}</td>
                  {c.created_at && (
                    <td className="py-2.5 text-muted-foreground text-xs">
                      {format(parseISO(c.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                  )}
                  <td className="py-2.5 pr-4 text-muted-foreground text-xs">{c.product_name ?? "—"}</td>
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
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
      {/* Left — form */}
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Cadastrar Cliente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cria uma nova conta de cliente na plataforma.
          </p>
        </div>

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
      </div>

      {/* Right — clients table */}
      <ClientesTable />
    </div>
  );
}
