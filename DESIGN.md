# TestGen Design System

Reference for building new features in `test-gen`. Everything here is taken from code that already ships. When a pattern below conflicts with an older page, follow this file and leave the older page alone unless you are already editing it.

Stack: React 18, Tailwind CSS v4 (configured in CSS, there is no `tailwind.config`), `lucide-react` icons, `cn()` from `@/lib/utils` (clsx + tailwind-merge) for conditional classes.

---

## 1. Tokens

Defined in [src/styles/index.css](src/styles/index.css). Use the Tailwind names, not raw hex.

| Tailwind name | Light | Dark | Use for |
|---|---|---|---|
| `primary` | `#6366f1` | `#6366f1` | Primary buttons, active states, focus rings, icon accents |
| `primary-hover` | `#4f46e5` | `#4f46e5` | Hover state of `bg-primary` |
| `surface` | `#ffffff` | `#ffffff` | Page background (light) |
| `surface-dark` | `#f8fafc` | `#0A0912` | Page background (dark), input fills, nested rows |
| `surface-card` | `#ffffff` | `#11101D` | Cards, modals, dropdown menus |
| `border-brand` | `#e2e8f0` | `#1F1D2C` | Borders on cards, inputs, dividers in dark mode |
| `sidebar-bg` | — | `#11101D` | Sidebar and mobile top bar (dark) |

Neutrals come from Tailwind's `slate` scale. Status colors come from Tailwind's `emerald`, `red`, `amber` and `blue`/`indigo` scales (see §6).

**Brand gradient** (marketing surfaces only: Login, Welcome): `#2563eb → #11D4B7`. Don't use it on buttons or in-app UI. Buttons use solid `primary`.

### Dark mode

Class-based: `.dark` on `<html>`, toggled by `useThemeStore`. Every color class needs a `dark:` pair. The standard pairs:

| Element | Light | Dark |
|---|---|---|
| Card background | `bg-white` | `dark:bg-surface-card` |
| Card / input border | `border-slate-200` | `dark:border-border-brand` |
| Input / nested row fill | `bg-slate-50` | `dark:bg-surface-dark` |
| Heading text | `text-slate-900` | `dark:text-white` |
| Body / label text | `text-slate-700` | `dark:text-slate-300` |
| Secondary text | `text-slate-500` | `dark:text-slate-400` |
| Hint / muted text | `text-slate-400` | `dark:text-slate-500` |
| Hover fill | `hover:bg-slate-50` | `dark:hover:bg-primary/5` |

Older code uses `dark:bg-slate-900`, `dark:bg-slate-800` and `dark:border-slate-700/50`. Use the brand tokens above in new code.

---

## 2. Typography

System font stack (no custom web font). Sizes in use:

| Role | Classes |
|---|---|
| Page title (h1) | `text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2` + a 20px `text-primary` icon |
| Page subtitle | `text-xs text-slate-500 dark:text-slate-400 mt-1` |
| Section / card title (h2) | `text-base font-semibold text-slate-900 dark:text-white` |
| Modal title (h3) | `text-lg font-bold text-slate-800 dark:text-white` (built into `Modal`) |
| Form label | `text-sm font-medium text-slate-700 dark:text-slate-300` |
| Body | `text-sm` |
| Helper / hint | `text-xs text-slate-400 dark:text-slate-500` |
| Sidebar group label, eyebrow | `text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400` |
| Badge text | `text-[10px] font-bold uppercase tracking-wider` |

Mark optional fields inline: `Label <span className="text-slate-400 font-normal">(optional)</span>`.

Larger display type (`text-3xl` and up, `font-extrabold`) belongs only on marketing surfaces (Login, Welcome).

---

## 3. Shape, spacing, elevation

- **Radius:** `rounded-2xl` for cards and modals, `rounded-xl` for inputs, buttons, dropdown menus, alerts and list rows, `rounded-lg` for small icon buttons and icon tiles, `rounded-full` for pills, badges, switches and avatars.
- **Card padding:** `p-6`, with `space-y-6` between form groups and `space-y-2` between a label and its control.
- **Page rhythm:** the page root is `space-y-6 animate-slide-up`.
- **Elevation:** cards are flat (border, no shadow). Floating layers get shadow: dropdown menus use `shadow-xl`, modals and toasts use `shadow-2xl` / `shadow-xl`. Primary buttons carry `shadow-lg shadow-primary/20`.
- **Borders:** 1px `border-slate-200 dark:border-border-brand` everywhere.

---

## 4. Layout

[Layout.tsx](src/components/Layout/Layout.tsx) owns the shell: a fixed sidebar (`w-52`, collapsible to `w-16`), a mobile top bar below `lg`, and a content column capped at `max-w-7xl` with `p-4 lg:p-6`. Pages render only their content. Don't add outer padding, a max width or a background.

Only `/` is full-bleed. Login renders outside the shell.

Responsive: design mobile first, then add `md:` (two-column forms: `grid grid-cols-1 md:grid-cols-2 gap-4`) and `lg:` (sidebar visible). Wide tables scroll inside their card (`overflow-x-auto`), never the page.

---

## 5. Components

Reuse these before writing new markup. They live in [src/components/](src/components/).

| Component | Use instead of | Notes |
|---|---|---|
| `Modal` | custom overlays | Props: `title`, `maxWidth` (`sm`–`3xl`, default `md`), `noPadding`. Handles Esc, overlay click and scroll lock. |
| `Dropdown` | native `<select>` | Props: `value`, `onChange`, `options: string[]`, `loading`, `placeholder`. |
| `Checkbox` | `<input type="checkbox">` | Props: `checked`, `onChange`, `label`, `description`. |
| `ToggleSwitch` | checkbox for on/off settings | Props: `checked`, `onChange(bool)`, `label`, `description`. |
| `Tooltip` | `title=""` | Portaled; `position` defaults to `right`. |
| `ResultTable` | ad-hoc tables for test case output | |
| `useToast()` | `alert()` | `toast.success / error / warning / info(msg)`. |

Several older modals and pages still use native `<select>`. New code uses `Dropdown`.

### Buttons

```tsx
// Primary
className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"

// Secondary
className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors"

// Text / inline action
className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"

// Icon button
className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-primary/20 transition-colors"

// Destructive (sidebar Log Out pattern)
className="... hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
```

- Button groups: `flex gap-3 pt-2`. Put the primary action on the right, or give it `flex-[2]` next to a `flex-1` Cancel.
- Loading state: disable the button and prepend `<Loader2 size={15} className="animate-spin" />`, keeping the label (or switch it to a present-tense verb, e.g. "Signing in...").
- AI actions may use the `btn-ai-hollow` utility (animated gradient outline). Keep it rare.

### Inputs

```tsx
// Text input / textarea
className="w-full px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
```

- With a leading icon: wrap in `relative`, place a 16px icon at `absolute left-3 top-1/2 -translate-y-1/2 text-slate-400`, and use `pl-9`.
- Textarea: same classes plus `resize-none leading-relaxed` and a fixed height (`h-40`).
- Field error: `<p className="text-xs text-red-500">…</p>` under the field.

### Cards

```tsx
className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 space-y-6"
```

List rows inside a card: `flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl text-sm`.

Selectable cards: `border-primary bg-primary/5 ring-1 ring-primary` when selected, `hover:border-primary/50` otherwise.

### Icon tiles

Square tile holding a lucide icon, used on feature cards, steps and quick-start cards:

```tsx
<div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
  <Icon size={20} />
</div>
```

Smaller variant: `w-8 h-8 rounded-lg` with `size={16}`.

### Badges and pills

```tsx
// Neutral / brand
className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold"
// Chip on a colored background (Login)
className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white shadow-sm px-3 py-1 text-xs font-semibold text-primary"
```

---

## 6. Feedback and status

| Status | Background | Border | Text | Icon |
|---|---|---|---|---|
| Success | `bg-emerald-50 dark:bg-emerald-950/40` | `border-emerald-200 dark:border-emerald-800/50` | `text-emerald-800 dark:text-emerald-300` | `CheckCircle` |
| Error | `bg-red-50 dark:bg-red-950/40` | `border-red-200 dark:border-red-800/50` | `text-red-800 dark:text-red-300` | `XCircle` |
| Warning | `bg-amber-50 dark:bg-amber-900/10` | `border-amber-200 dark:border-amber-800/30` | `text-amber-700 dark:text-amber-400` | `AlertTriangle` |
| Info | `bg-indigo-50/50 dark:bg-indigo-500/5` | `border-indigo-100 dark:border-indigo-500/20` | `text-slate-600 dark:text-slate-300` | `Info` (`text-indigo-500`) |

- **Transient results** (saved, copied, failed request): use a toast.
- **Persistent conditions** (feature not configured, missing API key): use an inline banner at the top of the page, `px-4 py-3 rounded-xl` with the status colors above, and a text action on the right (e.g. "Go to Settings" → `/settings?tab=…`). See [QaTaskCreatorPage.tsx](src/pages/QaTaskCreator/QaTaskCreatorPage.tsx).
- **Loading:** `Loader2` with `animate-spin` inside the triggering button or control. Don't block the page.
- **Destructive confirmation:** a `Modal` with a secondary Cancel and a red primary. Some older pages use `window.confirm`, which new code shouldn't.

---

## 7. Icons

- `lucide-react` only.
- Sizes: 20 for page titles and icon tiles, 16 for nav, inputs and buttons, 12–14 for inline text actions and badges.
- Color: `text-primary` for accents, `text-slate-400` for decorative icons inside inputs.
- Integration logos (Jira, Confluence, Slack) are PNGs in `public/assets/icons/`, rendered at `w-4 h-4 object-contain`.

---

## 8. Motion

| Utility | Use |
|---|---|
| `animate-slide-up` | Page root on mount |
| `animate-fade-in` | Content swapped in after loading |
| `animate-in fade-in zoom-in-95 duration-150` | Dropdown menus, tooltips |
| `animate-in zoom-in-95 duration-200` | Modals |
| `transition-colors` | Buttons and hover fills (default) |
| `transition-all duration-300` | Layout changes (sidebar collapse) |
| `hover-scale` | Clickable cards only |

Keep motion short (150–500 ms). Don't animate inside long lists or tables.

---

## 9. Adding a feature page

1. Create `src/pages/<Feature>/<Feature>Page.tsx`, and put data and API logic in `src/hooks/use<Feature>.ts`.
2. Lazy-load the page and add a `<Route>` in [src/App.tsx](src/App.tsx).
3. Add a nav entry in [src/lib/navigation.ts](src/lib/navigation.ts) with `label`, a lucide `icon`, a one-line `description` (also shown on the Welcome page) and `workspace` (`"all"`, `"fithub"` or `"diricare"`).
4. Page skeleton:

```tsx
<div className="space-y-6 animate-slide-up">
  <div>
    <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
      <Icon size={20} className="text-primary" />
      Feature Name
    </h1>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">One sentence on what this page does.</p>
  </div>

  {/* Optional: "not configured" banner (§6) */}

  <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 space-y-6">
    {/* form groups: label + control + hint, spaced space-y-2 */}
    {/* action row: flex gap-3 pt-2 */}
  </div>

  {/* Result cards appear below the input card */}
</div>
```

5. Before merging: check light and dark mode, check mobile width (no horizontal page scroll), and check disabled and loading states for every action.

---

## 10. Known inconsistencies (don't copy)

- `--primary-rgb` is only defined under `.dark`, so `rgba(var(--primary-rgb), …)` does nothing in light mode. Use `primary/NN` opacity modifiers instead.
- `dark:text-primary-foreground` appears in the sidebar and Release Visibility, but no `primary-foreground` token exists, so the class is a no-op.
- Page title icons vary between 20px and `w-6 h-6` (24px) across pages. Use 20px.
