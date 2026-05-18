# Frontend 03 — Tela de Login

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `frontend/00`, `frontend/01`, `shared/03`
**Bloqueia:** —

---

## Rota

`/login` (route group `(auth)/`, sem navbar).

## Layout

Card glass centrado, sobre `PageBackground`.

Conteúdo:
- Logo Atlaz (`public/logo.svg`).
- Título "Entrar".
- Form (react-hook-form + zod):
  - Email.
  - Senha (`<PasswordInput />`).
  - Botão "Entrar" (primary).

## Validação zod

```ts
const schema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});
```

## Comportamento

```tsx
"use client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

async function onSubmit(data: { email: string; senha: string }) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.senha,
  });
  
  if (error) {
    if (error.message === "Invalid login credentials") {
      toast.error("Email ou senha incorretos.");
    } else if (error.message.includes("Email not confirmed")) {
      toast.error("Email não confirmado. Contate o administrador.");
    } else {
      toast.error("Erro ao entrar. Tente novamente.");
    }
    return;
  }
  
  // Sucesso. Redirecionar.
  router.push("/dashboard");
  router.refresh();
}
```

> **Não chama API FastAPI no login.** Direto com Supabase. O backend só será chamado depois, em `/dashboard` (para `GET /me`).

### Erros possíveis e tratamento

- "Invalid login credentials" → toast "Email ou senha incorretos."
- Conta inativa (`public.usuario.inativo = true`): essa verificação acontece quando o frontend tentar buscar `GET /me` — backend retorna 403, `(app)/layout.tsx` redireciona para `/login?reason=inactive`. Aí o login mostra um aviso adicional.
- Rate limit: Supabase tem rate limit próprio em login. Se cair, mostra "Muitas tentativas, aguarde alguns minutos."

### Mostrar mensagem de "conta inativa" se vier do guard

Se `searchParams.reason === 'inactive'`, exibir banner amarelo acima do form:
> "Sua conta está inativa. Contate o administrador da Atlaz."

## Sem opções fora do MVP

Esta tela NÃO tem:
- Link "Esqueci minha senha" (decisão de escopo).
- Link "Criar conta" (admin cria usuários via script CLI).
- Botões de login social.

## Critérios de aceitação

- [ ] Login funcional via `supabase.auth.signInWithPassword()`.
- [ ] Credenciais inválidas mostram toast "Email ou senha incorretos."
- [ ] Banner aparece quando `?reason=inactive` está na URL.
- [ ] Sucesso redireciona para `/dashboard` e chama `router.refresh()`.
- [ ] Responsivo (mobile e desktop).
- [ ] Tema light e dark testados.
- [ ] Lighthouse acessibilidade ≥ 90.
- [ ] Sem link "Esqueci minha senha", sem "Criar conta".
