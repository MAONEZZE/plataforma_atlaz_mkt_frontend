"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getSheet } from "@/lib/api/metricas";
import { MetricsLineChart } from "@/components/metrics/MetricsLineChart";

interface DashboardChartProps {
  mes: string;
}

export function DashboardChart({ mes }: DashboardChartProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["metricas", "planilha", mes],
    queryFn: () => getSheet(mes),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
        Erro ao carregar gráfico.
        <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
      </div>
    );
  }

  if (data.columns.length === 0) return null;

  return <MetricsLineChart sheet={data} />;
}
