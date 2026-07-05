"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { deleteMetricColumn, type MetricOut } from "@/lib/api/metricas";

interface DeleteColumnDialogProps {
  metric: MetricOut | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteColumnDialog({ metric, open, onOpenChange }: DeleteColumnDialogProps) {
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: () => {
      if (!metric) return Promise.reject(new Error("no metric selected"));
      return deleteMetricColumn(metric.id);
    },
    onSuccess: () => {
      toast.success("Coluna apagada.");
      queryClient.invalidateQueries({ queryKey: ["metricas"] });
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao apagar coluna."),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar coluna &quot;{metric?.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os valores lançados nessa coluna, em todos os meses, serão apagados permanentemente.
            Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "Apagando..." : "Apagar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
