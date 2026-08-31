"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/utils/validations";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
  reason?: string;
}

const REASON_MESSAGES: Record<string, string> = {
  inactive: "Sua conta está inativa. Contate o administrador da akeel.",
  expired: "Sua sessão expirou, entre novamente.",
};

export function LoginForm({ reason }: LoginFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.senha,
      });

      if (error) {
        if (
          error.message === "Invalid login credentials" ||
          error.message.toLowerCase().includes("invalid")
        ) {
          toast.error("Email ou senha incorretos.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Email não confirmado. Contate o administrador.");
        } else if (
          error.message.toLowerCase().includes("rate") ||
          error.message.toLowerCase().includes("too many")
        ) {
          toast.error("Muitas tentativas, aguarde alguns minutos.");
        } else {
          toast.error("Erro ao entrar. Tente novamente.");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass p-8 space-y-6">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/logos/normal/logo-azul.svg"
          alt="HUB"
          width={180}
          height={50}
          priority
          className="h-12 w-auto dark:hidden"
        />
        <Image
          src="/logos/normal/logo-verde.svg"
          alt="HUB"
          width={180}
          height={50}
          priority
          className="hidden h-12 w-auto dark:block"
        />
        <h1 className="text-xl font-semibold">Entrar</h1>
      </div>

      {reason && REASON_MESSAGES[reason] && (
        <div className="rounded-lg bg-warning/15 border border-warning/30 px-4 py-3 text-sm text-warning">
          {REASON_MESSAGES[reason]}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-danger">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="senha">Senha</Label>
          <PasswordInput
            id="senha"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("senha")}
            aria-invalid={!!errors.senha}
          />
          {errors.senha && (
            <p className="text-xs text-danger">{errors.senha.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          disabled={loading || !isValid}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
