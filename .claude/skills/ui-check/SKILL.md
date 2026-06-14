---
name: ui-check
description: Live visual/responsive check of the KabaRent frontend. Use when asked to screenshot a page or component, verify a UI change in the real app, or check how a route looks at mobile/tablet/desktop widths. Starts the Vite dev server, drives headless Edge, and captures screenshots at 375/768/1280px.
---

# ui-check — live UI screenshots at multiple widths

Launches the real frontend and captures what a user would see, at mobile
(375px), tablet (768px), and desktop (1280px) by default. Use it to confirm
a responsive change actually renders — not just that it compiles.

The driver is `ui-check.mjs` in this skill directory. It uses `playwright-core`
against **Microsoft Edge** (Chromium) already installed on this machine, so no
browser download is needed.

## When to use
- "Screenshot the footer at 375px", "show me BrowsePage on mobile/tablet/desktop"
- Verifying a responsive fix (stacking grids, hamburger menu, accordions, etc.)
- Any "does this look right in the actual app" check for the customer portal

## Prerequisites (verified on this machine)
- Microsoft Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
  (the `msedge` Playwright channel). If only Chrome is present, pass `--channel=chrome`.
- `playwright-core` is installed on demand with `--no-save` (does NOT touch
  `package.json`/`package-lock.json`).

## How to run

All commands run from the repo's `frontend/` directory.

1. **Install the headless driver (idempotent, no manifest changes):**
   ```bash
   cd frontend
   npm i playwright-core --no-save
   ```

2. **Start the dev server in the background and wait for it to serve:**
   ```bash
   npm run dev        # serves http://localhost:5173  (run in background)
   # then poll until ready:
   timeout 40 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
   ```
   (On the Bash tool, start `npm run dev` with `run_in_background: true`.)

3. **Run the driver from `frontend/`** (so `playwright-core` resolves from
   `frontend/node_modules`). Point it at this skill's script by absolute path:
   ```bash
   node "../.claude/skills/ui-check/ui-check.mjs" --route=/ --selector=footer
   ```
   Screenshots are written to `frontend/ui-shots/` as `<slug>-<width>.png`.

4. **View the PNGs** with the Read tool (e.g. `frontend/ui-shots/home-footer-375.png`)
   and report what you see. Always glance at the printed `console errors` — a page
   can render its shell while data fetches fail.

5. **Clean up** (unless the user said to keep the shots):
   ```bash
   rm -rf frontend/ui-shots
   pkill -f vite        # stop the dev server
   ```
   `playwright-core` was installed with `--no-save`, so nothing in git changed.
   Leave it in `node_modules` (gitignored) for next time, or `npm rm playwright-core` to remove.

## Parameters (all optional)
| Flag | Default | Meaning |
|------|---------|---------|
| `--route=` | `/` | Route to load, e.g. `/order/new`, `/about` |
| `--selector=` | (full page) | CSS selector to crop to, e.g. `footer`, `nav`, `.ds-panel` |
| `--widths=` | `375,768,1280` | Comma-separated viewport widths |
| `--out=` | `ui-shots` | Output directory (relative to cwd) |
| `--base=` | `http://localhost:5173` | Dev server origin |
| `--channel=` | `msedge` | Browser channel (`msedge` or `chrome`) |

## Examples
```bash
# Footer at all three default widths
node "../.claude/skills/ui-check/ui-check.mjs" --selector=footer

# Full New Order page, mobile + desktop only
node "../.claude/skills/ui-check/ui-check.mjs" --route=/order/new --widths=375,1280

# Navbar across widths, using Chrome instead of Edge
node "../.claude/skills/ui-check/ui-check.mjs" --selector=nav --channel=chrome
```

## Gotchas
- **Run from `frontend/`.** ESM resolves `playwright-core` from the cwd's
  `node_modules`; running elsewhere throws "Cannot find package".
- **Sticky navbar overlap.** The navbar is `sticky top-0 z-40`. When you crop a
  *tall* element (e.g. an expanded footer taller than the viewport), the navbar
  can paint over the top of the crop. That's a screenshot artifact, not a layout
  bug — use a full-page shot or a narrower selector to confirm.
- **Backend down is fine.** Pages still render; data-dependent areas may be empty
  and console errors may appear — the layout under test is unaffected.
- **`EADDRINUSE`** means a dev server is already running; `pkill -f vite` first.
- **First paint is slow.** Vite compiles routes on demand; the script waits on
  the selector / DOM, so don't add `sleep`.
- **Git Bash mangles `--route=/`.** On Windows Git Bash (MSYS), a leading-slash
  argument is path-converted (e.g. `--route=/` becomes `--route=C:/Program Files/Git/`),
  so the screenshot ends up on the wrong URL. Prefix the command with
  `MSYS_NO_PATHCONV=1`, or run the driver from PowerShell, which doesn't convert paths.
