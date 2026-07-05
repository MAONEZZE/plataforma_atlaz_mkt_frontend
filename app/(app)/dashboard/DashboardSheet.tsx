"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/data/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthPicker } from "@/components/forms/MonthPicker";
import { PlanilhaView } from "@/components/metrics/PlanilhaView";
import { DashboardActions } from "./DashboardActions";
import { ColumnDialog } from "./ColumnDialog";
import { DeleteColumnDialog } from "@/components/forms/DeleteColumnDialog";
import { getSheet, putCell, deleteCell, type SheetOut, type MetricOut } from "@/lib/api/metricas";

interface DashboardSheetProps {
  mes: string;
  onMonthChange: (mes: string) => void;
}

export function DashboardSheet({ mes, onMonthChange }: DashboardSheetProps) {
  const queryClient = useQueryClient();
  const [editingColumn, setEditingColumn] = useState<MetricOut | null>(null);
  const [deletingColumn, setDeletingColumn] = useState<MetricOut | null>(null);

  const queryKey = ["metricas", "planilha", mes];
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => getSheet(mes),
  });

  async function handleCellCommit(metricId: string, day: string, value: number | null) {
    const previous = queryClient.getQueryData<SheetOut>(queryKey);
    queryClient.setQueryData<SheetOut>(queryKey, (old) => {
      if (!old) return old;
      const entries = { ...old.entries };
      const col = { ...(entries[metricId] ?? {}) };
      if (value === null) delete col[day];
      else col[day] = value;
      entries[metricId] = col;
      return { ...old, entries };
    });
    try {
      if (value === null) await deleteCell(metricId, day);
      else await putCell(metricId, day, value);
    } catch {
      queryClient.setQueryData(queryKey, previous);
      toast.error("Erro ao salvar valor.");
    } finally {
      queryClient.invalidateQueries({ queryKey });
    }
  }

  function handleEditColumn(metricId: string) {
    const col = data?.columns.find((c) => c.id === metricId);
    if (col) setEditingColumn(col);
  }

  function handleDeleteColumn(metricId: string) {
    const col = data?.columns.find((c) => c.id === metricId);
    if (col) setDeletingColumn(col);
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-end gap-2">
          <DashboardActions />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-end gap-2">
          <DashboardActions />
        </div>
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
          Erro ao carregar planilha.
          <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <DashboardActions />
      </div>
      <GlassCard variant="solid" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Planilha de métricas</h2>
          <MonthPicker value={mes} onChange={onMonthChange} />
        </div>

        {data.columns.length === 0 ? (
          <EmptyState
            title="Você ainda não criou nenhuma métrica."
            description="Crie uma coluna pra começar a lançar valores diários."
          />
        ) : (
          <PlanilhaView
            sheet={data}
            onCellCommit={handleCellCommit}
            onEditColumn={handleEditColumn}
            onDeleteColumn={handleDeleteColumn}
          />
        )}
      </GlassCard>

      <ColumnDialog
        mode="edit"
        metric={editingColumn ?? undefined}
        open={!!editingColumn}
        onOpenChange={(o) => !o && setEditingColumn(null)}
      />
      <DeleteColumnDialog
        metric={deletingColumn}
        open={!!deletingColumn}
        onOpenChange={(o) => !o && setDeletingColumn(null)}
      />
    </div>
  );
}
