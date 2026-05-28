"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { startOfWeek, subDays } from "date-fns";
import axios from "axios";
import {
  createMetrica,
  updateMetrica,
  listMetricas,
  type MetricaInput,
} from "@/lib/api/metricas";
import { metricaSchema, type MetricaFormInput } from "@/lib/utils/validations";
import { WeekPicker } from "./WeekPicker";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

interface MetricasFormProps {
  mode: "create" | "edit";
  metricaId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const NUMERIC_FIELDS = [
  { name: "calls_scheduled" as const, label: "Reuniões Realizadas" },
  { name: "calls_made" as const, label: "Ligações Realizadas" },
  { name: "meetings_scheduled" as const, label: "Vendas" },
  { name: "referrals" as const, label: "Indicações" },
];

export function MetricasForm({ mode, metricaId, onSuccess, onCancel }: MetricasFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const today = new Date();
  const maxDate = startOfWeek(today, { weekStartsOn: 1 });
  const minDate = startOfWeek(subDays(today, 28), { weekStartsOn: 1 });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<MetricaFormInput>({
    resolver: zodResolver(metricaSchema),
    mode: "onTouched",
    defaultValues: {
      calls_scheduled: 0,
      calls_made: 0,
      meetings_scheduled: 0,
      referrals: 0,
    },
  });

  const { data: existingMetrica, isLoading } = useQuery({
    queryKey: ["metrica", metricaId],
    queryFn: async () => {
      if (!metricaId) return null;
      const { items } = await listMetricas({ page: 1, page_size: 100 });
      return items.find((m) => m.id === metricaId) ?? null;
    },
    enabled: mode === "edit" && !!metricaId,
  });

  useEffect(() => {
    if (existingMetrica) {
      reset({
        week_start: existingMetrica.week_start,
        calls_scheduled: existingMetrica.calls_scheduled,
        calls_made: existingMetrica.calls_made,
        meetings_scheduled: existingMetrica.meetings_scheduled,
        referrals: existingMetrica.referrals,
      });
    }
  }, [existingMetrica, reset]);

  const mut = useMutation({
    mutationFn: async (data: MetricaFormInput) => {
      const payload: MetricaInput = {
        week_start: data.week_start,
        calls_scheduled: data.calls_scheduled,
        calls_made: data.calls_made,
        meetings_scheduled: data.meetings_scheduled,
        referrals: data.referrals,
      };
      if (mode === "edit" && metricaId) {
        return updateMetrica(metricaId, payload);
      }
      return createMetrica(payload);
    },
    onSuccess: () => {
      toast.success("Métricas salvas!");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["metricas"] });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          const existingId = err.response.data?.error?.details?.id as string | undefined;
          toast.info("Métricas dessa semana já existem. Carregando para edição...");
          if (existingId) {
            onSuccess?.();
            router.push(`/metricas/${existingId}/editar`);
          }
          return;
        }
        if (err.response?.status === 422) {
          toast.error(err.response.data?.error?.message ?? "Regra de negócio violada.");
          return;
        }
      }
      toast.error("Erro ao salvar métricas.");
    },
  });

  function handleCancel() {
    if (isDirty) {
      setCancelConfirm(true);
    } else if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard");
    }
  }

  function handleConfirmDiscard() {
    setCancelConfirm(false);
    if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard");
    }
  }

  if (mode === "edit" && isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const title =
    mode === "create"
      ? "Cadastrar métricas da semana"
      : `Editar métricas${existingMetrica ? ` — Semana de ${existingMetrica.week_start}` : ""}`;

  return (
    <>
      <GlassCard variant="solid" className="space-y-6">
        <h1 className="text-xl font-semibold">{title}</h1>

        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-6" noValidate>
          {/* Semana */}
          <div className="space-y-1.5">
            <Label>Semana</Label>
            <Controller
              name="week_start"
              control={control}
              render={({ field }) => (
                <WeekPicker
                  value={field.value ? new Date(field.value) : null}
                  onChange={(d) => field.onChange(d.toISOString().split("T")[0])}
                  minDate={minDate}
                  maxDate={maxDate}
                  disabled={mode === "edit"}
                />
              )}
            />
            {errors.week_start && (
              <p className="text-xs text-danger">{errors.week_start.message}</p>
            )}
          </div>

          {/* Campos numéricos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {NUMERIC_FIELDS.map(({ name, label }) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  type="number"
                  min={0}
                  step={1}
                  {...register(name, { valueAsNumber: true })}
                />
                {errors[name] && (
                  <p className="text-xs text-danger">{errors[name]?.message}</p>
                )}
              </div>
            ))}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting || mut.isPending}
            >
              {isSubmitting || mut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </GlassCard>

      <AlertDialog open={cancelConfirm} onOpenChange={setCancelConfirm}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja sair?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
