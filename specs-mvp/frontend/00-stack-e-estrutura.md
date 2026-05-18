# Frontend 00 — Stack e Estrutura

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `shared/00`, `shared/02`, `shared/03`, `shared/04`, `shared/05`
**Bloqueia:** todas as specs de tela do frontend

---

## Stack

- **Framework:** Next.js 14+ (App Router).
- **Linguagem:** TypeScript strict.
- **Estilo:** Tailwind CSS + shadcn/ui.
- **Ícones:** lucide-react.
- **Gráficos:** Recharts.
- **Formulários:** react-hook-form + zod.
- **Auth:** `@supabase/supabase-js` (cliente oficial Supabase).
- **HTTP para API própria:** axios + TanStack Query.
- **Estado global mínimo:** Zustand (estado derivado da sessão Supabase).
- **Tabelas:** TanStack Table.
- **Datas:** date-fns (locale ptBR).
- **Notificações em tela:** sonner.
- **Fontes:** Inter via `next/font/google`.

## Estrutura de pastas

```
frontend/
├── app/
│   ├── layout.tsx                  # root: fontes, providers, PageBackground
│   ├── globals.css
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/                      # com navbar superior
│   │   ├── layout.tsx              # navbar + main + guard
│   │   ├── dashboard/page.tsx
│   │   ├── metricas/
│   │   │   ├── nova/page.tsx
│   │   │   └── [id]/editar/page.tsx
│   │   ├── trilhas/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── aulas/[id]/page.tsx
│   │   ├── comunidade/page.tsx
│   │   ├── perfil/page.tsx
│   │   └── admin/
│   │       ├── trilhas/page.tsx
│   │       └── dashboard/page.tsx
│   └── error.tsx
├── components/
│   ├── ui/                         # shadcn customizado
│   ├── layout/                     # Navbar, UserDropdown, PageBackground
│   ├── glass/                      # GlassCard, GlassModal
│   ├── data/                       # DataTable, EmptyState
│   ├── forms/                      # WeekPicker, PasswordInput, PasswordStrengthIndicator
│   ├── content/                    # DriveVideoPlayer, CommentsList
│   └── community/                  # MentoradoCard
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # cliente Supabase para uso no browser
│   │   └── server.ts               # cliente Supabase para Server Components
│   ├── api/
│   │   ├── client.ts               # axios para API FastAPI
│   │   ├── me.ts
│   │   ├── metricas.ts
│   │   ├── conteudo.ts
│   │   ├── comunidade.ts
│   │   ├── admin.ts
│   │   └── types.ts
│   ├── auth/
│   │   ├── store.ts                # Zustand: dados do /me
│   │   └── use-current-user.ts     # hook que combina sessão Supabase + dados de /me
│   └── utils/
│       ├── format.ts
│       ├── week.ts
│       └── validations.ts
└── public/
    └── logo.svg                    # logo única (funciona em ambos os temas)
```

## Cliente Supabase

```ts
// lib/supabase/client.ts
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

```ts
// lib/supabase/server.ts (para Server Components e Route Handlers)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    },
  );
}
```

> Usar `@supabase/ssr` (não `@supabase/auth-helpers-nextjs`, que está deprecated).

## Cliente HTTP para API própria

```ts
// lib/api/client.ts
import axios from "axios";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + "/api/v1",
});

api.interceptors.request.use(async (cfg) => {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    cfg.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      // Tentar refresh via Supabase. Se falhar, redirecionar.
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        await supabase.auth.signOut();
        window.location.href = "/login";
        return Promise.reject(err);
      }
      // Retry com novo token
      err.config.headers.Authorization = `Bearer ${data.session.access_token}`;
      return api(err.config);
    }
    return Promise.reject(err);
  },
);
```

## Guards de rota

`app/(app)/layout.tsx` é Server Component que:
1. Cria cliente Supabase server.
2. Chama `supabase.auth.getUser()`.
3. Se erro: `redirect("/login")`.
4. Chama `GET /me` do backend (com o token na header).
5. Se backend retorna 403 (inativo): `redirect("/login?reason=inactive")`.
6. Para rotas `/admin/*`: também verifica `role === 'admin'`, senão `redirect("/dashboard")`.
7. Renderiza children passando dados do `/me` via Context ou props.

`app/(auth)/login/page.tsx`:
- Se já tem sessão Supabase válida: `redirect("/dashboard")`.

## Padrões em todas as telas

- Estados sempre tratados: loading (skeleton), erro (mensagem + retry), vazio (`<EmptyState />`).
- Validação: zod + react-hook-form. Erros inline.
- Submit: desabilitado durante request.
- Toasts: sonner, 4s default.
- Confirmação destrutiva: AlertDialog (não `confirm()` nativo).

## Variáveis de ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> **Apenas `NEXT_PUBLIC_*` vão para o cliente.** A `service_role` key fica só no backend.

## Logo

Há **apenas uma versão da logo** em `public/logo.svg`. Funciona em ambos os temas (light e dark) — pode ter contraste menos ideal em um deles, mas é decisão aceita.

Usar em todos os lugares:
```tsx
<Image src="/logo.svg" alt="Atlaz" width={...} height={...} />
```

## Critérios de aceitação

- [ ] Projeto Next.js + TypeScript strict.
- [ ] Tailwind + shadcn/ui configurados.
- [ ] `@supabase/supabase-js` e `@supabase/ssr` instalados.
- [ ] Estrutura de pastas conforme spec.
- [ ] `lib/supabase/client.ts` e `server.ts` criados.
- [ ] axios com interceptor que pega token da sessão Supabase.
- [ ] Refresh automático em 401 via `supabase.auth.refreshSession()`.
- [ ] Guards de rota em `(app)/layout.tsx` (autenticado) e `/admin/*` (admin).
- [ ] Logo única em `public/logo.svg`.
- [ ] ESLint + Prettier configurados.
