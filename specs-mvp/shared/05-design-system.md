# Shared 05 — Design System (Glassmorphism)

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** —
**Bloqueia:** `frontend/01-design-system-glass` e todas as specs de tela

---

## Princípios

1. Estética Apple: vidro translúcido + blur + fundos com gradiente.
2. Aplicação **seletiva**: glass em superfícies elevadas (navbar, modais, dropdowns, cards de destaque). Não em listas longas, tabelas, formulários extensos, player.
3. Tema: `prefers-color-scheme` do sistema. Sem toggle manual no MVP.
4. Acento: violeta — `#7C3AED` no light, `#A78BFA` no dark.

## Fundo da página

```css
body {
  background-color: var(--page-bg);
  position: relative;
  overflow-x: hidden;
}
body::before {
  content: '';
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(at 20% 20%, rgba(124, 58, 237, 0.15), transparent 40%),
    radial-gradient(at 80% 30%, rgba(59, 130, 246, 0.10), transparent 45%),
    radial-gradient(at 50% 80%, rgba(236, 72, 153, 0.10), transparent 40%);
}
```

Em dark, ajustar opacidades para 0.20.

## Tokens CSS

```css
:root {
  --page-bg: #FAFAFB;
  --glass-bg: rgba(255, 255, 255, 0.55);
  --glass-border: rgba(255, 255, 255, 0.80);
  --glass-blur: 24px;
  --glass-saturate: 180%;
  --glass-bg-soft: rgba(255, 255, 255, 0.40);
  --glass-border-soft: rgba(255, 255, 255, 0.60);
  --glass-blur-soft: 16px;
  --surface-solid: #FFFFFF;
  --surface-solid-elevated: #F4F4F6;
  --text-primary: #0A0A0F;
  --text-secondary: rgba(10, 10, 15, 0.65);
  --text-tertiary: rgba(10, 10, 15, 0.45);
  --accent: #7C3AED;
  --accent-soft: rgba(124, 58, 237, 0.15);
  --success: #16A34A;
  --warning: #CA8A04;
  --danger: #DC2626;
}

@media (prefers-color-scheme: dark) {
  :root {
    --page-bg: #0A0A0F;
    --glass-bg: rgba(20, 20, 25, 0.55);
    --glass-border: rgba(255, 255, 255, 0.10);
    --glass-blur: 28px;
    --glass-bg-soft: rgba(30, 30, 35, 0.50);
    --glass-border-soft: rgba(255, 255, 255, 0.08);
    --glass-blur-soft: 18px;
    --surface-solid: #16161B;
    --surface-solid-elevated: #1E1E25;
    --text-primary: #FAFAFB;
    --text-secondary: rgba(250, 250, 251, 0.70);
    --text-tertiary: rgba(250, 250, 251, 0.50);
    --accent: #A78BFA;
    --accent-soft: rgba(167, 139, 250, 0.20);
    --success: #4ADE80;
    --warning: #FACC15;
    --danger: #F87171;
  }
}
```

## Classes utilitárias

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  border-radius: 1rem;
}
.glass-soft {
  background: var(--glass-bg-soft);
  backdrop-filter: blur(var(--glass-blur-soft)) saturate(160%);
  -webkit-backdrop-filter: blur(var(--glass-blur-soft)) saturate(160%);
  border: 1px solid var(--glass-border-soft);
  border-radius: 1rem;
}
.solid-surface {
  background: var(--surface-solid);
  border-radius: 1rem;
}

@supports not (backdrop-filter: blur(1px)) {
  .glass, .glass-soft { background: var(--surface-solid); }
}

@media (max-width: 768px) {
  :root { --glass-blur: 16px; --glass-blur-soft: 12px; }
}
```

## Onde usar (normativa)

| Elemento | Classe |
|---|---|
| Navbar superior | `.glass` |
| Modais | `.glass` |
| Dropdowns, popovers | `.glass` |
| Toasts | `.glass-soft` |
| Cards de KPI (4 do dashboard) | `.glass-soft` |
| Card "Próxima aula" | `.glass-soft` |
| Tabelas | `.solid-surface` |
| Cards de mentorado (Comunidade) | `.solid-surface` |
| Cards de aula em listas | `.solid-surface` |
| Formulários grandes (métricas, perfil) | `.solid-surface` |
| Player de vídeo | `.solid-surface` |
| Lista de comentários | `.solid-surface` |

## Acessibilidade

- Texto sobre glass: peso mínimo 500.
- Foco visível: outline 2px `--accent` com offset 2px.
- Respeitar `prefers-reduced-motion`.
- Contraste AA (Lighthouse ≥ 90 nas telas principais).

## Performance

- Máximo 6–8 elementos com `backdrop-filter` simultaneamente.
- Em listas, sempre `.solid-surface`.
- Mobile: blur reduzido via media query (já no token).

## Componentes shadcn/ui — customizações

| Componente | Variante |
|---|---|
| Dialog, Sheet, DropdownMenu, Popover, Toast | `.glass` |
| Card | prop `variant: "glass" \| "soft" \| "solid"` (default solid) |
| Table | sempre `.solid-surface` |
| Input, Textarea, Select | sólido, focus com `--accent` |

## Critérios de aceitação

- [ ] Tokens em `globals.css`.
- [ ] Classes funcionando.
- [ ] Fallback `@supports` testado.
- [ ] Variantes do Card.
- [ ] Tema light e dark validados.
- [ ] Lighthouse acessibilidade ≥ 90 na tela de Login.
- [ ] iPhone SE: scroll na Comunidade fluido (≥ 50fps).
