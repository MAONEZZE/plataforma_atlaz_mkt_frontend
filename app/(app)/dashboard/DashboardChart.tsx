"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GlassCard } from "@/components/glass/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardSeries } from "@/lib/api/metricas";

const SERIES = [
  { key: "meetings_held", label: "Reun. Realizada", color: "var(--chart-1)" },
  { key: "calls_made", label: "Lig. Realizada", color: "var(--chart-2)" },
  { key: "sales", label: "Vendas", color: "var(--chart-3)" },
  { key: "referrals", label: "Indicações", color: "#3B82F6" },
] as const;

export function DashboardChart() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "series"],
    queryFn: getDashboardSeries,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (isError || !data || !Array.isArray(data)) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
        Erro ao carregar gráfico.
        <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
      </div>
    );
  }

  const chartData = data
    .filter((d) => typeof d?.week === "string" && d.week.length > 0)
    .map((d) => ({
      ...d,
      week: format(parseISO(d.week), "dd/MM", { locale: ptBR }),
    }));

  return (
    <GlassCard variant="solid" className="space-y-2">
      <h2 className="font-semibold">Histórico semanal</h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
