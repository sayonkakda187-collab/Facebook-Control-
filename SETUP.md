# PagePulse — connection checklist

The app runs on **sample data** out of the box. Follow these steps to connect
your real Facebook token, a database, and deploy. Nothing here is committed —
all secrets go in `.env.local` (local) and Vercel's Environment Variables (prod).

You'll wire up four things:

1. A Facebook **access token** (+ app id/secret + page ids)
2. A **Neon** Postgres database
3. **Environment variables** (local + Vercel)
4. **Deploy to Vercel** and confirm the daily cron

---

## 1. Facebook access token

You need a Meta app and a long-lived token for the Pages you administer.
Target API version is **v25.0** (already set as `FB_GRAPH_VERSION`).

### 1a. Create the app + get App ID / Secret

1. Go to <https://developers.facebook.com/apps> → **Create App**.
2. Choose the **Business** app type. Name it (e.g. "PagePulse").
3. Open **App settings → Basic**. Copy:
   - **App ID** → `FB_APP_ID`
   - **App Secret** (click *Show*) → `FB_APP_SECRET`

`FB_APP_SECRET` is used to sign every Graph call with `appsecret_proof`.

### 1b. Mint a token — Option A: System User (recommended, non-expiring)

1. Go to <https://business.facebook.com/settings> (Business Settings).
2. **Accounts → Pages** → add each Page you want to track (claim or request access).
3. **Users → System users** → **Add** → name it (e.g. "pagepulse-bot"), role **Admin**.
4. Select the system user → **Assign assets** → **Pages** → pick your Pages →
   enable **Manage Page** (full control) or at least the analytics permission.
5. Click **Generate new token** → select your **App** → choose these scopes:
   - `pages_read_engagement`
   - `read_insights`
   - `pages_show_list`
   - `pages_read_user_content`
   - `business_management`
6. Set **Token expiration: Never** → **Generate**. Copy it → `FB_SYSTEM_USER_TOKEN`.

### 1b. Mint a token — Option B: long-lived Page token (alternative)

1. Open the **Graph API Explorer** (<https://developers.facebook.com/tools/explorer>),
   select your app, **Generate Access Token**, and grant the scopes above.
2. Exchange the short token for a long-lived **user** token:
   ```
   GET https://graph.facebook.com/v25.0/oauth/access_token
       ?grant_type=fb_exchange_token
       &client_id=FB_APP_ID
       &client_secret=FB_APP_SECRET
       &fb_exchange_token=SHORT_LIVED_USER_TOKEN
   ```
3. Get a (long-lived) **Page** token:
   ```
   GET https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token
   ```
   Copy the `access_token` for your Page → `FB_PAGE_TOKEN`.

### 1c. Find your Page IDs

The `me/accounts` call above returns each Page's `id`. (Or: a Page → **About** →
**Page ID**.) Put them comma-separated → `FB_PAGE_IDS=123...,456...`.

---

## 2. Neon database

1. Sign up at <https://neon.tech> → **Create project** (pick a region near you).
2. On the project dashboard, copy the **Pooled connection** string. It looks like:
   ```
   postgres://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
   ```
   → `DATABASE_URL`.
3. Create the tables (run once, from the project root with `DATABASE_URL` set):
   ```bash
   npm run db:migrate      # applies drizzle/0000_*.sql
   # if that errors, use:  npx drizzle-kit push
   ```

---

## 3. Environment variables

### Local — create `.env.local` (copy from `.env.example`)

```bash
FB_GRAPH_VERSION=v25.0
FB_APP_ID=your_app_id
FB_APP_SECRET=your_app_secret
FB_SYSTEM_USER_TOKEN=your_system_user_token   # or FB_PAGE_TOKEN=...
FB_PAGE_IDS=123456789,987654321
DATABASE_URL=postgres://...neon.tech/neondb?sslmode=require
CRON_SECRET=paste_a_random_string
# Optional access gate (leave unset to keep the dashboard open):
DASHBOARD_PASSWORD=choose_a_password
AUTH_SECRET=paste_a_random_string
```

Generate the random secrets with:
```bash
openssl rand -hex 32
```

### Production — Vercel → Project → Settings → Environment Variables

Add **the same variables** (Production scope). The most important for the cron:
`CRON_SECRET` — Vercel sends it as the `Authorization: Bearer` header to the cron
route. Set `DASHBOARD_PASSWORD` + `AUTH_SECRET` in production so the public URL
isn't open to everyone.

---

## 4. Verify locally

```bash
# 1. Pull one page and print the normalized result (no DB needed):
npm run pull:page -- <pageId>            # add --posts to include recent posts

# 2. Start the app and open the Status page:
npm run dev
#   → http://localhost:3000/status  should show "Connected — tracking N pages"
#     and which metrics Resolved vs came back Unavailable.

# 3. Test endpoint (raw JSON):
#   http://localhost:3000/api/insights/test?pageId=<id>&posts=1

# 4. Run the daily pull once to populate the DB, then reload the dashboard:
curl "http://localhost:3000/api/cron/daily?secret=$CRON_SECRET"
#   The "Sample data" badge disappears once real rows exist.
```

> Some metrics will show as **Unavailable** on the Status page — that's expected.
> The new "views / viewers" replacements and any deprecated reach/impressions
> metrics are probed live; whatever your account/API version doesn't support is
> dropped automatically and hidden in the UI (never a broken chart).

---

## 5. Deploy to Vercel

1. <https://vercel.com/new> → import this repo's branch.
2. **Build & Development Settings → Build Command:** set it to
   ```
   next build --webpack
   ```
   (Serwist's service worker needs the webpack builder; Next 16 defaults to
   Turbopack. Our `package.json` `build` script already uses `--webpack`, but
   setting it explicitly removes any doubt.)
3. Add the Environment Variables from step 3 (Production).
4. **Deploy.**
5. **Confirm the cron:** Vercel reads `vercel.json` and registers the job. Check
   **Project → Settings → Cron Jobs** — you should see `/api/cron/daily` at
   `0 6 * * *` (06:00 UTC daily). *(On the Hobby plan, crons run once per day —
   our schedule fits.)*
6. **Seed the first data point** (don't wait until tomorrow):
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
        https://YOUR-APP.vercel.app/api/cron/daily
   ```

---

## 6. Confirm the live connection

- Open `https://YOUR-APP.vercel.app/status`:
  - **Token:** "Connected — tracking N pages"
  - **Database:** "Connected and contains data"
  - **Metric resolution:** the Resolved / Unavailable lists
- Open the dashboard — real KPIs + charts, no "Sample data" badge.
- The PWA is installable: on mobile, open the site → **Add to Home Screen**.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Status: **Token invalid** | Re-mint the token; confirm the 5 scopes and that the Pages are assigned to the system user. The error detail is shown on `/status`. |
| `appsecret_proof` errors | `FB_APP_SECRET` must belong to the same app that minted the token. |
| Dashboard still shows **Sample data** after connecting | Run the cron once (step 4.4 / 5.6) — the dashboard reads stored history. |
| A metric is **Unavailable** | Expected for deprecated/unsupported metrics (e.g. the June 15 2026 reach/impressions removals). It's dropped and hidden by design. |
| Vercel build fails mentioning webpack/Turbopack | Ensure the Build Command is `next build --webpack` (step 5.2). |
| Cron never runs | Confirm `CRON_SECRET` is set in Vercel and the job appears under Cron Jobs. |
