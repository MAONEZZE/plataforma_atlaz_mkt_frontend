"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO, addDays, isAfter, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GlassCard } from "@/components/glass/GlassCard";
import { DataTable } from "@/components/data/DataTable";
import { EmptyState } from "@/components/data/EmptyState";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MetricasForm } from "@/components/forms/MetricasForm";
import { listMetricas, type MetricaSemanal } from "@/lib/api/metricas";

const PAGE_SIZE = 10;

function weekLabel(isoDate: string | undefined | null): string {
  if (!isoDate || typeof isoDate !== "string") return "—";
  const monday = parseISO(isoDate);
  if (isNaN(monday.getTime())) return "—";
  const sunday = addDays(monday, 6);
  return `${format(monday, "dd/MM", { locale: ptBR })} a ${format(sunday, "dd/MM", { locale: ptBR })}`;
}

function isEditable(semanaInicio: string | undefined | null): boolean {
  if (!semanaInicio || typeof semanaInicio !== "string") return false;
  const monday = parseISO(semanaInicio);
  if (isNaN(monday.getTime())) return false;
  const cutoff = subWeeks(new Date(), 4);
  return isAfter(monday, cutoff);
}

export function DashboardTable() {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["metricas", page],
    queryFn: () => listMetricas({ page, page_size: PAGE_SIZE }),
  });

  const columns: ColumnDef<MetricaSemanal>[] = [
    {
      accessorKey: "week_start",
      header: "Semana",
      cell: ({ row }) => weekLabel(row.original.week_start),
    },
    { accessorKey: "meetings_held", header: "Reun. Realizada" },
    { accessorKey: "calls_made", header: "Lig. Realizada" },
    { accessorKey: "sales", header: "Vendas" },
    { accessorKey: "referrals", header: "Indicações" },
    {
      id: "acoes",
      header: "",
      cell: ({ row }) => {
        const editable = isEditable(row.original.week_start);
        return editable ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingId(row.original.id)}
          >
            Editar
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex cursor-not-allowed">
                  <Button size="sm" variant="outline" disabled>Editar</Button>
                </span>
              }
            />
            <TooltipContent>Período de edição encerrado</TooltipContent>
          </Tooltip>
        );
      },
    },
  ];

  if (isError) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
        Erro ao carregar métricas.
        <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <>
      <GlassCard variant="solid" className="space-y-4">
        <h2 className="font-semibold">Histórico de métricas</h2>
        <DataTable
          data={data?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              title="Você ainda não cadastrou métricas."
              action={{ label: "Cadastrar primeira métrica", onClick: () => router.push("/metricas/nova") }}
            />
          }
          pagination={
            data
              ? { page, pageSize: PAGE_SIZE, total: data.total, onChange: setPage }
              : undefined
          }
        />
      </GlassCard>

      <Dialog open={!!editingId} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent className="glass max-w-lg" showCloseButton={false}>
          <MetricasForm
            mode="edit"
            metricaId={editingId ?? undefined}
            onSuccess={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
