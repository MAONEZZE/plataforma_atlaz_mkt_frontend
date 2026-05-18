# Frontend 06 — Telas de Conteúdo

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `frontend/00`, `frontend/01`, `frontend/02`, `backend/04-conteudo-context`
**Bloqueia:** —

---

## Rotas

- `/trilhas` — catálogo.
- `/trilhas/[id]` — detalhe com módulos e aulas.
- `/aulas/[id]` — player + comentários.

---

## `/trilhas`

Layout:
- Header: título "Trilhas", subtítulo "Aprendizado estruturado por temas".
- Grid responsivo: 3 colunas (lg), 2 (md), 1 (mobile).

Card de trilha (`.solid-surface`):
- Capa (se `capa_url`) ou gradiente baseado no título.
- Título.
- Descrição (truncada em 2 linhas).
- Barra de progresso: "X de Y aulas — Z%".
- Cor da barra:
  - Cinza claro se 0%.
  - Accent se > 0%.
  - Verde se 100%.
- Clique no card → `/trilhas/[id]`.

Dados: `GET /trilhas`.

Estado vazio: "Ainda não há trilhas disponíveis."

---

## `/trilhas/[id]`

Layout:
- Header: capa de fundo com overlay, título grande, descrição, progresso geral em barra.
- Botão "Voltar para Trilhas" (ghost, canto superior esquerdo).

Lista de módulos em `<Accordion>`:
- Cada módulo: título + "X aulas".
- Ao expandir: lista de aulas.

Cada aula na lista (item simples):
- Ícone de status: check verde se concluída, círculo vazio se pendente.
- Título.
- Duração estimada (se `duracao_minutos`).
- Hover: fundo `--accent-soft` sutil.
- Clique → `/aulas/[id]`.

Próxima aula sugerida:
- Primeira aula não concluída ganha chip "Continuar" ou borda lateral accent.

Dados: `GET /trilhas/[id]`.

---

## `/aulas/[id]`

Layout em 2 colunas em desktop (player à esquerda, sidebar com módulos à direita), stack em mobile.

### Coluna principal

**Player** (sólido, sem padding):
```tsx
<DriveVideoPlayer fileId={aula.drive_file_id} />
```

**Cabeçalho da aula** (abaixo do player):
- Título.
- Trilha → Módulo (breadcrumb).
- Descrição (markdown).

**Botão de progresso:**
- Se não concluída: `<Button variant="primary">Marcar como concluída</Button>`.
- Se concluída: badge verde "✓ Concluída em DD/MM/YYYY" + botão ghost "Desmarcar".

**Card "Próxima aula"** (`.glass-soft`):
- Só aparece se há próxima.
- Ícone seta + "Próxima aula: [título]" + botão "Ir para a próxima".
- Se é a última da trilha: card "Trilha concluída!" com ícone troféu.

**Seção de comentários:** `<CommentsList aulaId={id} />`.

### Coluna lateral (desktop)

Sidebar com módulos/aulas da trilha (mesma estrutura de `/trilhas/[id]`), destacando a aula atual.

Em mobile: vira accordion no topo da página, colapsado.

Dados:
- `GET /aulas/[id]`.
- `GET /trilhas/{trilha_id}` (paralelo).

Ações:
- `POST /aulas/[id]/concluir`.
- `DELETE /aulas/[id]/concluir`.

Atualização otimista: clica → muda estado local imediatamente → request em background → reverte se falhar.

## Critérios de aceitação

- [ ] `/trilhas` grid responsivo com progresso.
- [ ] `/trilhas/[id]` accordion expansível.
- [ ] Próxima aula sugerida destacada.
- [ ] `/aulas/[id]` player do Drive renderiza.
- [ ] Marcar/desmarcar otimista.
- [ ] "Próxima aula" segue ordem (módulo → trilha).
- [ ] "Trilha concluída" quando última é finalizada.
- [ ] Sidebar lateral em desktop / accordion em mobile.
- [ ] Comentários renderizam e funcionam (criar, editar, apagar).
