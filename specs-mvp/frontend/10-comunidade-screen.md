# Frontend 10 — Tela da Comunidade

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `frontend/00`, `frontend/01`, `frontend/02`, `backend/05-comunidade-context`
**Bloqueia:** —

---

## Rota

`/comunidade`

## Layout

### Header
- Título "Comunidade".
- Subtítulo "Conheça os outros mentorados da Atlaz".

### Grid de cards
- 4 colunas em xl, 3 em lg, 2 em md, 1 em mobile.
- Cada card é `<MentoradoCard />` (definido em `frontend/02`).

Card de mentorado (`.solid-surface`):
- Foto circular grande (placeholder com iniciais se sem foto).
- Nome em destaque.
- Linha de ícones no rodapé:
  - LinkedIn — abre URL.
  - Instagram — abre `https://instagram.com/{username}`.
  - Só aparecem se o campo existe.

### Paginação no rodapé
- 24 por página.
- Paginador padrão.

## Sem filtros, sem busca, sem WhatsApp

Por decisão de escopo:
- Sem campo de busca.
- Sem filtros (de empresa, fase, etc.).
- Sem botão de grupo do WhatsApp.
- Sem bio, cargo ou empresa exibidos.

## Estado vazio
- "A comunidade ainda está se formando. Volte em breve!"

## Privacidade

Crítico: o card **nunca** exibe telefone. Mesmo que algum endpoint vaze o campo acidentalmente, o componente `<MentoradoCard />` simplesmente não renderiza.

## Dados

`GET /comunidade?page=...&page_size=24`.

## Critérios de aceitação

- [ ] Grid responsivo nos 4 breakpoints.
- [ ] Ícones LinkedIn/Instagram condicionalmente exibidos.
- [ ] Paginação funcional.
- [ ] Estado vazio.
- [ ] Telefone NUNCA exibido (testar inspecionando o DOM com mentorado mockado tendo telefone).
- [ ] Lighthouse performance ≥ 85 com 24 cards.
- [ ] Tema light e dark.
