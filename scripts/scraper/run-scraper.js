#!/usr/bin/env node

/**
 * PriceNija Commodity Price Scraper
 *
 * Usage:
 *   node run-scraper.js                         # All active sources
 *   node run-scraper.js --source=commodityng    # Commodity.ng state pages
 *   node run-scraper.js --dry-run
 *   node run-scraper.js --verbose
 */

import { scrapeCommodityNg } from './scrapers/commodityng.js';
import { fetchDbData, matchPrices, writePrices } from './matcher.js';
import { HAS_SERVICE_KEY } from './config.js';
import { log, today } from './utils.js';

const args = process.argv.slice(2);
const flags = {};
for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    flags[key] = value || true;
  }
}

const sourceFilter = flags.source || 'all';
const dryRun = flags['dry-run'] === true;
const verbose = flags.verbose === true;

const SOURCES = {
  commodityng: scrapeCommodityNg,
};

async function main() {
  const startTime = Date.now();

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🇳🇬 PriceNija Commodity Price Scraper');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Date: ${today()}`);
  console.log(`  Source: ${sourceFilter}`);
  console.log(`  Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  let allScraped = [];

  const toRun = sourceFilter === 'all'
    ? Object.entries(SOURCES)
    : Object.entries(SOURCES).filter(([name]) => name === sourceFilter);

  if (toRun.length === 0) {
    log.error(`Unknown source "${sourceFilter}". Active sources: ${Object.keys(SOURCES).join(', ')}`);
    process.exit(1);
  }

  for (const [name, scrape] of toRun) {
    try {
      const rows = await scrape();
      allScraped.push(...rows);
    } catch (err) {
      log.error(`${name} scraper failed: ${err.message}`);
    }
  }

  if (allScraped.length === 0) {
    log.warn('No data scraped from any source. Exiting.');
    process.exit(1);
  }

  log.info(`Total scraped: ${allScraped.length} price entries`);

  let matched, unmatched;
  try {
    const { markets, commodities } = await fetchDbData();

    if (verbose) {
      console.log('\n📋 Database Markets:');
      markets.forEach((m) => console.log(`  - [${m.id}] ${m.name}`));
      console.log('\n📋 Database Commodities:');
      commodities.forEach((c) => console.log(`  - [${c.id}] ${c.name} (${c.category})`));
      console.log('');
    }

    ({ matched, unmatched } = matchPrices(allScraped, markets, commodities));
  } catch (err) {
    log.error(`Database matching failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n───────────────────────────────────────────────────');
  console.log('  Match Results');
  console.log('───────────────────────────────────────────────────');

  if (verbose && matched.length > 0) {
    console.log('\n✅ Matched prices:');
    for (const m of matched) {
      console.log(
        `  ${m._market} → ${m._matchedMarket} (${(m._marketScore * 100).toFixed(0)}%) | ` +
        `${m._commodity} → ${m._matchedCommodity} (${(m._commodityScore * 100).toFixed(0)}%) | ` +
        `₦${m.price.toLocaleString()} (${m.date})`
      );
    }
  }

  if (unmatched.length > 0) {
    console.log('\n⚠️  Unmatched items:');
    const unmatchedByReason = {};
    for (const u of unmatched) {
      if (!unmatchedByReason[u.reason]) unmatchedByReason[u.reason] = [];
      unmatchedByReason[u.reason].push(u);
    }
    for (const [reason, items] of Object.entries(unmatchedByReason)) {
      console.log(`\n  ${reason}:`);
      const seen = new Set();
      for (const item of items) {
        const key = reason === 'market not found' ? item.market : item.commodity;
        if (seen.has(key)) continue;
        seen.add(key);
        if (reason === 'market not found') {
          console.log(`    🏪 "${item.market}" (source: ${item.source})`);
        } else {
          console.log(`    📦 "${item.commodity}" in ${item.market} (source: ${item.source})`);
        }
      }
    }
  }

  const matchedMarkets = new Set(matched.map((m) => m._matchedMarket));
  console.log(`\n  Markets hit: ${matchedMarkets.size} — ${[...matchedMarkets].sort().join(', ') || 'none'}`);

  let writeResult = { written: 0, errors: 0 };

  if (!dryRun && matched.length > 0) {
    if (!HAS_SERVICE_KEY) {
      log.error('Refusing to write: SUPABASE_SERVICE_KEY is not set.');
    } else {
      try {
        writeResult = await writePrices(matched);
      } catch (err) {
        log.error(`Failed to write prices: ${err.message}`);
      }
    }
  } else if (dryRun) {
    log.info('Dry run — skipping database write');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  📊 Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Scraped:    ${allScraped.length} prices`);
  console.log(`  Matched:    ${matched.length} prices`);
  console.log(`  Unmatched:  ${unmatched.length} prices`);
  if (!dryRun) {
    console.log(`  Written:    ${writeResult.written} prices`);
    if (writeResult.errors > 0) {
      console.log(`  Errors:     ${writeResult.errors}`);
    }
  }
  console.log(`  Time:       ${elapsed}s`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

main().catch((err) => {
  log.error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
