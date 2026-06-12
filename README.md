# PagePulse

Daily insights & history for the Facebook Pages you administer — a web dashboard
plus an installable mobile app (PWA). Pulls Page Insights from the Graph API,
stores the history, and charts it.

> Status: **Phase 2 — scaffold.** Empty dashboard runs; the insights engine
> (Phase 3), history storage, and daily cron (Phase 4) are not built yet.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Serwist PWA** (offline shell + installable to a phone home screen; `manifest.ts` + generated service worker)
- **Neon** serverless Postgres + **Drizzle ORM** (history storage — Phase 4)
- **Recharts** (+ Tremor Raw copy-paste components) for charts
- **Zod** for env/response validation
- Deploys to **Vercel** (web + API routes + Vercel Cron)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in REAL values in .env.local (never commit it)
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run build       # production build (webpack — required by Serwist)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run pull:page   # Phase 3 — pull one page's insights and print them
```

## Environment

All secrets live in `.env.local` (git-ignored). Only `.env.example` (placeholders)
is committed. See `.env.example` for the full list — Facebook app id/secret, a
token (`FB_SYSTEM_USER_TOKEN` preferred, or `FB_PAGE_TOKEN`), `FB_PAGE_IDS`,
`DATABASE_URL`, and `CRON_SECRET`.

**Connecting everything (token, database, deploy): see [SETUP.md](./SETUP.md).**
The app runs fully on sample data until you do.

## Graph API metric strategy

We target **Graph API v25.0** and avoid every metric on the June 15 2026
deprecation list (`impressions`, `page_fans`, legacy reach/unique-impressions,
3-second video views, fan-based demographics). The exact replacement field names
for the new "views / viewers" framework are not reliably documented yet, so the
engine **probes** candidate metrics live and **drops** any that Graph rejects
with error `#100` (invalid metric). See `src/lib/metrics.ts` for the tiered
catalog (Tier A = confirmed safe, Tier B = probe live, Tier C = deprecated).

## Project layout

```
src/
  app/                 # App Router: dashboard + API routes + manifest
    api/health         # liveness probe (live)
    api/insights/test  # single-page pull (Phase 3 stub)
    api/cron/daily     # daily cron target (Phase 4 stub)
    manifest.ts        # PWA manifest
  components/pwa/       # service-worker registration + install prompt
  lib/
    facebook.ts        # insights engine (Phase 3 stub)
    metrics.ts         # Graph API v25.0 metric catalog (tiered)
    env.ts             # zod-validated env loader
    db/                # Drizzle + Neon (Phase 4 stub)
  types/insights.ts    # normalized insight shapes
scripts/pull-page.ts   # Phase 3 CLI
public/sw.js           # service worker
```
