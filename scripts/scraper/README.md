# PriceNija Commodity Price Scraper

Scrapes Nigerian agricultural commodity prices and writes them to the PriceNija Supabase `prices` table. Active job: **Commodity.ng** state pages, mapped onto the 8 markets already in the database.

## Active source (re-checked 2026-08-26)

| Source | URL | Date used | Markets |
|--------|-----|-----------|---------|
| **Commodity.ng** | [commodity.ng](https://commodity.ng/) state pages | WordPress `modified` via `wp-json` (never invented) | All 8 DB hubs |

State page → market map:

| Market | Page |
|--------|------|
| Dawanau | `/kano-state/` |
| Mile 12 | `/lagos-state/` |
| Bodija | `/oyo-state/` |
| Ogbete Main | `/enugu-state/` |
| Saminaka | `/kaduna-state/` |
| Wurukum Market | `/benue-state/` |
| Wuse | `/fct/` (WP slug `fct-abuja`) |
| Minna Grain Market | `/niger/` |

`/live-prices/` is newer (WP modified 2026-08-17) but **national only** — the runner does not copy those figures onto all 8 markets.

**Dry-run 2026-08-26 (no writes):** scraped **26**, matched **26/26** onto all **8** markets, date **2026-03-25** on every row. Per market: Dawanau 5, Saminaka 5, Minna Grain Market 4, Wurukum Market 3, Wuse 3, Mile 12 2, Bodija 2, Ogbete Main 2.

## Retired sources (re-checked live 2026-08-26)

| Source | Live? | Why retired |
|--------|-------|-------------|
| **MarketNaijaTv** | 200 | Rural markets only (Suleja, Giwa, Soba, Anchau, Donga, Tor Damisa). **0/8** DB markets. Cache stamp is LiteSpeed, not a price date. |
| **PluckAgro** | 200 | Mentions Dawanau + Mile 12; visible dates **October 9, 2025**. Stale. |
| **NigerianQueries** | 200 | Title still “April, 2026”; extracted date 2026-07-22. Only Bodija / Dawanau / Mile 12. |
| **nigerianprice.com** | 200 | Title “August 2026” is SEO. `article:modified_time` **2022-11-15**, footer “LAST UPDATED: NOVEMBER 15, 2022.” Do not use. |

Old scraper files stay in `scrapers/` with `RETIRED` headers. They are not imported by `run-scraper.js`.

## Setup

```bash
cd scripts/scraper
npm install
```

Dry-run matching uses the public anon key from repo-root `.env.local` / `.env.example`. Live writes need `SUPABASE_SERVICE_KEY` in `scripts/scraper/.env` (never committed).

## Usage

```bash
# Active job only (Commodity.ng)
node run-scraper.js --dry-run --verbose

# Same, via npm
npm run scrape:dry
node run-scraper.js --source=commodityng --dry-run

# Live write — refused unless SUPABASE_SERVICE_KEY is set
node run-scraper.js
```

Unknown `--source` values exit 1. The GitHub Action still fails closed if secrets are missing.

## How It Works

1. **Scrape** — Fetches each state page + its WordPress `modified` date
2. **Match** — Fuzzy-matches scraped names to existing `markets` / `commodities` IDs
3. **Write** — Upserts only when a real source date exists and `SUPABASE_SERVICE_KEY` is set (`onConflict: market_id, commodity_id, date`)

Rows with price ≤ ₦100 or a `+` range are skipped. Dates are never invented as “today.”

## GitHub Action

`.github/workflows/scrape-prices.yml` (daily 13:00 UTC / 14:00 WAT, plus `workflow_dispatch`). Requires secrets `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`. Without the service key the job refuses writes.

## Project Structure

```
scripts/scraper/
├── run-scraper.js              # Active sources only
├── config.js
├── utils.js
├── matcher.js
├── scrapers/
│   ├── commodityng.js          # Active
│   ├── marketnaija.js          # Retired
│   ├── pluckagro.js            # Retired
│   └── nigerianqueries.js      # Retired
├── .env.example
├── package.json
└── README.md
```
