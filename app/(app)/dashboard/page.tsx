import { redirect } from "next/navigation";
import axios from "axios";
import { DashboardActions } from "./DashboardActions";
import { DashboardKPIs } from "./DashboardKPIs";
import { DashboardChart } from "./DashboardChart";
import { DashboardTable } from "./DashboardTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Usuario } from "@/lib/api/types";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let role: Usuario["role"] | null = null;
  if (session) {
    try {
      const { data: me } = await axios.get<Usuario>(
        `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/v1/me`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      role = me.role;
    } catch (err) {
      if (!axios.isAxiosError(err)) throw err;
      // 401/403/etc handled by (app)/layout.tsx — fall through
    }
  }
  if (role === "admin") redirect("/admin/dashboard");
  const mes = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">Suas métricas de {mes}</p>
        </div>
        <DashboardActions />
      </div>
      <DashboardKPIs />
      <DashboardChart />
      <DashboardTable />
    </div>
  );
}
