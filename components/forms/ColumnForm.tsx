"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { createMetricColumn, updateMetricColumn, type MetricOut } from "@/lib/api/metricas";
import { columnSchema, type ColumnFormInput } from "@/lib/utils/validations";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ColumnFormProps {
  mode: "create" | "edit";
  metric?: MetricOut;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ColumnForm({ mode, metric, onSuccess, onCancel }: ColumnFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ColumnFormInput>({
    resolver: zodResolver(columnSchema),
    mode: "onTouched",
    defaultValues: { name: metric?.name ?? "" },
  });

  useEffect(() => {
    if (metric) reset({ name: metric.name });
  }, [metric, reset]);

  const mut = useMutation({
    mutationFn: (data: ColumnFormInput) =>
      mode === "edit" && metric ? updateMetricColumn(metric.id, data) : createMetricColumn(data),
    onSuccess: () => {
      toast.success(mode === "edit" ? "Coluna atualizada!" : "Coluna criada!");
      queryClient.invalidateQueries({ queryKey: ["metricas"] });
      onSuccess?.();
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        toast.error(err.response.data.error.message);
        return;
      }
      toast.error("Erro ao salvar coluna.");
    },
  });

  return (
    <GlassCard variant="solid" className="space-y-6">
      <h1 className="text-xl font-semibold">{mode === "create" ? "Nova coluna" : "Editar coluna"}</h1>

      <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...register("name")} placeholder="Ex: Ligações" />
          {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Cancelar
          </button>
          <Button type="submit" variant="primary" disabled={!isValid || isSubmitting || mut.isPending}>
            {isSubmitting || mut.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
