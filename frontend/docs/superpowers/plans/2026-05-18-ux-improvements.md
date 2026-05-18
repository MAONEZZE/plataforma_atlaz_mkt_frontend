# UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add global loading bar, phone field with country selector, community card redesign with bio + social icons, and metrics entry via dialog instead of separate page.

**Architecture:** Five independent changes. Each task modifies isolated files and can be committed independently. No new global state needed — existing `useRouter`, `useMutation`, and `Dialog` primitives are reused. `MetricasForm` gets optional callback props so it works in both dialog and page contexts.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, `@base-ui/react` dialogs, `react-hook-form` + Zod, `sonner` toasts, TanStack Query. New deps: `nextjs-toploader`, `react-phone-number-input`.

---

## File Map

| File | Action | Task |
|------|--------|------|
| `package.json` | install deps | 1 |
| `app/layout.tsx` | add `<NextTopLoader>` | 2 |
| `lib/api/types.ts` | add `descricao` to `Usuario` | 3 |
| `lib/api/me.ts` | add `descricao` to `UpdateMeInput` | 3 |
| `lib/api/comunidade.ts` | add `descricao` to `MentoradoPublico` | 3 |
| `lib/utils/validations.ts` | update telefone schema to E.164 | 4 |
| `app/(app)/perfil/DadosPessoaisForm.tsx` | replace phone input + add descricao field | 4, 5 |
| `components/community/MentoradoCard.tsx` | redesign with bio + icon buttons | 6 |
| `components/forms/MetricasForm.tsx` | add `onSuccess`/`onCancel` props | 7 |
| `app/(app)/dashboard/NovaMetricaDialog.tsx` | new client component with dialog | 8 |
| `app/(app)/dashboard/page.tsx` | replace Link with `<NovaMetricaDialog>` | 8 |
| `app/(app)/metricas/nova/page.tsx` | **deleted** | 8 |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install new packages**

```bash
cd /home/sanchezz/Desktop/plataforma_atlaz_mkt_frontend/frontend
npm install nextjs-toploader react-phone-number-input
```

Expected: packages added to `node_modules` and `package.json` dependencies.

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: no errors (no code changed yet).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add nextjs-toploader and react-phone-number-input"
```

---

## Task 2: Global Progress Bar

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add `<NextTopLoader>` to root layout**

Replace the contents of `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atlaz",
  description: "Plataforma Atlas Sales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "var(--page-bg)" }}>
        <NextTopLoader color="#7C3AED" showSpinner={false} height={3} />
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add global top loading bar (nextjs-toploader)"
```

---

## Task 3: Add `descricao` to Data Types

**Files:**
- Modify: `lib/api/types.ts`
- Modify: `lib/api/me.ts`
- Modify: `lib/api/comunidade.ts`

- [ ] **Step 1: Add `descricao` to `Usuario` type**

In `lib/api/types.ts`, add `descricao: string | null;` to the `Usuario` interface:

```typescript
export type Role = "cliente" | "admin";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  descricao: string | null;
  foto_url: string | null;
  role: Role;
  inativo: boolean;
  criado_em: string;
  atualizado_em: string;
}
```

- [ ] **Step 2: Add `descricao` to `UpdateMeInput`**

In `lib/api/me.ts`, add `descricao?: string | null` to `UpdateMeInput`:

```typescript
import { api } from "./client";
import type { Usuario } from "./types";

export async function getMe(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/me");
  return data;
}

export interface UpdateMeInput {
  nome?: string;
  telefone?: string | null;
  linkedin_url?: string | null;
  instagram_username?: string | null;
  descricao?: string | null;
}

export async function updateMe(input: UpdateMeInput): Promise<Usuario> {
  const { data } = await api.patch<Usuario>("/me", input);
  return data;
}

export async function uploadFoto(file: File): Promise<Usuario> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<Usuario>("/me/foto", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
```

- [ ] **Step 3: Add `descricao` to `MentoradoPublico`**

Replace `lib/api/comunidade.ts` with:

```typescript
import { api } from "./client";
import type { Paginated } from "./types";

export interface MentoradoPublico {
  id: string;
  nome: string;
  foto_url: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  descricao: string | null;
}

export async function listComunidade(params?: {
  page?: number;
  page_size?: number;
}): Promise<Paginated<MentoradoPublico>> {
  const { data } = await api.get<Paginated<MentoradoPublico>>("/comunidade", { params });
  return data;
}
```

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```

Expected: TypeScript may flag usages of `MentoradoCard` or `DadosPessoaisForm` that don't yet pass `descricao`. That's acceptable at this step — will be fixed in Tasks 5 and 6.

- [ ] **Step 5: Commit**

```bash
git add lib/api/types.ts lib/api/me.ts lib/api/comunidade.ts
git commit -m "feat: add descricao field to Usuario, UpdateMeInput, and MentoradoPublico types"
```

---

## Task 4: Phone Field with Country Code Selector

**Files:**
- Modify: `lib/utils/validations.ts`
- Modify: `app/(app)/perfil/DadosPessoaisForm.tsx`

The `react-phone-number-input` library stores values in E.164 format (e.g. `+5511999999999`). We validate with `isValidPhoneNumber` from the same library.

- [ ] **Step 1: Update telefone validation in schema**

`lib/utils/validations.ts` — this file only contains `loginSchema` and `metricaSchema` (no profile schema). The profile form uses its own inline Zod schema in `DadosPessoaisForm.tsx`. No change needed in this file.

Skip to Step 2.

- [ ] **Step 2: Update `DadosPessoaisForm.tsx` — schema and phone input**

**Note on `inputComponent`:** Our `Input` component wraps `@base-ui/react/input` without explicit `forwardRef`. To avoid ref-forwarding issues, use `PhoneInput` without `inputComponent` and apply Tailwind utility selectors to style the default rendered markup.

Replace the full contents of `app/(app)/perfil/DadosPessoaisForm.tsx` with:

```tsx
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
import { updateMe, uploadFoto } from "@/lib/api/me";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useAuthStore } from "@/lib/auth/store";
import { MentoradoCard } from "@/components/community/MentoradoCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // still used for Nome, LinkedIn, Instagram, and email fields
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
    .max(140, "Máximo 140 caracteres.")
    .optional(),
});
type FormData = z.infer<typeof schema>;

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function DadosPessoaisForm() {
  const user = useCurrentUser();
  const setUser = useAuthStore((s) => s.setUser);
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
    mutationFn: uploadFoto,
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
                  className="flex h-8 items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:pl-2 [&_.PhoneInputCountry]:gap-1 [&_.PhoneInputCountryIcon]:size-5 [&_.PhoneInputCountrySelect]:border-0 [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:outline-none [&_.PhoneInputCountrySelect]:text-sm [&_.PhoneInputCountrySelect]:px-1 [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:h-full [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:px-2.5 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-muted-foreground"
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
              maxLength={140}
              rows={3}
              placeholder="Conte um pouco sobre você..."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {(formValues.descricao ?? "").length}/140 caracteres · Exibida no seu card na Comunidade
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
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: possible error about `MentoradoCard` missing `descricao` prop — will be fixed in Task 6. All other errors should be resolved.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/perfil/DadosPessoaisForm.tsx
git commit -m "feat: phone field with country code selector and descricao field in profile form"
```

---

## Task 5: (Merged into Task 4)

The `descricao` field for the profile form was added in Task 4, Step 2. No separate task needed.

---

## Task 6: Community Card Redesign

**Files:**
- Modify: `components/community/MentoradoCard.tsx`

Lucide does not include brand icons. Instagram and LinkedIn icons are inlined as SVG paths (24×24 viewBox, standard brand assets).

- [ ] **Step 1: Replace `MentoradoCard` with new design**

Replace the full contents of `components/community/MentoradoCard.tsx` with:

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MentoradoPublico {
  id: string;
  nome: string;
  foto_url: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  descricao: string | null;
}

interface MentoradoCardProps {
  mentorado: MentoradoPublico;
}

function initials(nome: string): string {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function MentoradoCard({ mentorado }: MentoradoCardProps) {
  const { nome, foto_url, linkedin_url, instagram_username, descricao } = mentorado;
  const hasSocial = linkedin_url || instagram_username;

  return (
    <div className="solid-surface p-5 flex flex-col items-center gap-3 text-center shadow-sm">
      <Avatar className="size-20">
        {foto_url && <AvatarImage src={foto_url} alt={nome} />}
        <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
          {initials(nome)}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-1 min-h-[3rem]">
        <p className="font-semibold text-sm leading-tight">{nome}</p>
        {descricao && (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{descricao}</p>
        )}
      </div>

      {hasSocial && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50 w-full justify-center">
          {instagram_username && (
            <a
              href={`https://instagram.com/${instagram_username}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram de ${nome}`}
              className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-[#E1306C] hover:bg-[#E1306C]/10 transition-colors"
            >
              <InstagramIcon className="size-4" />
            </a>
          )}
          {linkedin_url && (
            <a
              href={linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`LinkedIn de ${nome}`}
              className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-colors"
            >
              <LinkedInIcon className="size-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors (all `descricao` usages now satisfied).

- [ ] **Step 3: Commit**

```bash
git add components/community/MentoradoCard.tsx
git commit -m "feat: redesign community card with bio and social icon buttons"
```

---

## Task 7: MetricasForm — Optional Callback Props

**Files:**
- Modify: `components/forms/MetricasForm.tsx`

Add `onSuccess` and `onCancel` optional props. When provided, they replace `router.push("/dashboard")`. The edit page (`/metricas/[id]/editar`) doesn't pass these props, so it continues working unchanged.

- [ ] **Step 1: Update `MetricasFormProps` and callback usage**

Replace the full contents of `components/forms/MetricasForm.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { startOfWeek, subDays } from "date-fns";
import axios from "axios";
import {
  createMetrica,
  updateMetrica,
  listMetricas,
  type MetricaInput,
} from "@/lib/api/metricas";
import { metricaSchema, type MetricaFormInput } from "@/lib/utils/validations";
import { WeekPicker } from "./WeekPicker";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MetricasFormProps {
  mode: "create" | "edit";
  metricaId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const NUMERIC_FIELDS = [
  { name: "ligacoes_agendadas" as const, label: "Ligações Agendadas" },
  { name: "ligacoes_realizadas" as const, label: "Ligações Realizadas" },
  { name: "reunioes_agendadas" as const, label: "Reuniões Agendadas" },
  { name: "indicacoes" as const, label: "Indicações" },
];

export function MetricasForm({ mode, metricaId, onSuccess, onCancel }: MetricasFormProps) {
  const router = useRouter();
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const today = new Date();
  const maxDate = startOfWeek(today, { weekStartsOn: 1 });
  const minDate = startOfWeek(subDays(today, 28), { weekStartsOn: 1 });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<MetricaFormInput>({
    resolver: zodResolver(metricaSchema),
    mode: "onTouched",
    defaultValues: {
      ligacoes_agendadas: 0,
      ligacoes_realizadas: 0,
      reunioes_agendadas: 0,
      indicacoes: 0,
    },
  });

  const { data: existingMetrica, isLoading } = useQuery({
    queryKey: ["metrica", metricaId],
    queryFn: async () => {
      if (!metricaId) return null;
      const { items } = await listMetricas({ page: 1, page_size: 100 });
      return items.find((m) => m.id === metricaId) ?? null;
    },
    enabled: mode === "edit" && !!metricaId,
  });

  useEffect(() => {
    if (existingMetrica) {
      reset({
        semana_inicio: existingMetrica.semana_inicio,
        ligacoes_agendadas: existingMetrica.ligacoes_agendadas,
        ligacoes_realizadas: existingMetrica.ligacoes_realizadas,
        reunioes_agendadas: existingMetrica.reunioes_agendadas,
        indicacoes: existingMetrica.indicacoes,
      });
    }
  }, [existingMetrica, reset]);

  const mut = useMutation({
    mutationFn: async (data: MetricaFormInput) => {
      const payload: MetricaInput = {
        semana_inicio: data.semana_inicio,
        ligacoes_agendadas: data.ligacoes_agendadas,
        ligacoes_realizadas: data.ligacoes_realizadas,
        reunioes_agendadas: data.reunioes_agendadas,
        indicacoes: data.indicacoes,
      };
      if (mode === "edit" && metricaId) {
        return updateMetrica(metricaId, payload);
      }
      return createMetrica(payload);
    },
    onSuccess: () => {
      toast.success("Métricas salvas!");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          const existingId = err.response.data?.error?.details?.id as string | undefined;
          toast.info("Métricas dessa semana já existem. Carregando para edição...");
          if (existingId) {
            onSuccess?.();
            router.push(`/metricas/${existingId}/editar`);
          }
          return;
        }
        if (err.response?.status === 422) {
          toast.error(err.response.data?.error?.message ?? "Regra de negócio violada.");
          return;
        }
      }
      toast.error("Erro ao salvar métricas.");
    },
  });

  function handleCancel() {
    if (isDirty) {
      setCancelConfirm(true);
    } else if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard");
    }
  }

  function handleConfirmDiscard() {
    setCancelConfirm(false);
    if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard");
    }
  }

  if (mode === "edit" && isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const title =
    mode === "create"
      ? "Cadastrar métricas da semana"
      : `Editar métricas${existingMetrica ? ` — Semana de ${existingMetrica.semana_inicio}` : ""}`;

  return (
    <>
      <GlassCard variant="solid" className="space-y-6">
        <h1 className="text-xl font-semibold">{title}</h1>

        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-6" noValidate>
          {/* Semana */}
          <div className="space-y-1.5">
            <Label>Semana</Label>
            <Controller
              name="semana_inicio"
              control={control}
              render={({ field }) => (
                <WeekPicker
                  value={field.value ? new Date(field.value) : null}
                  onChange={(d) => field.onChange(d.toISOString().split("T")[0])}
                  minDate={minDate}
                  maxDate={maxDate}
                  disabled={mode === "edit"}
                />
              )}
            />
            {errors.semana_inicio && (
              <p className="text-xs text-danger">{errors.semana_inicio.message}</p>
            )}
          </div>

          {/* Campos numéricos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {NUMERIC_FIELDS.map(({ name, label }) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  type="number"
                  min={0}
                  step={1}
                  {...register(name, { valueAsNumber: true })}
                />
                {errors[name] && (
                  <p className="text-xs text-danger">{errors[name]?.message}</p>
                )}
              </div>
            ))}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting || mut.isPending}
            >
              {isSubmitting || mut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </GlassCard>

      <AlertDialog open={cancelConfirm} onOpenChange={setCancelConfirm}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja sair?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/forms/MetricasForm.tsx
git commit -m "feat: add onSuccess/onCancel props to MetricasForm for dialog support"
```

---

## Task 8: Dashboard Dialog + Delete Nova Route

**Files:**
- Create: `app/(app)/dashboard/NovaMetricaDialog.tsx`
- Modify: `app/(app)/dashboard/page.tsx`
- Delete: `app/(app)/metricas/nova/page.tsx`

The dashboard page stays a server component. `NovaMetricaDialog` is a separate client component that owns the dialog state.

- [ ] **Step 1: Create `NovaMetricaDialog` client component**

Create `app/(app)/dashboard/NovaMetricaDialog.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MetricasForm } from "@/components/forms/MetricasForm";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NovaMetricaDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 transition-all">
        <Plus className="size-4" />
        Cadastrar métricas da semana
      </DialogTrigger>
      <DialogContent className="glass max-w-lg" showCloseButton={false}>
        <MetricasForm
          mode="create"
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Update dashboard page to use `NovaMetricaDialog`**

Replace the full contents of `app/(app)/dashboard/page.tsx` with:

```tsx
import { NovaMetricaDialog } from "./NovaMetricaDialog";
import { DashboardKPIs } from "./DashboardKPIs";
import { DashboardChart } from "./DashboardChart";
import { DashboardTable } from "./DashboardTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DashboardPage() {
  const mes = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">Suas métricas de {mes}</p>
        </div>
        <NovaMetricaDialog />
      </div>
      <DashboardKPIs />
      <DashboardChart />
      <DashboardTable />
    </div>
  );
}
```

- [ ] **Step 3: Delete the `/metricas/nova` page**

```bash
rm /home/sanchezz/Desktop/plataforma_atlaz_mkt_frontend/frontend/app/\(app\)/metricas/nova/page.tsx
rmdir /home/sanchezz/Desktop/plataforma_atlaz_mkt_frontend/frontend/app/\(app\)/metricas/nova 2>/dev/null || true
```

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/dashboard/NovaMetricaDialog.tsx app/\(app\)/dashboard/page.tsx
git rm app/\(app\)/metricas/nova/page.tsx
git commit -m "feat: replace nova metrica page with dashboard dialog"
```

---

## Verification Checklist

After all tasks complete, verify manually in the browser:

- [ ] Progress bar appears on route transitions (navigate between pages)
- [ ] Phone input shows flag + country code selector with BR default, masks number correctly
- [ ] Profile form saves `descricao` and it appears in the preview card
- [ ] Community page cards show name, bio (if set), and Instagram/LinkedIn icon buttons only when fields are filled
- [ ] Dashboard "Cadastrar métricas" button opens a dialog (not navigates to a new page)
- [ ] Saving metrics in dialog closes it and stays on dashboard
- [ ] 409 conflict (duplicate week) closes dialog and navigates to edit page
- [ ] Cancelling in dialog closes it
- [ ] Edit metrics page (`/metricas/[id]/editar`) still works unchanged
- [ ] `/metricas/nova` returns 404
