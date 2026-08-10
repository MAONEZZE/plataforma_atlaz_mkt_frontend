import { redirect } from "next/navigation";
import axios from "axios";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthHydration } from "@/components/providers/auth-hydration";
import { Navbar } from "@/components/layout/Navbar";
import type { Usuario } from "@/lib/api/types";
const urls = ["https://hub-api.akeel.com.br", "http://localhost:8000"];

async function fetchMe(accessToken: string): Promise<Usuario | null> {
  try {
    const { data } = await axios.get<Usuario>(
      urls[0],
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401 || status === 403) return null;
    }
    throw err;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const me = await fetchMe(session.access_token);
  if (!me) {
    await supabase.auth.signOut();
    redirect("/login?reason=inactive");
  }

  return (
    <>
      <AuthHydration user={me} />
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-20 pb-6">
        {children}
      </main>
    </>
  );
}
