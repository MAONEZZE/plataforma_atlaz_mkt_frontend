import { redirect } from "next/navigation";
import axios from "axios";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Usuario } from "@/lib/api/types";

const urls = ["https://hub-api.akeel.com.br", "http://localhost:8000"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: me } = await axios.get<Usuario>(
    urls[0],
    { headers: { Authorization: `Bearer ${session.access_token}` } },
  );

  if (me.role !== "admin") redirect("/dashboard");

  return <>{children}</>;
}
