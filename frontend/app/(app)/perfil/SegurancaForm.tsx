"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { PasswordStrengthIndicator } from "@/components/forms/PasswordStrengthIndicator";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    senhaAtual: z.string().min(1, "Obrigatório."),
    novaSenha: z
      .string()
      .regex(
        /^(?=.*[A-Z])(?=.*\d).{8,}$/,
        "Mínimo 8 caracteres, 1 maiúscula e 1 número.",
      ),
    confirmar: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: "Senhas não coincidem.",
    path: ["confirmar"],
  });

type FormData = z.infer<typeof schema>;

export function SegurancaForm() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const novaSenha = watch("novaSenha") ?? "";

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Sessão inválida.");
        return;
      }

      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.senhaAtual,
      });
      if (verifyErr) {
        toast.error("Senha atual incorreta.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: data.novaSenha });
      if (error) {
        toast.error("Erro ao atualizar senha: " + error.message);
        return;
      }

      toast.success("Senha atualizada com sucesso.");
      reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard variant="solid" className="max-w-md space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label>Senha atual</Label>
          <PasswordInput {...register("senhaAtual")} autoComplete="current-password" />
          {errors.senhaAtual && (
            <p className="text-xs text-danger">{errors.senhaAtual.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Nova senha</Label>
          <PasswordInput {...register("novaSenha")} autoComplete="new-password" />
          <PasswordStrengthIndicator password={novaSenha} />
          {errors.novaSenha && (
            <p className="text-xs text-danger">{errors.novaSenha.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Confirmar nova senha</Label>
          <PasswordInput {...register("confirmar")} autoComplete="new-password" />
          {errors.confirmar && (
            <p className="text-xs text-danger">{errors.confirmar.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || loading}
          className="w-full"
        >
          {loading ? "Atualizando..." : "Atualizar senha"}
        </Button>
      </form>
    </GlassCard>
  );
}
