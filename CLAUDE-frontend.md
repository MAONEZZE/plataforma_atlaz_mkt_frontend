# Instruções persistentes para Claude Code

Este projeto é o **frontend** da Plataforma Atlaz (Next.js + Supabase + API FastAPI).

## Antes de qualquer tarefa

1. **Leia `PRD-FRONTEND.md`** — é o índice do projeto.
2. **Leia `specs/shared/00-glossario.md`** e `specs/shared/05-design-system.md`.
3. **Identifique qual spec aborda a tarefa atual** (em `specs/frontend/`) e leia ela inteira antes de codar.
4. **Cheque dependências da spec** — se ainda não estão prontas, faça-as primeiro.

## Regras inegociáveis

- **Auth é via Supabase SDK**, nunca via endpoints `/auth/*` da API FastAPI (eles não existem). Login: `supabase.auth.signInWithPassword()`. Logout: `supabase.auth.signOut()`. Troca de senha: `supabase.auth.updateUser({ password })`.
- **Token JWT** em chamadas à API FastAPI: o axios já tem interceptor que pega da sessão Supabase. Não fazer manualmente.
- **TypeScript strict.** Nunca `any` (use `unknown` + narrow).
- **Server Components quando possível.** Client Components só onde há interatividade.
- **`@supabase/ssr`** (não `@supabase/auth-helpers-nextjs`, que está deprecated).
- **Mensagens ao usuário em PT-BR.** Código em EN.
- **date-fns com locale ptBR** para datas.
- **Glassmorphism é seletivo.** Veja `specs/shared/05-design-system.md` — glass em superfícies elevadas (navbar, modais, KPIs), NÃO em tabelas/listas longas/formulários grandes/player.

## Antes de fechar uma tarefa

- Validar todos os critérios de aceitação da spec, item por item.
- Rodar `lint` e `typecheck` (npm scripts).
- Testar visualmente em tema light e dark.

## Em caso de dúvida

- Entre duas implementações: escolher a mais simples e perguntar ao usuário.
- Se uma decisão não está nas specs: **pergunte antes de inventar.**

## Privacidade — regra crítica

`<MentoradoCard />` **nunca** exibe telefone, mesmo que a API mande. Defesa em camadas. O componente é responsável por filtrar.

## Logo

Há **apenas uma versão** em `public/logo.svg`. Funciona em ambos os temas (light e dark). Sem versão alternativa no MVP.

## Não criar testes proativamente

Só criar testes quando a spec pedir explicitamente.
