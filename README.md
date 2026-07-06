# PRU Consultant Dashboard

Personal client, pipeline and production dashboard for a PRU Life UK
financial consultant. Built with **Next.js (App Router) + TypeScript +
Tailwind CSS + shadcn/ui**, **Supabase** (Postgres + Auth) and **Recharts**.
Fully responsive, installable as a PWA ("Add to Home Screen"), and
deploy-ready for Vercel.

## Pages

| Page | What it does |
|---|---|
| **Overview** (`/`) | KPI cards (YTD/MTD APE, YTD commission, active policies, persistency), editable MDRT goal progress bar, monthly APE trend chart, product mix donut |
| **Clients** (`/clients`) | Search + status filter; table on desktop, cards on mobile; client detail page with all policies; full add/edit/delete for clients and policies |
| **Pipeline** (`/pipeline`) | Kanban board with drag-and-drop on desktop; stage-grouped list with a "Move to stage" menu on mobile; converts a won prospect into a client + policy |
| **Commissions** (`/commissions`) | Sticky YTD received/expected totals, month + status filters; table on desktop, cards on mobile |
| **Renewals** (`/renewals`) | Policy anniversaries in 30/60/90-day buckets, lapsed/at-risk flags first, one-tap call buttons |

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of
   [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql).
   This creates the `clients`, `policies`, `pipeline`, `commissions` and
   `settings` tables with row-level security (any signed-in user has full
   access; anonymous users have none).
3. Create your login: **Authentication → Users → Add user** (email +
   password). Disable public sign-ups under **Authentication → Providers →
   Email** if you want to stay single-user.

### 2. Local development

```bash
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm install
npm run dev
```

### 3. Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the two environment variables from `.env.example` in
   **Project Settings → Environment Variables**.
3. Deploy. Then on your phone, open the URL in Safari/Chrome and use
   **Add to Home Screen** — it launches standalone like a native app.

## Project structure

```
supabase/migrations/     SQL schema (single source of truth for the DB)
src/
  middleware.ts          Auth guard — redirects signed-out users to /login
  app/
    (app)/               Authenticated pages (shared shell with nav)
    login/               Email/password sign-in
    manifest.ts          PWA manifest
  components/
    ui/                  shadcn/ui primitives (vendored)
    layout/              Sidebar (desktop) + bottom tab bar (mobile)
    dashboard|clients|policies|pipeline|commissions/
                         Feature components (one folder per domain)
  lib/
    supabase/            Browser/server/middleware Supabase clients
    types.ts             DB row types (keep in sync with the SQL)
    constants.ts         Dropdown options, stages, statuses, MDRT default
    format.ts            Currency/date/APE helpers
    metrics.ts           Overview KPI computation (pure functions)
```

### Extending it

- **New field**: add the column in a new SQL migration → add it to the type
  in `lib/types.ts` → add the input to the relevant form component.
- **New dropdown option** (product type, source, payment method…): edit
  `lib/constants.ts` only.
- **New page**: add a folder under `src/app/(app)/` and one entry in
  `components/layout/nav-items.ts` — both navs (sidebar + bottom bar) pick
  it up automatically.

## Conventions

- **APE** = annualized premium equivalent (monthly ×12, quarterly ×4,
  semi-annual ×2, annual ×1, single-pay ×10%), computed in
  `lib/format.ts:policyApe`.
- **Persistency** is shown as in-force ÷ (in-force + lapsed + surrendered).
- The MDRT goal is stored in the `settings` table and editable from the
  Overview page (pencil icon on the goal card).
