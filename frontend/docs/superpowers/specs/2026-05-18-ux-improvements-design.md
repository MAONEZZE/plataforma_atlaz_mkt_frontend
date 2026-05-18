# UX Improvements — Design Spec

**Date:** 2026-05-18  
**Status:** Approved

---

## Scope

Five independent UX improvements to the Atlaz frontend:

1. Global loading progress bar
2. Phone field with country code selector
3. Community cards redesign (name + photo + bio + social icon buttons)
4. New metric entry via dialog (not a separate page)
5. (Toasts already implemented via sonner — no change needed)

---

## 1. Global Progress Bar

**Library:** `nextjs-toploader` (App Router compatible, minimal config).

**Where:** `app/layout.tsx`, inserted before `{children}`.

**Config:** Use primary brand color. Spinner disabled (bar only). Height 3px.

**No changes needed** to individual pages or mutations — this covers only route transitions.

---

## 2. Phone Field with Country Code + Mask

**Library:** `react-phone-number-input` + its CSS.

**Files changed:**
- `lib/api/types.ts` — no change (telefone stays `string | null`)
- `lib/api/me.ts` — `UpdateMeInput.telefone` stays `string | null`
- `lib/utils/validations.ts` — update telefone schema field to accept E.164 format (via `isValidPhoneNumber` from `libphonenumber-js`, which is bundled with `react-phone-number-input`)
- `app/(app)/perfil/DadosPessoaisForm.tsx` — replace `<Input {...register("telefone")}>` with `<PhoneInput>` controlled component using `react-hook-form` Controller. Default country: `BR`.

**Behavior:** Flag + DDI select on left, masked number input on right. Stores E.164 string (e.g. `+5511999999999`). On load, pre-fills from `user.telefone`.

---

## 3. Community Cards Redesign

### Data layer changes

**`lib/api/types.ts`** — add `descricao: string | null` to `Usuario`.

**`lib/api/me.ts`** — add `descricao?: string | null` to `UpdateMeInput`.

**`lib/api/comunidade.ts`** — add `descricao: string | null` to `MentoradoPublico`.

### Profile form

**`app/(app)/perfil/DadosPessoaisForm.tsx`:**
- Add `descricao` to zod schema (optional, max 140 chars).
- Add textarea field labeled "Descrição" (140 char limit, hint text shown).
- Pass `descricao` to `MentoradoCard` in preview section.

### Card component

**`components/community/MentoradoCard.tsx`** — full redesign:

```
┌─────────────────────────┐
│  [Avatar 80px]          │
│  Nome Completo          │
│  Descrição curta...     │
│  ─────────────────────  │
│  [IG icon]  [LI icon]   │  ← only shown if field is set
└─────────────────────────┘
```

- Card itself is NOT a link (only icon buttons are clickable).
- Instagram icon: SVG inline (Lucide has no brand icons).
- LinkedIn icon: SVG inline.
- Each icon button: `<a target="_blank" rel="noopener noreferrer">` styled as icon button.
- Icons only shown if corresponding field is non-null.

---

## 4. Nova Métrica → Dialog

### MetricasForm refactor

**`components/forms/MetricasForm.tsx`** — add optional props:

```typescript
interface MetricasFormProps {
  mode: "create" | "edit";
  metricaId?: string;
  onSuccess?: () => void;  // NEW: if provided, called instead of router.push("/dashboard")
  onCancel?: () => void;   // NEW: if provided, called instead of router.push("/dashboard")
}
```

- If `onSuccess` not provided → `router.push("/dashboard")` (edit page unchanged).
- If `onCancel` not provided → existing cancel + AlertDialog behavior unchanged.
- 409 conflict (week exists): closes dialog via `onSuccess?.()` then navigates to edit page. If no `onSuccess`, existing behavior.

### Dashboard

**`app/(app)/dashboard/page.tsx`** — convert to client component:
- Replace `<Link href="/metricas/nova">` with a `<Button>` that opens `<Dialog>`.
- Dialog contains `<MetricasForm mode="create" onSuccess={closeDialog} onCancel={closeDialog} />`.

### Route deletion

**`app/(app)/metricas/nova/page.tsx`** — deleted entirely.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `app/layout.tsx` | Add `<NextTopLoader>` |
| `lib/api/types.ts` | Add `descricao` to `Usuario` |
| `lib/api/me.ts` | Add `descricao` to `UpdateMeInput` |
| `lib/api/comunidade.ts` | Add `descricao` to `MentoradoPublico` |
| `lib/utils/validations.ts` | Update telefone validation to E.164 |
| `components/community/MentoradoCard.tsx` | Full redesign with bio + icon buttons |
| `components/forms/MetricasForm.tsx` | Add `onSuccess`/`onCancel` props |
| `app/(app)/perfil/DadosPessoaisForm.tsx` | Replace telefone input + add descricao field |
| `app/(app)/dashboard/page.tsx` | Convert to client, add dialog trigger |
| `app/(app)/metricas/nova/page.tsx` | **Deleted** |

**New deps:** `nextjs-toploader`, `react-phone-number-input`

---

## Out of Scope

- Edit metrics page (`/metricas/[id]/editar`) — unchanged.
- Toast infrastructure — already complete.
- Backend changes — `descricao` field already exists in backend DTOs.
