"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardKPIs } from "./DashboardKPIs";
import { DashboardChart } from "./DashboardChart";
import { DashboardSheet } from "./DashboardSheet";

interface DashboardContentProps {
  initialMes: string;
}

export function DashboardContent({ initialMes }: DashboardContentProps) {
  const [mes, setMes] = useState(initialMes);
  const router = useRouter();

  function handleMonthChange(next: string) {
    setMes(next);
    router.replace(`/dashboard?mes=${next}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Sua planilha de métricas</p>
      </div>
      <DashboardKPIs mes={mes} />
      <DashboardChart mes={mes} />
      <DashboardSheet mes={mes} onMonthChange={handleMonthChange} />
    </div>
  );
}
