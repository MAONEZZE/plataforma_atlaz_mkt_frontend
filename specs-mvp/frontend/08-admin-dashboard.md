# Frontend 08 — Dashboard Admin

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `frontend/00`, `frontend/01`, `frontend/02`, `backend/03-metricas-context`
**Bloqueia:** —

---

## Rota

`/admin/dashboard` — apenas admin. Guard redireciona cliente para `/dashboard`.

## Layout

### Header
- Título h1 "Dashboard Admin".
- Subtítulo "Métricas consolidadas — [mês]".
- Filtro de mês: date picker month (default mês atual).

### Cards agregados (4 KPIs em `.glass-soft`)

- Ligações Agendadas (soma da turma).
- Ligações Realizadas (soma).
- Reuniões Agendadas (soma).
- Indicações (soma).

Cada card grande, sem comparativo de mês anterior no MVP (mantém simples).

### Linha extra de info

Duas mini-stats lado a lado:
- "Mentorados com métrica no mês: X de Y".
- "Sem métrica no mês: Z" (com badge amarelo se Z > 0).

### Tabela de mentorados

`<DataTable>` em `.solid-surface`:

Colunas:
- Mentorado (avatar + nome).
- Ligações Agendadas.
- Ligações Realizadas.
- Reuniões Agendadas.
- Indicações.
- Última métrica em (data ou "—" se nunca).

Busca por nome no topo da tabela.

Sortable por todas as colunas numéricas.

Paginada (20 por página).

Clique na linha: **não navega no MVP** (não há tela de detalhe de mentorado). Pode destacar visualmente (hover).

Dados: `GET /admin/dashboard?mes=...&busca=...&page=...`.

## Estado vazio

Mês sem nenhum dado: "Nenhuma métrica cadastrada neste mês."

## Critérios de aceitação

- [ ] Cliente é redirecionado para `/dashboard` (guard).
- [ ] 4 cards de KPI com somas corretas.
- [ ] Mini-stats de cobertura.
- [ ] Tabela com filtro de mês + busca.
- [ ] Sortable.
- [ ] Paginação.
- [ ] Estado vazio.
- [ ] Tema light e dark.
