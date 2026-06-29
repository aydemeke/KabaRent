# KabaRent Design System — "Cotton & Thread"

Palette and component tokens as of the Cotton & Thread redesign. Canonical source of truth is
`frontend/tailwind.config.js` (Tailwind tokens) and `frontend/src/index.css` (`@layer components`
`ds-*` classes + `:root --color-*` CSS vars). The CSS vars are kept in sync with Tailwind for
reference but are currently unused by JavaScript.

---

## Principles

- **No hard borders on cards** — use ambient shadow and background shift for separation
- **No pure black** — use `on-surface` (`#1C1B16`) everywhere
- **No `primary` as a full-page background** — leaf green is for buttons, active states, and accents only
- **No horizontal divider lines between sections** — background ramp shifts signal transitions
- **Generous whitespace** — 16px more than instinct suggests, everywhere
- **Cream, not white** — default surface is warm `#FDFBF5`; pure white is reserved for interactive elements (inputs, cards, modals)

---

## Color Palette

### Primary / Accent

| Token | Value | Usage |
|---|---|---|
| `primary` | `#1C7C49` | Buttons, active links, brand |
| `accent-gold` | `#FFC233` | Active-link underline, gold accents |
| `accent-red` | `#E24A3B` | Destructive / warning UI |
| `accent-red-text` | `#B5392D` | Red text on light bg (AA contrast) |

> `secondary` and `secondary-container` are aliases of `accent-gold`; `tertiary` is an alias of `accent-red`. These aliases are kept for backward compat — use the `accent-*` names in new code.

### Surface Ramp (warm cream)

| Token | Value | Usage |
|---|---|---|
| `surface` | `#FDFBF5` | Page background |
| `surface-container-lowest` | `#FFFFFF` | Cards, modals, inputs |
| `surface-container-low` | `#F8F3E7` | Input fields, subtle card bg |
| `surface-container` | `#F3ECD9` | Table heads, section backgrounds |
| `surface-container-high` | `#ECE4CB` | Hover states, deeper section fills |
| `surface-container-highest` | `#E4DABB` | Disabled surfaces |

### Text / Outline

| Token | Value | Usage |
|---|---|---|
| `on-surface` | `#1C1B16` | Primary text (ink) |
| `on-surface-variant` | `#5A5443` | Secondary text, muted labels |
| `outline-variant` | `#ECE4CB` | Borders, hairlines, dividers |

> `outline-variant` shares its value with `surface-container-high` (`#ECE4CB`) but has a distinct semantic role — use `outline-variant` for borders and `surface-container-high` for fill/hover.

---

## Typography

### Fonts
- **Plus Jakarta Sans** — headings (`h1`–`h6`), brand, display text. Weights: 700, 800.
- **Inter** — body, labels, buttons, descriptions. Weights: 400, 500, 600.

Both are set globally in `index.css`: `h1`–`h6` via the heading rule, body/interactive elements via the `button, input, select, textarea, label, a` rule.

---

## Components

### Buttons

**Primary (`.ds-btn-primary`)**
Flat `#1C7C49` fill, white text, `border-radius: 0.625rem`, weight 600.
Hover: darken to `#197042` + stronger ambient shadow. Active: `#17663C`. Disabled: `opacity-50`.

**Ghost (`.ds-btn-ghost`)**
Transparent, `1px solid #ECE4CB` border, `#1C7C49` text, `border-radius: 999px` (pill).
Hover: soft green tint background + `#1C7C49` border.
Used for "הזמנה חדשה" in the Navbar (with `border-radius: 10px` override).

**Text (`.ds-btn-text`)**
Borderless, `#1C7C49` text. Hover: gold underline (`#FFC233`, 2px, offset 2px).

**Destructive**
Use `accent-red-text` (`#B5392D`) for text on light backgrounds.

### Input Fields (`.ds-input`, `.ds-select`)

- Background: `#FFFFFF`
- Border: `1px solid #ECE4CB`
- Border-radius: `0.75rem` (`rounded-xl`)
- Focus: border → `#1C7C49`, `box-shadow: 0 0 0 3px rgba(28,124,73,0.15)`, no browser outline
- Placeholder color: `#5A5443` (`on-surface-variant`)
- Disabled (select only): `#E4DABB` bg, `#5A5443` text, `not-allowed` cursor

Touch targets: `min-height: 44px` enforced below 640px.

### Kaba Cards (BrowsePage)

- Background: `#FFFFFF`
- Border-radius: `2.5rem`
- No border
- Ambient shadow on hover (green-tinted); shadow values defined as Tailwind `ambient`/`ambient-lg` tokens in `tailwind.config.js`
- Image area: fixed `height: 220px`, `object-fit: contain`, hover `scale-105` over `duration-700`
- Bottom gradient overlay: `rgba(1,45,29,0.40)` → transparent (darkens image base for badge legibility)
- Category badge (top-right): `rgba(255,255,255,0.90)` + `backdrop-filter: blur(8px)`, pill shape
- Availability badge (top-left): solid green/red pill

> Note: inline shadow values in BrowsePage still use the old `rgba(1,45,29,…)` — the Tailwind config tokens use the correct new `rgba(28,124,73,…)`. These inline values are pending a cleanup pass.

### Admin Panels (`.ds-panel`)

- Background: `#FFFFFF`
- Border: `1px solid #ECE4CB`
- Border-radius: `1rem` (`rounded-2xl`)
- Box shadow: `0 2px 16px rgba(28,124,73,0.06)`

Table head (`.ds-table-head`):
- Background: `#F3ECD9` (`surface-container`)
- Bottom border: `1px solid #ECE4CB`
- Text: `#1C1B16`, uppercase, `letter-spacing: 0.05em`, weight 600, `0.75rem`

### Modals (`Modal.jsx`)

- Overlay: `rgba(0,0,0,0.40)` + `backdrop-filter: blur(16px)`
- Box: `#FFFFFF`, `border-radius: 2rem`, padding `32px`, `max-width: lg`
- Box shadow: `0 24px 48px rgba(1,45,29,0.18)` (pending token cleanup)

`KabaDetailModal.jsx` is a separate component with its own layout (image header + body); it uses `border-radius: 20px` and a different inner structure — it is not an instance of `Modal.jsx`.

---

## Navbar / Header

- Sticky, `z-40`
- Background: `rgba(253,251,245,0.85)` + `backdrop-filter: blur(20px)` (frosted warm cream)
- Bottom hairline: `1px solid #ECE4CB`
- Box shadow: `0px 12px 32px rgba(28,124,73,0.05)`
- Active link: `border-b-2 border-accent-gold pb-0.5`
- Auth links: text-style (`color: #1C7C49`, hover darken)
- "הזמנה חדשה": `.ds-btn-ghost` with `border-radius: 10px`
- Logo: transparent PNG (`/kaba-rent-logo.png` — white knocked out in the asset), plain `<img>`, no `mixBlendMode`
- Mobile dropdown: `rgba(253,251,245,0.97)` bg, `1px solid #ECE4CB` top border

---

## Layout

- **Responsive grid** for Kaba cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, `gap-5` — standard 3-column grid, no staggering
- **Section separation** via background ramp shift, never border lines
- Page background: `.customer-bg` class in `index.css` — fixed pseudo-element (`::before`) holds a tinted background image (`rgba(253,251,245,0.85)` gradient overlay over `/kaba-rent-bg-1.png`) to avoid repaint jitter on scroll

---

## Focus / Accessibility

- WCAG AA contrast throughout
- RTL (Hebrew) preserved on all customer-facing pages
- Visible keyboard focus rings on all interactive elements:
  - `ds-input`, `ds-select`, `ds-btn-*`: `outline: 2px solid #1C7C49; outline-offset: 2px`
  - Date field wrappers (`.kr-datefield`, `.kr-dateinput`): `:focus-within` ring on the wrapper (the `<input>` itself is visually overlaid at `opacity: 0`)
  - Kaba cards (`.kr-card`): `:focus-visible` ring on the card wrapper

---

## Shared CSS Classes (`index.css @layer components`)

| Class | Purpose |
|---|---|
| `.ds-input` | Styled text/number/email/tel inputs |
| `.ds-select` | Styled select dropdowns |
| `.ds-btn-primary` | Flat leaf-green primary button |
| `.ds-btn-ghost` | Bordered ghost button (leaf-green on cream) |
| `.ds-btn-text` | Borderless text/link button with gold underline |
| `.ds-panel` | White admin panel wrapper |
| `.ds-table-head` | Standardized table head row |
| `.ds-label` | Muted uppercase section label |
| `.ds-tibeb-band` | Gold/red tibeb motif band — **defined, not yet placed (Phase 4 planned)** |
