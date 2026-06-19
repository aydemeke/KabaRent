# KabaRent — Frontend

The customer-facing and admin web app for KabaRent (event Kaba rentals). Hebrew (RTL)
customer portal; English admin dashboard. See the root [`README.md`](../README.md) for the
full project overview and the [backend](../backend) for the API.

## Stack

- **React 19** + **React Router v7**
- **Vite** (dev server + build)
- **Tailwind CSS** (custom palette + `.ds-*` utility classes in `index.css`)
- **Axios** — all HTTP via per-resource modules in `src/api/` over a shared `axiosInstance.js`

## API configuration (`VITE_API_URL`)

The Axios base URL comes from the `VITE_API_URL` env var (`src/api/axiosInstance.js`); there
is **no dev proxy**, so this must be set in every environment. Vite loads it from `.env`
files at build/start time:

| File              | Tracked? | `VITE_API_URL`                       | Used by                          |
|-------------------|----------|--------------------------------------|----------------------------------|
| `.env.local`      | No (git-ignored) | `http://localhost:8080/api`   | `npm run dev` (local backend)    |
| `.env.production` | Yes      | `https://kabarent.onrender.com/api`  | `npm run build` (Vercel / prod)  |

Copy `.env.example` to `.env.local` to get started:

```bash
cp .env.example .env.local
```

The shared instance also attaches the JWT (`Authorization: Bearer …` from `localStorage`),
redirects to `/login` on a 401, and tolerates Render free-tier cold starts (a non-blocking
"waking the server" hint plus a retry on transport failures).

## Scripts

```bash
npm install        # install dependencies
npm run dev        # dev server on http://localhost:5173
npm run build      # production build (loads .env.production)
npm run preview    # serve the production build locally
npm run lint       # ESLint
```

## Deployment

Built with `vite build` and deployed to **Vercel** (origin `https://kaba-rent.vercel.app`),
calling the **Render**-hosted backend via `VITE_API_URL`. See the root README's *Deployment*
section for the full Vercel / Render / Neon topology.
