import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { reason } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6 min-h-screen">
      <div className="w-full max-w-sm">
        <LoginForm inactiveReason={reason === "inactive"} />
      </div>
    </main>
  );
}
