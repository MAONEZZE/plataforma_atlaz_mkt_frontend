# Frontend 05 — Formulário de Métricas

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `frontend/00`, `frontend/01`, `frontend/02`, `backend/03-metricas-context`
**Bloqueia:** —

---

## Rotas

- `/metricas/nova` — criar.
- `/metricas/[id]/editar` — editar existente.

## Layout

Card sólido com título "Cadastrar métricas da semana" ou "Editar métricas — Semana de DD/MM".

### Grupo 1 — Identificação

- `<WeekPicker />`. Label: "Semana de DD/MM a DD/MM/YYYY". Constraints:
  - Mínimo: hoje menos 28 dias (normalizado para segunda).
  - Máximo: segunda da semana atual.
- Em modo edição: WeekPicker desabilitado (semana fixa).

### Grupo 2 — Métricas

Layout: 2 colunas em desktop, 1 em mobile.

Cada campo:
- Label (Ligações Agendadas, Ligações Realizadas, Reuniões Agendadas, Indicações).
- Input number (`type="number"`, `min="0"`, `step="1"`).
- Mensagem de validação inline.

## Validação zod

```ts
const schema = z.object({
  semana_inicio: z.string(),
  ligacoes_agendadas: z.number().int().min(0),
  ligacoes_realizadas: z.number().int().min(0),
  reunioes_agendadas: z.number().int().min(0),
  indicacoes: z.number().int().min(0),
});
```

## Botões no rodapé

- "Cancelar" (ghost) → `/dashboard`. Se houver alterações: AlertDialog "Descartar alterações?".
- "Salvar" (primary) → submit.

## Submit

- Criar: `POST /metricas`.
- Editar: `PATCH /metricas/{id}`.

Em sucesso:
- Toast "Métricas salvas!"
- Redireciona para `/dashboard`.

Em 409 (já existe): redireciona para `/metricas/{id_existente}/editar` com toast "Métricas dessa semana já existem. Carregando para edição...".

Em 422 (regra de negócio): toast com mensagem do backend.

## Critérios de aceitação

- [ ] 4 campos numéricos.
- [ ] WeekPicker normaliza para segunda.
- [ ] Constraints (futura, > 4 semanas) respeitadas.
- [ ] Validação inline.
- [ ] Submit desabilitado quando inválido.
- [ ] 409 redireciona para edição.
- [ ] Modo edição preenche dados.
- [ ] WeekPicker desabilitado em edição.
- [ ] Confirmação ao cancelar com alterações.
