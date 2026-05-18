# Plataforma Atlaz — Specs MVP

Especificações de implementação do MVP enxuto da Plataforma Atlaz.

## Escopo do MVP

5 páginas para o mentorado:
- `/login` — email + senha (via Supabase Auth).
- `/dashboard` — métricas semanais do próprio mentorado.
- `/trilhas` + `/trilhas/[id]` + `/aulas/[id]` — conteúdo em vídeo.
- `/comunidade` — diretório simples de mentorados.
- `/perfil` — edição dos próprios dados.

Para o admin, 2 páginas extras:
- `/admin/trilhas` — CRUD de Trilhas, Módulos, Aulas.
- `/admin/dashboard` — tabela consolidada das métricas de todos os mentorados.

**Autenticação:** Supabase Auth. Login/logout/refresh/troca-de-senha gerenciados pelo SDK do Supabase no frontend. Backend (FastAPI) apenas valida JWTs do Supabase em cada request.

**Cadastro de usuários:** admin cria via script CLI (`scripts/criar_usuario.py`) que chama a Admin API do Supabase. Trigger no Postgres sincroniza para `public.usuario` automaticamente. Não há cadastro público, convite por email, reset de senha externo.

## Estrutura

```
specs/
  shared/      → contratos transversais (modelo de dados, API, design system, auth)
  backend/     → 5 bounded contexts em DDD lite
  frontend/    → telas + design system + componentes
```

## Cabeçalho padrão de cada spec

- **Status:** rascunho / pronto-para-implementar / em-implementação / concluído.
- **Owner:** quem é responsável.
- **Depende de:** specs que precisam estar concluídas antes desta.
- **Bloqueia:** specs que esperam esta.
- **Critérios de aceitação:** lista verificável no final.

## Ordem de execução sugerida

1. `shared/` inteiro (especialmente `01-modelo-de-dados` e `03-autenticacao`).
2. Criar projeto Supabase. Aplicar migrations (incluindo triggers de sincronia).
3. `backend/00-stack-e-estrutura-ddd`.
4. `backend/01-auth-context` (validação de JWT).
5. `frontend/00-stack-e-estrutura` + `frontend/01-design-system-glass` + `frontend/02-componentes-base` em paralelo com `backend/01`.
6. Demais contextos backend e telas frontend em paralelo.

## Paralelização

Após shared + backend/00 + backend/01 + frontend/00-02 prontos:
- **Agente A backend:** usuários + comunidade
- **Agente B backend:** métricas
- **Agente C backend:** conteúdo
- **Agente A frontend:** auth + dashboard + métricas form
- **Agente B frontend:** trilhas + aulas + comentários
- **Agente C frontend:** comunidade + perfil + admin

## Convenções

- snake_case em tabelas e colunas. PascalCase em classes Python. camelCase em variáveis JS/TS. PascalCase em componentes React.
- Endpoints em `/api/v1/recurso-kebab-case`.
- Datas ISO 8601. UUIDs como string.
- PT-BR nas mensagens ao usuário, EN no código.
