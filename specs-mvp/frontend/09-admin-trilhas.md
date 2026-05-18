# Frontend 09 — Admin: Gerenciar Trilhas

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `frontend/00`, `frontend/01`, `frontend/02`, `backend/04-conteudo-context`
**Bloqueia:** —

---

## Rota

`/admin/trilhas` — apenas admin.

## Layout

Página de gestão em árvore expansível.

### Header
- Título h1 "Gerenciar Trilhas".
- Botão "+ Nova trilha" no canto direito (primary).

### Árvore

Cada trilha vira um item:
- Drag handle à esquerda (ícone `grip-vertical` do lucide).
- Título da trilha.
- Contagem: "X módulos, Y aulas".
- Ações à direita (ícones lucide):
  - Editar (pencil).
  - Remover (trash) — com confirmação.
- Botão "Expandir" / "Recolher" (chevron).

Ao expandir trilha: lista de módulos. Mesmo padrão (drag, título, contagem, ações).

Ao expandir módulo: lista de aulas. Mesmo padrão.

Botões "+ Adicionar módulo" / "+ Adicionar aula" dentro de cada nível.

### Drag-and-drop

Reordenar via `dnd-kit`. Após soltar:
- `POST /admin/trilhas/reordenar` (ou módulos/aulas).
- Body: `{ ordem: [{id, ordem}, ...] }` com **apenas os itens que mudaram**.
- Atualização otimista. Reverte se falhar.

---

## Modal "Nova/Editar Trilha"

`<GlassModal>` (Dialog `.glass`):
- Título: "Nova trilha" ou "Editar trilha".
- Form:
  - Título (text).
  - Descrição (textarea).
  - URL da capa (opcional).
- Botões: "Salvar" / "Cancelar".

Submit: `POST /admin/trilhas` ou `PATCH /admin/trilhas/{id}`.

## Modal "Novo/Editar Módulo"

- Trilha (read-only, vem do contexto).
- Título.
- Descrição.

Submit: `POST /admin/modulos` ou `PATCH`.

## Modal "Nova/Editar Aula"

- Módulo (read-only, contexto).
- Título.
- Descrição (textarea, suporte markdown).
- **URL do Google Drive:**
  - Input com validação inline.
  - Quando válida: mostra "✓ ID detectado: abc123..." em verde.
  - Quando inválida: mostra "URL inválida — espera-se link do Google Drive" em vermelho.
- Duração (minutos, opcional).

Submit: `POST /admin/aulas` ou `PATCH`.

---

## Confirmações de exclusão

`<AlertDialog>`:
- Trilha: "Tem certeza? Esta ação removerá a trilha e **todos os seus módulos e aulas**. Mentorados perderão o progresso registrado."
- Módulo: "Tem certeza? Esta ação removerá o módulo e **todas as suas aulas**."
- Aula: "Tem certeza? Esta ação removerá a aula. Comentários e progresso serão apagados."

Botões: "Cancelar" (ghost) / "Remover" (destructive).

## Estado vazio

Sem trilhas: `<EmptyState>` com "Nenhuma trilha criada ainda." + CTA "Criar primeira trilha".

## Critérios de aceitação

- [ ] Cliente é redirecionado para `/dashboard` (guard).
- [ ] Árvore expansível em 3 níveis.
- [ ] Drag-and-drop em cada nível com otimismo + revert.
- [ ] Modal de aula valida URL do Drive em tempo real.
- [ ] Confirmação dupla para remoção.
- [ ] Estado vazio com CTA.
- [ ] Tema light e dark.
