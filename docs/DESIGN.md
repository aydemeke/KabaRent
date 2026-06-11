> ⚠️ **POSSIBLY STALE — pending a later audit.** This design-system document may not reflect the current implementation (which mixes `.ds-*` utilities with inline styles). Verify against `frontend/src/index.css` and `tailwind.config.js` before relying on it.

# KabaRent Design System

## Principles

- **No hard borders on cards** — use ambient shadow and background shift for separation
- **No pure black** — always use `on-surface` (#1a1c1c)
- **No primary (#012d1d) as a full background** — dark green is for text, buttons, and accents only
- **No horizontal divider lines between sections** — background color shifts signal transitions
- **Generous whitespace** — 16px more than instinct suggests, everywhere

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `primary` | `#012d1d` | Buttons, active text, brand |
| `secondary` | `#705d00` | Secondary accents |
| `tertiary` | `#560000` | Destructive / tertiary accents |
| `secondary-container` | `#fcd400` | Gold highlight, dividers |
| `surface` | `#f9f9f8` | Page background |
| `surface-container-lowest` | `#ffffff` | Cards, modals, inputs on focus |
| `surface-container-low` | `#f3f4f3` | Input fields, table heads |
| `surface-container` | `#eeeeed` | Subtle section backgrounds |
| `surface-container-high` | `#e8e8e7` | Hover states |
| `surface-container-highest` | `#e2e2e2` | Disabled, deepest surfaces |
| `on-surface` | `#1a1c1c` | Primary text |
| `on-surface-variant` | `#414844` | Secondary text, labels |
| `outline-variant` | `#c1c8c2` | Borders at reduced opacity |

---

## Typography

### Fonts
- **Plus Jakarta Sans** — headings (`h1`–`h3`), brand, display text  
  Weights used: 700, 800; italic 700 for brand
- **Inter** — body, labels, buttons, descriptions  
  Weights used: 400, 500, 600

### Scale
| Role | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| Display / Hero | Jakarta | 2rem+ | 800 | -0.02em |
| Page title | Jakarta | 1.5rem | 700 | -0.01em |
| Section heading | Jakarta | 1.125rem | 600 | — |
| Body | Inter | 0.875rem | 400 | — |
| Label / caption | Inter | 0.75rem | 500–600 | 0.06em uppercase |
| Button | Inter | 0.875rem | 600 | 0.02em |

---

## Components

### Buttons

**Primary**  
`bg-primary text-white rounded-xl px-6 py-2.5 font-semibold`  
Subtle gradient: `linear-gradient(135deg, #012d1d, #1b4332)`  
Hover: `scale-95`, Active: `scale-90`

**Secondary (ghost)**  
`rounded-full border border-outline-variant/20 text-primary px-5 py-2`  
No fill. Hover: background shifts to `surface-container-low`

**Tertiary (text)**  
`text-primary` with gold (`#fcd400`) underline, 2px, expands on hover  
No background, no border

**Destructive**  
`text-tertiary` (#560000), same tertiary button pattern

### Input Fields

- Background: `surface-container-low` (#f3f4f3)
- Border: none (transparent)
- Border-radius: `rounded-xl`
- On focus: background → `white`, border → `primary` at 30% opacity, no ring
- Transition: `transition-all duration-150`

Shared class: `.ds-input` (defined in `index.css`)

### Cards (Kaba)

- Background: `white` (surface-container-lowest)
- Border-radius: `2.5rem`
- No border
- Ambient shadow: `0 2px 16px rgba(1,45,29,0.06)` → hover: `0 12px 32px rgba(1,45,29,0.12)`
- Image: `aspect-ratio: 4/5`, hover scale-110 over 700ms
- Category badge: glassmorphism — `rgba(255,255,255,0.90)` + `backdrop-blur(8px)`, pill shape

### Admin Panels

- Background: `white`
- Border-radius: `rounded-2xl`
- No border, ambient shadow: `0 2px 16px rgba(26,28,28,0.06)`
- Table head: `surface-container-low`, uppercase, tracked labels
- Table row dividers: `outline-variant` at 20% opacity
- Row hover: `surface-container-low`

### Modals

- Overlay: `rgba(0,0,0,0.40)` + `backdrop-blur(16px)` (glassmorphism)
- Box: `white`, `rounded-[2rem]`, `padding: 32px`
- Ambient shadow only, no border

---

## Layout

- **2-column staggered grid** for Kaba cards: alternate cards offset `mt-12` downward
- **No equal 3-column grid** on the browse page
- **Section separation** via background color shift, never border lines
- **Asymmetric** where possible: large image left, offset text right

---

## Shared CSS Classes (`index.css`)

```css
.ds-input          /* styled text/number/email/tel inputs */
.ds-select         /* styled select dropdowns */
.ds-btn-primary    /* deep green primary button */
.ds-panel          /* white rounded-2xl admin panel */
.ds-table-head     /* standardized table head row */
```
