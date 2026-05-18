# Frontend — Specs

## Ordem de leitura

1. `shared/00-glossario`
2. `shared/02-contrato-api`
3. `shared/04-error-handling`
4. `shared/05-design-system`
5. `frontend/00-stack-e-estrutura`
6. `frontend/01-design-system-glass`
7. `frontend/02-componentes-base`
8. Demais telas em qualquer ordem.

## Specs

| # | Spec | Depende de |
|---|---|---|
| 00 | Stack e estrutura | shared |
| 01 | Design system glass | 00, shared/05 |
| 02 | Componentes base (Navbar etc.) | 00, 01 |
| 03 | Login | 00, 01, backend/01 |
| 04 | Dashboard cliente | 00, 01, 02, backend/03 |
| 05 | Métricas form | 00, 01, 02, backend/03 |
| 06 | Conteúdo (trilhas e aulas) | 00, 01, 02, backend/04 |
| 07 | Perfil | 00, 01, 02, backend/02 |
| 08 | Dashboard admin | 00, 01, 02, backend/03 |
| 09 | Admin trilhas | 00, 01, 02, backend/04 |
| 10 | Comunidade | 00, 01, 02, backend/05 |

## Paralelização (após 00-02 + auth do backend pronto)

- Agente A: `03-login` + `04-dashboard-cliente` + `05-metricas-form`
- Agente B: `06-conteudo` + `10-comunidade`
- Agente C: `07-perfil` + `08-admin-dashboard` + `09-admin-trilhas`

## Convenções

- Componentes em `PascalCase`. Hooks em `useCamelCase`.
- Imports absolutos via `@/`.
- Mensagens em PT-BR.
- Datas formatadas com date-fns (locale ptBR).
- Sem dark mode toggle manual: segue `prefers-color-scheme`.
