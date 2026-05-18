"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  { name: "ligacoes_agendadas" as const, label: "Ligações Agendadas" },
  { name: "ligacoes_realizadas" as const, label: "Ligações Realizadas" },
  { name: "reunioes_agendadas" as const, label: "Reuniões Agendadas" },
  { name: "indicacoes" as const, label: "Indicações" },
];

export function MetricasForm({ mode, metricaId, onSuccess, onCancel }: MetricasFormProps) {
  const router = useRouter();
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
      ligacoes_agendadas: 0,
      ligacoes_realizadas: 0,
      reunioes_agendadas: 0,
      indicacoes: 0,
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
        semana_inicio: existingMetrica.semana_inicio,
        ligacoes_agendadas: existingMetrica.ligacoes_agendadas,
        ligacoes_realizadas: existingMetrica.ligacoes_realizadas,
        reunioes_agendadas: existingMetrica.reunioes_agendadas,
        indicacoes: existingMetrica.indicacoes,
      });
    }
  }, [existingMetrica, reset]);

  const mut = useMutation({
    mutationFn: async (data: MetricaFormInput) => {
      const payload: MetricaInput = {
        semana_inicio: data.semana_inicio,
        ligacoes_agendadas: data.ligacoes_agendadas,
        ligacoes_realizadas: data.ligacoes_realizadas,
        reunioes_agendadas: data.reunioes_agendadas,
        indicacoes: data.indicacoes,
      };
      if (mode === "edit" && metricaId) {
        return updateMetrica(metricaId, payload);
      }
      return createMetrica(payload);
    },
    onSuccess: () => {
      toast.success("Métricas salvas!");
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
      : `Editar métricas${existingMetrica ? ` — Semana de ${existingMetrica.semana_inicio}` : ""}`;

  return (
    <>
      <GlassCard variant="solid" className="space-y-6">
        <h1 className="text-xl font-semibold">{title}</h1>

        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-6" noValidate>
          {/* Semana */}
          <div className="space-y-1.5">
            <Label>Semana</Label>
            <Controller
              name="semana_inicio"
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
            {errors.semana_inicio && (
              <p className="text-xs text-danger">{errors.semana_inicio.message}</p>
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
        <AlertDialogContent className="glass">
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
