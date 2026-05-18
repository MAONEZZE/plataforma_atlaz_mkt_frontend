# Frontend 01 — Implementação do Design System Glass

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `shared/05`, `frontend/00`
**Bloqueia:** todas as specs de tela do frontend

---

> Implementa as definições de `shared/05`. Não duplica tokens — materializa em código.

## 1. `globals.css`

Importar todos os tokens de `shared/05` (light + dark via `prefers-color-scheme`), classes `.glass`, `.glass-soft`, `.solid-surface`, fallback `@supports`, media query mobile.

## 2. Tailwind config

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
export default {
  darkMode: "media",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "surface-solid": "var(--surface-solid)",
        "surface-elevated": "var(--surface-solid-elevated)",
      },
      borderRadius: { glass: "1rem" },
    },
  },
} satisfies Config;
```

## 3. `<PageBackground />`

Renderiza blobs fixos. Em `app/layout.tsx` como filho do `<body>`.

```tsx
export function PageBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background: `
          radial-gradient(at 20% 20%, rgba(124, 58, 237, 0.15), transparent 40%),
          radial-gradient(at 80% 30%, rgba(59, 130, 246, 0.10), transparent 45%),
          radial-gradient(at 50% 80%, rgba(236, 72, 153, 0.10), transparent 40%)
        `,
      }}
    />
  );
}
```

## 4. `<GlassCard />`

```tsx
type Props = {
  variant?: "glass" | "soft" | "solid";
  className?: string;
  children: React.ReactNode;
};

export function GlassCard({ variant = "soft", className, children }: Props) {
  const map = { glass: "glass", soft: "glass-soft", solid: "solid-surface" };
  return <div className={cn(map[variant], "p-6", className)}>{children}</div>;
}
```

## 5. Customizar shadcn/ui

Conforme `shared/05`:
- Dialog, Sheet, DropdownMenu, Popover, Toast → `.glass`.
- Table → sempre `.solid-surface`.
- Card → variantes glass/soft/solid.

## 6. Logo

Logo única em `public/logo.svg`. Usar em todos os lugares com `next/image`:

```tsx
import Image from "next/image";

<Image src="/logo.svg" alt="Atlaz" width={120} height={40} priority />
```

Aceito que a logo pode contrastar menos em um dos temas. Sem versão alternativa no MVP.

## 7. Foco e acessibilidade

```css
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 8. Botões padrão

Variantes em `components/ui/button.tsx`:
- `primary`: `bg-accent text-white hover:brightness-110`
- `secondary`: `glass-soft border-accent text-accent`
- `destructive`: `bg-danger text-white`
- `ghost`: `text-text-secondary hover:bg-accent-soft`

## Critérios de aceitação

- [ ] Tokens em `globals.css` (light + dark).
- [ ] Tailwind consumindo tokens.
- [ ] `<PageBackground />` em `app/layout.tsx`.
- [ ] `<GlassCard />` com 3 variantes.
- [ ] Dialog, Sheet, DropdownMenu, Popover, Toast com glass.
- [ ] Foco visível com accent.
- [ ] Reduced motion respeitado.
- [ ] Logo única em `public/logo.svg` visível em ambos os temas.
- [ ] Lighthouse acessibilidade ≥ 90 na tela `/login`.
