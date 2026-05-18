# Frontend 04 — Dashboard do Cliente

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `frontend/00`, `frontend/01`, `frontend/02`, `backend/03-metricas-context`
**Bloqueia:** —

---

## Rota

`/dashboard` (cliente).

## Layout

Renderizado dentro de `(app)/layout.tsx` (com navbar). Conteúdo central da página.

### Header da página
- Título h1 "Dashboard".
- Subtítulo "Suas métricas de [mês formatado em PT]".
- Botão primary à direita: "+ Cadastrar métricas da semana" → `/metricas/nova`.

### Cards de KPI (4 colunas em desktop, 2x2 em tablet, stack em mobile)

Usar `<GlassCard variant="soft">`. Cada um:
- Ícone (lucide).
- Label (Ligações Agendadas, Ligações Realizadas, Reuniões Agendadas, Indicações).
- Valor grande (número inteiro).
- Delta vs mês anterior: ícone seta + percentual + cor (verde +/vermelho −/cinza neutro).
- Se `delta_pct` é `null`: exibe "—" sem cor.

Dados: `GET /dashboard/resumo`.

### Gráfico de série semanal

`<GlassCard variant="solid">` ocupando full width abaixo dos KPIs.

Recharts `<LineChart>` com 4 séries (uma por métrica), legenda no topo.
- X axis: semana formatada como "DD/MM".
- Y axis: valor.
- Tooltip mostra todas as 4 métricas da semana.

Cores das séries:
- Ligações Agendadas: `--accent`.
- Ligações Realizadas: `--success`.
- Reuniões Agendadas: `--warning`.
- Indicações: roxo/violeta mais claro.

12 semanas. Semanas sem dado preenchidas com 0.

Dados: `GET /dashboard/series?semanas=12`.

### Tabela histórica

`<GlassCard variant="solid">` contendo `<DataTable>`.

Colunas:
- Semana (formato "DD/MM a DD/MM").
- Ligações Agendadas.
- Ligações Realizadas.
- Reuniões Agendadas.
- Indicações.
- Ações: botão "Editar".

Comportamento:
- Sortable por todas.
- Paginação: 10 por página.
- Botão "Editar" habilitado se semana dentro da janela de 4 semanas. Caso contrário, desabilitado com tooltip "Período de edição encerrado".

Dados: `GET /metricas?mes=...&page=...`.

## Estado vazio

Sem métricas: `<EmptyState>` com "Você ainda não cadastrou métricas." + CTA "Cadastrar primeira métrica".

## Loading e erro

- Cada bloco com seu skeleton independente.
- Erro em bloco isolado: mensagem no card + botão "Tentar novamente".

## Responsividade

- Desktop ≥ lg: 4 KPIs lado a lado, gráfico full width, tabela full width.
- Tablet: 2x2 KPIs.
- Mobile: stack vertical.

## Critérios de aceitação

- [ ] 4 cards de KPI com delta.
- [ ] Gráfico de linha com 4 séries.
- [ ] Tabela paginada e sortable.
- [ ] Botão "Editar" desabilitado fora da janela.
- [ ] Estado vazio com CTA.
- [ ] Responsivo nos 3 breakpoints.
- [ ] Tema light e dark.
