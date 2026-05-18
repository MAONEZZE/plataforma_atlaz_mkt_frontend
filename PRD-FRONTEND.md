# PRD Frontend — Plataforma Atlaz

> **Este é um documento de índice.** Aponta para as specs detalhadas em `specs-mvp/`.
> Para implementar qualquer feature, abra a spec correspondente — não tente codar a partir deste índice.

---

## Como usar este documento com Claude Code

1. **Sempre comece lendo as specs `shared/`.** Especialmente `shared/02-contrato-api` e `shared/03-autenticacao`.
2. **Implemente `frontend/00`, `01`, `02` antes das telas** — são fundação (stack, design system, componentes base).
3. **Abra a spec específica** da tela que vai implementar.
4. **Cheque dependências** listadas no cabeçalho da spec.
5. **Implemente exatamente o que a spec descreve** — não expandir escopo.
6. **Valide TODOS os critérios de aceitação** antes de fechar.

Se uma decisão não está nas specs, pergunte antes de inventar.

---

## Visão do produto

Plataforma interna da Atlas Sales (Atlaz). Mentorados acompanham métricas semanais, consomem conteúdo em trilhas de vídeo, e conhecem outros mentorados pela comunidade. Admins gerenciam trilhas e veem métricas consolidadas da turma.

**5 páginas para o mentorado:** Dashboard, Trilhas, Aulas, Comunidade, Perfil.
**2 páginas para o admin:** Gerenciar Trilhas, Dashboard Admin.

**Autenticação via Supabase Auth.** Login email + senha gerenciado inteiramente pelo SDK do Supabase no frontend. Backend só valida tokens.

**Sem cadastro público** — admin cria usuários via script CLI no backend.

**Glassmorphism estilo Apple** com tema light/dark seguindo `prefers-color-scheme`.

---

## Stack

- Next.js 14+ (App Router)
- TypeScript strict
- Tailwind CSS + shadcn/ui
- lucide-react (ícones)
- Recharts (gráficos)
- react-hook-form + zod (formulários)
- **`@supabase/supabase-js` + `@supabase/ssr` (auth)**
- axios + TanStack Query (HTTP para a API FastAPI)
- Zustand (estado global mínimo)
- TanStack Table (tabelas)
- date-fns (datas, locale ptBR)
- sonner (toasts)
- Inter via next/font

---

## Estrutura das specs

```
specs-mvp/
├── shared/                       # LEIA PRIMEIRO
│   ├── 00-glossario.md
│   ├── 01-modelo-de-dados.md     # tabelas no Supabase + triggers
│   ├── 02-contrato-api.md        # endpoints da API FastAPI (sem /auth/*)
│   ├── 03-autenticacao.md        # Supabase Auth: fluxo completo
│   ├── 04-error-handling.md
│   └── 05-design-system.md
└── frontend/
    ├── 00-stack-e-estrutura.md   # incluindo lib/supabase/{client,server}.ts
    ├── 01-design-system-glass.md
    ├── 02-componentes-base.md    # Navbar com logout via supabase.auth.signOut()
    ├── 03-login-screen.md        # supabase.auth.signInWithPassword()
    ├── 04-dashboard-cliente.md
    ├── 05-metricas-form.md
    ├── 06-conteudo-screens.md
    ├── 07-perfil-screen.md       # troca email/senha via Supabase
    ├── 08-admin-dashboard.md
    ├── 09-admin-trilhas.md
    └── 10-comunidade-screen.md
```

---

## Mapa de specs (frontend)

| # | Spec | O que cobre | Depende de |
|---|---|---|---|
| 00 | Stack e estrutura | Setup Next.js, Supabase SDK, axios para API própria, guards | shared (todas) |
| 01 | Design system glass | Tokens, classes, PageBackground, logo única | 00, shared/05 |
| 02 | Componentes base | Navbar, UserDropdown (logout via Supabase), DataTable, WeekPicker, etc. | 00, 01 |
| 03 | Login | `/login` via `supabase.auth.signInWithPassword()` | 00, 01, shared/03 |
| 04 | Dashboard cliente | KPIs, gráfico, tabela | 00-02, backend/03 |
| 05 | Métricas form | `/metricas/nova` e edição | 00-02, backend/03 |
| 06 | Conteúdo | Trilhas, módulos, aulas, player, comentários | 00-02, backend/04 |
| 07 | Perfil | 2 abas: Dados (com email via Supabase) + Segurança (senha via Supabase) | 00-02, backend/02 |
| 08 | Dashboard admin | Tabela consolidada | 00-02, backend/03 |
| 09 | Admin trilhas | CRUD em árvore com drag-and-drop | 00-02, backend/04 |
| 10 | Comunidade | Grid de cards | 00-02, backend/05 |

---

## Ordem de execução (Fase 1)

**Pré-requisitos:**
1. `shared/00`, `02`, `03`, `04`, `05`.
2. Projeto Supabase criado, banco com migrations aplicadas (incluindo triggers).
3. `frontend/00` (setup).
4. `frontend/01` (design system).
5. `frontend/02` (componentes base, principalmente Navbar).

**Após pré-requisitos:**
- `frontend/03-login` (precisa do Supabase configurado).
- `frontend/04-dashboard-cliente` + `frontend/05-metricas-form` (precisam de `backend/03`).
- `frontend/06-conteudo-screens` (precisa de `backend/04`).
- `frontend/07-perfil-screen` (precisa de `backend/02`).
- `frontend/10-comunidade-screen` (precisa de `backend/05`).
- `frontend/08-admin-dashboard` + `frontend/09-admin-trilhas` (depois das outras telas).

---

## Convenções globais

### Naming
- Componentes: `PascalCase.tsx`.
- Hooks: `useCamelCase.ts`.
- Arquivos utilitários: `kebab-case.ts`.
- Rotas: `kebab-case`.
- Imports absolutos via `@/`.

### Idioma
- Mensagens ao usuário: PT-BR.
- Código: EN.

### Datas e moeda
- date-fns com locale `ptBR`. Formato `dd/MM/yyyy` para exibição.
- Não há campos monetários no MVP (só inteiros).

### Estados de UI
- Loading: skeleton.
- Erro: mensagem + botão "Tentar novamente".
- Vazio: `<EmptyState>` com ilustração + texto + CTA opcional.

### Validação
- zod schemas em `lib/utils/validations.ts`.
- Erros inline abaixo do campo.
- Submit desabilitado durante request.

### Confirmação destrutiva
- `<AlertDialog>`, nunca `confirm()`.

### Tema
- `prefers-color-scheme` via Tailwind `darkMode: 'media'`.
- Sem toggle manual no MVP.

### Glass
- Aplicação **seletiva**. Detalhes em `shared/05`.

---

## Auth — pontos críticos

**Login, logout, troca de senha, troca de email — TODOS via SDK do Supabase no frontend.** A API FastAPI **não** expõe esses endpoints.

```ts
// Login
const { error } = await supabase.auth.signInWithPassword({ email, password });

// Logout
await supabase.auth.signOut();

// Troca de senha
await supabase.auth.updateUser({ password: novaSenha });

// Troca de email
await supabase.auth.updateUser({ email: novoEmail });
```

**Token JWT na API:** o axios tem um interceptor que pega o `access_token` da sessão Supabase atual e envia no header `Authorization: Bearer ...` em todas as requests à API FastAPI.

**Refresh automático em 401:** interceptor de resposta tenta `supabase.auth.refreshSession()` e retentar. Se falhar, faz signOut e redireciona para `/login`.

Detalhes em `frontend/00-stack-e-estrutura.md`.

---

## Privacidade — regra crítica

**Telefone do mentorado NUNCA aparece em telas públicas.** É campo interno para o admin entrar em contato. `<MentoradoCard />` é responsável por garantir — defesa em camadas.

---

## Logo

Há **apenas uma versão** em `public/logo.svg`. Funciona em ambos os temas (light e dark), aceito que pode contrastar menos em um deles. Sem versão alternativa no MVP.

---

## Variáveis de ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Apenas `NEXT_PUBLIC_*` vão para o cliente. A `service_role` key fica só no backend.

---

## Pendências antes de começar

1. **Projeto Supabase criado.** Anotar URL, anon key, service role key, JWT secret.
2. **Logo Atlaz** em `public/logo.svg`.
3. **Domínio do frontend** definido (afeta CORS no backend).

---

## Instruções específicas para Claude Code

- Antes de criar qualquer arquivo, leia a spec correspondente do início ao fim.
- Antes de criar componente, verifique se ele já está em `frontend/02-componentes-base.md` — não duplicar.
- TypeScript strict obrigatório. Nunca `any` (use `unknown` + narrow).
- Server Components quando possível. Client Components só onde há interatividade.
- Não criar testes proativamente — só se a spec pedir.
- Sempre rodar `lint` e `typecheck` antes de fechar tarefa.
- Em dúvida entre duas implementações: escolher a mais simples e perguntar ao usuário.
- Para auth, sempre usar o SDK do Supabase (`@supabase/supabase-js`). Nunca chamar endpoints `/auth/*` da API FastAPI — eles não existem.
