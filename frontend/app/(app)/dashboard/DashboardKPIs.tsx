"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, Phone, Users, UserPlus } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardResumo, type DeltaOut } from "@/lib/api/metricas";

function DeltaBadge({ delta_pct }: { delta_pct: number | null }) {
  if (delta_pct === null) return null;
  if (delta_pct > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-success">
        <TrendingUp className="size-3" />
        {delta_pct.toFixed(1)}%
      </span>
    );
  if (delta_pct < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-danger">
        <TrendingDown className="size-3" />
        {Math.abs(delta_pct).toFixed(1)}%
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="size-3" />
      0%
    </span>
  );
}

interface KPICardProps {
  label: string;
  delta: DeltaOut;
  icon: React.ReactNode;
}

function KPICard({ label, delta, icon }: KPICardProps) {
  return (
    <GlassCard variant="soft" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-primary opacity-70">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-foreground">{delta.valor.toLocaleString("pt-BR")}</p>
      <DeltaBadge delta_pct={delta.delta_pct} />
    </GlassCard>
  );
}

export function DashboardKPIs() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "resumo"],
    queryFn: getDashboardResumo,
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

  const cards = [
    { label: "Ligações Agendadas", delta: data.ligacoes_agendadas, icon: <Phone className="size-5" /> },
    { label: "Ligações Realizadas", delta: data.ligacoes_realizadas, icon: <TrendingUp className="size-5" /> },
    { label: "Reuniões Agendadas", delta: data.reunioes_agendadas, icon: <Users className="size-5" /> },
    { label: "Indicações", delta: data.indicacoes, icon: <UserPlus className="size-5" /> },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => <KPICard key={c.label} {...c} />)}
    </div>
  );
}
