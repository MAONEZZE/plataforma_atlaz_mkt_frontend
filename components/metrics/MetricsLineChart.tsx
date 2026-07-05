"use client";

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
import { getCellValue, type SheetOut } from "@/lib/api/metricas";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "#3B82F6",
  "#F59E0B",
  "#10B981",
  "#EC4899",
  "#8B5CF6",
];

interface MetricsLineChartProps {
  sheet: SheetOut;
}

export function MetricsLineChart({ sheet }: MetricsLineChartProps) {
  const columns = [...sheet.columns].sort((a, b) => a.order - b.order);
  const chartData = sheet.days.map((day) => ({
    day: format(parseISO(day), "dd/MM", { locale: ptBR }),
    ...Object.fromEntries(columns.map((c) => [c.id, getCellValue(sheet, c.id, day) ?? 0])),
  }));

  return (
    <GlassCard variant="solid" className="space-y-2">
      <h2 className="font-semibold">Histórico diário</h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {columns.map((c, i) => (
            <Line
              key={c.id}
              type="monotone"
              dataKey={c.id}
              name={c.name}
              stroke={PALETTE[i % PALETTE.length]}
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
