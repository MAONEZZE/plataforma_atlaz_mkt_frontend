import { NovaMetricaDialog } from "./NovaMetricaDialog";
import { DashboardKPIs } from "./DashboardKPIs";
import { DashboardChart } from "./DashboardChart";
import { DashboardTable } from "./DashboardTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DashboardPage() {
  const mes = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">Suas métricas de {mes}</p>
        </div>
        <NovaMetricaDialog />
      </div>
      <DashboardKPIs />
      <DashboardChart />
      <DashboardTable />
    </div>
  );
}
