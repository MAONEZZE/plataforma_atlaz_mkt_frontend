import { redirect } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Usuario } from "@/lib/api/types";
import { DashboardContent } from "./DashboardContent";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
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
  if (role === "admin") redirect("/admin/clientes");

  const { mes: mesParam } = await searchParams;
  const mes = mesParam ?? format(new Date(), "yyyy-MM");

  return <DashboardContent initialMes={mes} />;
}
