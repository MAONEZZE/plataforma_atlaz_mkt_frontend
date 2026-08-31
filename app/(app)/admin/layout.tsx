import { redirect } from "next/navigation";
import axios from "axios";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiBaseUrl } from "@/lib/utils";
import type { Usuario } from "@/lib/api/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // 401/403 (sessão expirada/conta inativa) já são tratados pelo guard em
  // (app)/layout.tsx, que roda antes deste layout — aqui só relançamos.
  let me: Usuario;
  try {
    const { data } = await axios.get<Usuario>(
      `${apiBaseUrl()}/api/v1/me`,
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    );
    me = data;
  } catch (err) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      redirect("/dashboard");
    }
    throw err;
  }

  if (me.role !== "admin") redirect("/dashboard");

  return <>{children}</>;
}
