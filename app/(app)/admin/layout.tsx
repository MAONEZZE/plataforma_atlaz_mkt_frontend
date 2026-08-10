import { redirect } from "next/navigation";
import axios from "axios";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Usuario } from "@/lib/api/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: me } = await axios.get<Usuario>(
    `https://hub-api.akeel.com.br`,
    { headers: { Authorization: `Bearer ${session.access_token}` } },
  );

  if (me.role !== "admin") redirect("/dashboard");

  return <>{children}</>;
}
