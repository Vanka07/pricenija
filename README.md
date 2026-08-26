# PriceNija

Nigerian agricultural commodity price tracker. Compare wholesale prices across major markets, watch trends, and keep a personal watchlist.

**Live site:** https://www.pricenija.com  
**Stack:** Next.js 14 (App Router) + Supabase

## What was stale (Aug 2026)

The app was still deployed, and Supabase still had 8 markets / 18 commodities / 143 price rows. The last stored price date was **2026-03-03**. The UI only loaded the last **30 calendar days**, so visitors saw an empty dashboard even though older prices existed. The scraper had no scheduled job after it was added in January 2026.

This repo now:

- Loads the latest **90 days relative to the newest stored price**, not “today minus 30”
- Labels data as **Latest on record** when it is more than 3 days old
- Ships a GitHub Action that can scrape sources daily once secrets are set
- Documents the real env vars and how to run a fresh clone

## Local development

Requires Node 18.17+ (Node 20 recommended).

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The example env points at the existing public PriceNija Supabase project (anon key only — read access).

```bash
npm run build   # production build + sitemap
npm run lint    # ESLint via next lint
```

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`, Vercel | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local`, Vercel | Public anon key (browser) |
| `SUPABASE_URL` | `scripts/scraper/.env`, GitHub Actions | Same project URL for the scraper |
| `SUPABASE_SERVICE_KEY` | `scripts/scraper/.env`, GitHub Actions | **Service role key** — write prices only |

Never put the service role key in the Next.js app or Vercel public env.

## Scraper

Sources (still live as of this revival):

| Source | URL |
|---|---|
| MarketNaijaTv | https://marketnaijatv.com/commodity-market-prices/ |
| PluckAgro | https://pluckagro.com/liveprice/ |
| NigerianQueries | https://nigerianqueries.com/prices-of-commodities-in-nigeria/ |

```bash
cd scripts/scraper
npm install
cp .env.example .env   # add SUPABASE_URL + SUPABASE_SERVICE_KEY
npm run scrape:dry     # scrape + match, no writes
npm run scrape         # upsert matched prices
```

From the repo root: `npm run scrape:dry` or `npm run scrape`.

The matcher only writes rows that have a **real source date**. It will not invent today’s date.

**Source coverage vs the 8 tracked markets:** NigerianQueries maps cleanly onto Bodija, Dawanau, and Mile 12 (24/24 matched in a dry run, dated 2026-07-22). MarketNaijaTv still scrapes (~95 prices) but those pages cover rural markets (Suleja, Giwa, Soba, …) that are not in the current `markets` table, so they do not upsert until Jay adds those markets. PluckAgro still lists Dawanau and Mile 12.

### Daily scrape (needs Jay)

1. In the GitHub repo, add Actions secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
2. Enable Actions if they are disabled for this repo
3. Run **Scrape commodity prices** via *workflow_dispatch*, or wait for the daily 13:00 UTC schedule

This PR does **not** write to production and does **not** deploy.

## Markets and commodities

Markets in the current database: Bodija (Ibadan), Dawanau (Kano), Mile 12 (Lagos), Minna Grain Market, Ogbete Main (Enugu), Saminaka (Kaduna), Wurukum Market (Makurdi), Wuse (Abuja).

Commodities: local/foreign rice, white/yellow maize, millet, red/white sorghum, white/brown beans, groundnut, soybeans, palm oil, white/yellow garri, yam, onions, rodo pepper, tomatoes.

## Routes

| Path | Description |
|---|---|
| `/` | Dashboard |
| `/prices` | Prices, search, charts |
| `/markets` | Market directory |
| `/markets/[id]` | Market detail + cross-market compare |
| `/watchlist` | Signed-in watchlist |
| `/about` | About / FAQ |
| `/admin` | Admin (auth required) |

## What still needs Jay

- **Merge this PR** (this branch is not deployed)
- **Vercel** already has the public Supabase env on production; after merge it will pick up the date-window fix
- **GitHub Action secrets** so prices start updating again
- **Service role key** to run the scraper locally
- **Optional:** tighten Supabase RLS — `markets`, `commodities`, and `prices` currently have public `ALL` policies (`qual = true`). That is separate from this revival.

## Support

hello@pricenija.com
