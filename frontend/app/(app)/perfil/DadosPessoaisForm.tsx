"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { isValidPhoneNumber } from "react-phone-number-input";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getMe, updateMe, uploadFoto } from "@/lib/api/me";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useAuthStore } from "@/lib/auth/store";
import { MentoradoCard } from "@/components/community/MentoradoCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/glass/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  nome: z.string().min(1, "Nome obrigatório."),
  telefone: z
    .string()
    .optional()
    .refine((v) => !v || isValidPhoneNumber(v), "Telefone inválido."),
  linkedin_url: z
    .string()
    .optional()
    .refine((v) => !v || v.includes("linkedin.com"), "URL deve conter linkedin.com"),
  instagram_username: z
    .string()
    .optional()
    .refine((v) => !v || /^[a-zA-Z0-9_.]{1,30}$/.test(v), "Usuário inválido (sem @)"),
  descricao: z
    .string()
    .max(250, "Máximo 250 caracteres.")
    .optional(),
});
type FormData = z.infer<typeof schema>;

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function DadosPessoaisForm() {
  const user = useCurrentUser();
  const setUser = useAuthStore((s) => s.setUser);
  const patchUser = useAuthStore((s) => s.patchUser);
  const [emailModal, setEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: user?.nome ?? "",
      telefone: user?.telefone ?? "",
      linkedin_url: user?.linkedin_url ?? "",
      instagram_username: user?.instagram_username ?? "",
      descricao: user?.descricao ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        nome: user.nome,
        telefone: user.telefone ?? "",
        linkedin_url: user.linkedin_url ?? "",
        instagram_username: user.instagram_username ?? "",
        descricao: user.descricao ?? "",
      });
    }
  }, [user?.id]); // eslint-disable-line

  const formValues = watch();

  const saveMut = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Alterações salvas!");
    },
    onError: () => toast.error("Erro ao salvar alterações."),
  });

  const fotoMut = useMutation({
    mutationFn: async (file: File) => {
      await uploadFoto(file);
      return getMe();
    },
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Foto atualizada!");
    },
    onError: () => toast.error("Erro ao enviar foto."),
  });

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    fotoMut.mutate(file);
  }

  async function handleEmailChange() {
    if (!newEmail) return;
    setEmailLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Email atualizado. Você pode precisar confirmar no email enviado.");
      setEmailModal(false);
      setNewEmail("");
    } catch {
      toast.error("Erro ao atualizar email.");
    } finally {
      setEmailLoading(false);
    }
  }

  if (!user) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <GlassCard variant="solid" className="space-y-5">
        {/* Foto */}
        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            {user.foto_url && <AvatarImage src={user.foto_url} />}
            <AvatarFallback className="text-xl font-medium bg-primary/10 text-primary">
              {initials(user.nome)}
            </AvatarFallback>
          </Avatar>
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFotoChange} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-primary hover:underline"
              disabled={fotoMut.isPending}
            >
              {fotoMut.isPending ? "Enviando..." : "Alterar foto"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => saveMut.mutate(d))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input {...register("nome")} />
            {errors.nome && <p className="text-xs text-danger">{errors.nome.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <div className="flex gap-2">
              <Input value={user.email} readOnly disabled className="flex-1 opacity-70" />
              <Dialog open={emailModal} onOpenChange={setEmailModal}>
                <DialogTrigger className="text-sm text-primary hover:underline px-2 whitespace-nowrap">
                  Alterar email
                </DialogTrigger>
                <DialogContent className="glass">
                  <DialogHeader>
                    <DialogTitle>Alterar email</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-1.5">
                    <Label>Novo email</Label>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="novo@email.com"
                    />
                  </div>
                  <DialogFooter>
                    <button
                      type="button"
                      onClick={() => setEmailModal(false)}
                      className="text-sm text-muted-foreground px-3"
                    >
                      Cancelar
                    </button>
                    <Button
                      variant="primary"
                      onClick={handleEmailChange}
                      disabled={!newEmail || emailLoading}
                    >
                      {emailLoading ? "Salvando..." : "Salvar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Controller
              name="telefone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  international
                  defaultCountry="BR"
                  value={field.value ?? ""}
                  onChange={(v) => field.onChange(v ?? "")}
                  className="flex h-9 items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 
                  [&_.PhoneInputCountry]:flex 
                  [&_.PhoneInputCountry]:items-center 
                  [&_.PhoneInputCountry]:pl-2 
                  [&_.PhoneInputCountry]:gap-1 
                  [&_.PhoneInputCountryIcon]:size-5 
                  [&_.PhoneInputCountrySelect]:border-0 
                  [&_.PhoneInputCountrySelect]:bg-white 
                  [&_.PhoneInputCountrySelect]:text-gray-900 
                  [&_.PhoneInputCountrySelect]:outline-none 
                  [&_.PhoneInputCountrySelect]:text-sm 
                  [&_.PhoneInputCountrySelect]:px-1 
                  [&_.PhoneInputInput]:flex-1 
                  [&_.PhoneInputInput]:h-full 
                  [&_.PhoneInputInput]:border-0 
                  [&_.PhoneInputInput]:bg-transparent 
                  [&_.PhoneInputInput]:px-2.5 
                  [&_.PhoneInputInput]:text-sm 
                  [&_.PhoneInputInput]:outline-none 
                  [&_.PhoneInputInput]:ring-0 
                  [&_.PhoneInputInput]:shadow-none 
                  [&_.PhoneInputInput]:focus:outline-none 
                  [&_.PhoneInputInput]:focus:ring-0 
                  [&_.PhoneInputInput]:focus:shadow-none 
                  [&_.PhoneInputInput]:placeholder:text-muted-foreground"
                />
              )}
            />
            {errors.telefone && <p className="text-xs text-danger">{errors.telefone.message}</p>}
            <p className="text-xs text-muted-foreground">
              Usado pela equipe Atlaz para entrar em contato. Não é exibido para outros mentorados.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <textarea
              {...register("descricao")}
              maxLength={250}
              rows={3}
              placeholder="Conte um pouco sobre você..."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
            />
            <p className="text-md text-muted-foreground">
              {(formValues.descricao ?? "").length}/250 caracteres · Exibida no seu card na Comunidade
            </p>
            {errors.descricao && <p className="text-xs text-danger">{errors.descricao.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>LinkedIn</Label>
            <Input {...register("linkedin_url")} placeholder="https://linkedin.com/in/usuario" />
            {errors.linkedin_url && (
              <p className="text-xs text-danger">{errors.linkedin_url.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Instagram</Label>
            <Input {...register("instagram_username")} placeholder="nome_de_usuario" />
            <p className="text-xs text-muted-foreground">Apenas o nome de usuário, sem @</p>
            {errors.instagram_username && (
              <p className="text-xs text-danger">{errors.instagram_username.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={!isDirty || saveMut.isPending}
            >
              {saveMut.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* Preview */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Como você aparece na Comunidade</p>
        <MentoradoCard
          mentorado={{
            id: user.id,
            nome: formValues.nome || user.nome,
            foto_url: user.foto_url,
            linkedin_url: formValues.linkedin_url || null,
            instagram_username: formValues.instagram_username || null,
            descricao: formValues.descricao || null,
          }}
        />
      </div>
    </div>
  );
}
