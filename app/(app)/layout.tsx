import { redirect } from "next/navigation";
import axios from "axios";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthHydration } from "@/components/providers/auth-hydration";
import { AppShell } from "@/components/layout/app-shell";
import { apiBaseUrl } from "@/lib/utils";
import type { Usuario } from "@/lib/api/types";

type MeResult =
  | { ok: true; user: Usuario }
  | { ok: false; reason: "expired" | "inactive" };

async function fetchMe(accessToken: string): Promise<MeResult> {
  try {
    const { data } = await axios.get<Usuario>(
      `${apiBaseUrl()}/api/v1/me`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return { ok: true, user: data };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) return { ok: false, reason: "expired" };
      if (status === 403) return { ok: false, reason: "inactive" };
    }
    throw err;
  }
}

// O guard vive aqui, no layout do route group — não em cada página.
// As rotas públicas ficam em (auth) e não montam o shell.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  // getUser() valida o token contra o Supabase e renova o cookie quando
  // possível — getSession() só decodifica o que já está no cookie.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const result = await fetchMe(session.access_token);
  if (!result.ok) {
    // signOut() aqui não limpa cookie de verdade (Server Component); o
    // Route Handler faz isso e redireciona com o motivo certo.
    redirect(`/auth/logout?reason=${result.reason}`);
  }

  return (
    <>
      <AuthHydration user={result.user} />
      <AppShell user={result.user}>{children}</AppShell>
    </>
  );
}
