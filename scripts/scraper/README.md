# PriceNija Commodity Price Scraper

Scrapes Nigerian agricultural commodity prices from multiple sources and writes them to the PriceNija Supabase database.

## Sources

| Source | URL | Data |
|--------|-----|------|
| **MarketNaijaTv** | [marketnaijatv.com](https://marketnaijatv.com/commodity-market-prices/) | Prices from rural/semi-urban markets (per bag) |
| **PluckAgro** | [pluckagro.com](https://pluckagro.com/liveprice/) | OHLCV data from major markets (Dawanau, Mile 12, etc.) |

## Setup

```bash
cd scripts/scraper
npm install

# Copy env template and fill in Supabase credentials
cp .env.example .env
# Edit .env with your SUPABASE_URL and SUPABASE_SERVICE_KEY
```

You need the **service role key** (not the anon key) to write data.

## Usage

```bash
# Run all scrapers
node run-scraper.js

# Run a single source
node run-scraper.js --source=marketnaija
node run-scraper.js --source=pluckagro

# Dry run (scrape + match, no database writes)
node run-scraper.js --dry-run

# Verbose mode (show all match details)
node run-scraper.js --verbose

# Combine flags
node run-scraper.js --source=marketnaija --dry-run --verbose
```

## How It Works

1. **Scrape** — Fetches HTML from each source, parses commodity names and prices
2. **Match** — Fetches existing `markets` and `commodities` from Supabase, then fuzzy-matches scraped names to database IDs
3. **Write** — Upserts matched prices to the `prices` table (on conflict: `market_id, commodity_id, date`)

### Price Normalization

- `N45,000/Bag` → `45000`
- `₦60,000/Bag` → `60000`
- `N/A` → skipped

### Fuzzy Matching

Uses Dice coefficient + alias lookup to match scraped names to DB entries:
- `"Honey Beans"` → matches `"Brown Beans (Oloyin)"` via alias
- `"Guinea Corn"` → matches `"Sorghum"` via alias
- `"Maize"` → matches `"Maize"` exactly

Unmatched items are logged so you can add them to the database.

## Cron Setup

Run daily at 2pm (after market prices are typically updated):

```cron
0 14 * * * cd /path/to/pricenija/scripts/scraper && node run-scraper.js >> /var/log/pricenija-scraper.log 2>&1
```

## Adding New Sources

Create a new file in `scrapers/` that exports an async function returning:

```js
[{
  source: 'your-source-name',
  market: 'Market Name',
  state: 'State Name',
  commodity: 'Commodity Name',
  price: 45000,          // numeric
  unit: 'Bag',           // optional
  date: '2025-01-31',    // optional, defaults to today
  raw: 'original text',  // for debugging
}]
```

Then import and call it in `run-scraper.js`.

## Project Structure

```
scripts/scraper/
├── run-scraper.js          # Main entry point
├── config.js               # Configuration and env loading
├── utils.js                # Price parsing, fuzzy matching, helpers
├── matcher.js              # Database matching and writing
├── scrapers/
│   ├── marketnaija.js      # MarketNaijaTv scraper
│   └── pluckagro.js        # PluckAgro scraper
├── .env.example            # Environment template
├── package.json
└── README.md
```
