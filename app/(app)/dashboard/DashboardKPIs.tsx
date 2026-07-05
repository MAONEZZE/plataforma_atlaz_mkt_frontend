"use client";

import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/glass/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getSheet, getCellValue } from "@/lib/api/metricas";

interface DashboardKPIsProps {
  mes: string;
}

export function DashboardKPIs({ mes }: DashboardKPIsProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["metricas", "planilha", mes],
    queryFn: () => getSheet(mes),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
        Erro ao carregar KPIs.
        <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
      </div>
    );
  }

  if (data.columns.length === 0) return null;

  const cards = data.columns.map((c) => {
    const total = data.days.reduce((sum, day) => sum + (getCellValue(data, c.id, day) ?? 0), 0);
    return { id: c.id, label: c.name, unit: c.unit, total };
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <GlassCard key={c.id} variant="soft" className="flex flex-col gap-3">
          <span className="text-sm text-muted-foreground">{c.label}</span>
          <p className="text-3xl font-bold text-foreground">
            {c.total.toLocaleString("pt-BR")}
            <span className="text-sm font-normal text-muted-foreground ml-1">{c.unit}</span>
          </p>
        </GlassCard>
      ))}
    </div>
  );
}
