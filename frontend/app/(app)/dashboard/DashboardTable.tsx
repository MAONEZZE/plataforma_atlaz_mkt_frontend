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
import { listMetricas, type MetricaSemanal } from "@/lib/api/metricas";

const PAGE_SIZE = 10;

function weekLabel(isoDate: string): string {
  const monday = parseISO(isoDate);
  const sunday = addDays(monday, 6);
  return `${format(monday, "dd/MM", { locale: ptBR })} a ${format(sunday, "dd/MM", { locale: ptBR })}`;
}

function isEditable(semanaInicio: string): boolean {
  const monday = parseISO(semanaInicio);
  const cutoff = subWeeks(new Date(), 4);
  return isAfter(monday, cutoff);
}

export function DashboardTable() {
  const [page, setPage] = useState(1);
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["metricas", page],
    queryFn: () => listMetricas({ page, page_size: PAGE_SIZE }),
  });

  const columns: ColumnDef<MetricaSemanal>[] = [
    {
      accessorKey: "semana_inicio",
      header: "Semana",
      cell: ({ row }) => weekLabel(row.original.semana_inicio),
    },
    { accessorKey: "ligacoes_agendadas", header: "Lig. Agendadas" },
    { accessorKey: "ligacoes_realizadas", header: "Lig. Realizadas" },
    { accessorKey: "reunioes_agendadas", header: "Reuniões" },
    { accessorKey: "indicacoes", header: "Indicações" },
    {
      id: "acoes",
      header: "",
      cell: ({ row }) => {
        const editable = isEditable(row.original.semana_inicio);
        return editable ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/metricas/${row.original.id}/editar`)}
          >
            Editar
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger className="cursor-not-allowed">
              <Button size="sm" variant="outline" disabled>Editar</Button>
            </TooltipTrigger>
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
  );
}
