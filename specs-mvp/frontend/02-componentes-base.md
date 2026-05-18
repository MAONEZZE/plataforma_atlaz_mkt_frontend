# Frontend 02 — Componentes Base e Navbar

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `frontend/00`, `frontend/01`
**Bloqueia:** todas as specs de tela

---

## `<Navbar />`

**Localização:** topo de todas as páginas `(app)`.

Estrutura (`.glass`, fixa no topo, full-width):
- **Esquerda:** logo Atlaz (`public/logo.svg`, clicável → `/dashboard`).
- **Meio (links centralizados):**
  - "Dashboard" → `/dashboard`.
  - "Trilhas" → `/trilhas`.
  - "Comunidade" → `/comunidade`.
  - Se admin, dois itens extras:
    - "Gerenciar Trilhas" → `/admin/trilhas`.
    - "Dashboard Admin" → `/admin/dashboard`.
- **Direita:** `<UserDropdown />`.

Item ativo: borda inferior 2px `--accent`, texto na cor `--accent`.

Em mobile (`< md`): links colapsam num menu hambúrguer que abre `<Sheet>` (`.glass`).

## `<UserDropdown />`

Botão clicável: foto + nome (em mobile, só foto).

Ao clicar, `<DropdownMenu>` (`.glass`) com:
- "Configurações" → `/perfil`.
- Separador.
- "Logout".

### Logout

```tsx
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

async function handleLogout() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
  router.push("/login");
  router.refresh();           // limpa cache de Server Components
}
```

> **Não chama mais `POST /auth/logout`.** Tudo via Supabase SDK.

Lê dados do usuário via hook `useCurrentUser()` (definido em `lib/auth/use-current-user.ts`), que combina sessão Supabase + dados de `GET /me`.

## `<DataTable<T>>`

Wrapper de TanStack Table:

```ts
type Props<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  pagination?: { page: number; pageSize: number; total: number; onChange: (page: number) => void };
  onRowClick?: (row: T) => void;
};
```

Sort por coluna. Paginação server-side. Skeleton durante loading. `.solid-surface`.

## `<EmptyState />`

```ts
type Props = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};
```

## `<WeekPicker />`

```ts
type Props = {
  value: Date | null;
  onChange: (semanaInicio: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
};
```

Renderiza botão "Semana de DD/MM a DD/MM/YYYY". Clique abre popover (`.glass`) com calendário. Qualquer clique normaliza para segunda (`startOfWeek(date, { weekStartsOn: 1 })`).

## `<DriveVideoPlayer />`

```ts
type Props = { fileId: string; className?: string };
```

```tsx
<iframe
  src={`https://drive.google.com/file/d/${fileId}/preview`}
  allow="autoplay"
  allowFullScreen
  className={cn("w-full aspect-video rounded-glass border-0", className)}
/>
```

## `<CommentsList />`

```ts
type Props = { aulaId: string };
```

- Form de novo comentário no topo (textarea + botão "Publicar", max 2000 chars).
- Lista cronológica reversa, paginada.
- Cada comentário (`.solid-surface`): avatar + nome + "há X tempo" + texto.
- Selo "Editado" se `editado_em`.
- "Comentário removido" se `apagado_em`.
- Ações:
  - Próprio: Editar (inline), Apagar (confirmação).
  - Admin: Editar/Apagar qualquer.

Mutations otimistas com rollback.

Dados: `GET /aulas/{aulaId}/comentarios` (com token automático via axios interceptor).

## `<MentoradoCard />`

```ts
type Props = {
  mentorado: {
    id: string;
    nome: string;
    foto_url: string | null;
    linkedin_url: string | null;
    instagram_username: string | null;
  };
};
```

Card `.solid-surface`:
- Foto circular grande (placeholder com iniciais se sem foto).
- Nome.
- Linha de ícones no rodapé:
  - LinkedIn (se `linkedin_url`).
  - Instagram (se `instagram_username`) — abre `https://instagram.com/{username}`.

**Nunca exibe telefone, email ou outros dados privados.**

## `<PasswordInput />` e `<PasswordStrengthIndicator />`

Usados no `/perfil` (aba Segurança) e potencialmente em outras telas futuras.

`<PasswordInput>`: input password com botão de toggle (olho aberto/fechado).

`<PasswordStrengthIndicator>`: barra de progresso colorida baseada em regras:
- 0% — vazio.
- 33% — atende 1 critério.
- 66% — atende 2 critérios.
- 100% — atende todos (8+ chars, 1 maiúscula, 1 número).

## Critérios de aceitação

- [ ] Navbar fixa, glass, itens conforme role.
- [ ] UserDropdown com Configurações e Logout via `supabase.auth.signOut()`.
- [ ] Mobile: navbar colapsa em hambúrguer.
- [ ] DataTable funcional com sort + paginação.
- [ ] EmptyState aceita ação opcional.
- [ ] WeekPicker normaliza para segunda.
- [ ] DriveVideoPlayer responsivo 16:9.
- [ ] CommentsList com mutations otimistas.
- [ ] MentoradoCard nunca exibe telefone.
- [ ] PasswordInput com toggle de visibilidade.
- [ ] Tema light e dark validados.
