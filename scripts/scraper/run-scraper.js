#!/usr/bin/env node

/**
 * PriceNija Commodity Price Scraper
 * 
 * Scrapes Nigerian commodity prices from multiple sources and writes to Supabase.
 * 
 * Usage:
 *   node run-scraper.js                    # Run all scrapers
 *   node run-scraper.js --source=marketnaija  # Only MarketNaijaTv
 *   node run-scraper.js --source=pluckagro       # Only PluckAgro
 *   node run-scraper.js --source=nigerianqueries # Only NigerianQueries
 *   node run-scraper.js --dry-run                # Scrape and match but don't write
 *   node run-scraper.js --verbose             # Show detailed match info
 */

import { scrapeMarketNaija } from './scrapers/marketnaija.js';
import { scrapePluckAgro } from './scrapers/pluckagro.js';
import { scrapeNigerianQueries } from './scrapers/nigerianqueries.js';
import { fetchDbData, matchPrices, writePrices } from './matcher.js';
import { log, today } from './utils.js';

// Parse CLI args
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
  
  // Step 1: Scrape sources
  let allScraped = [];
  
  try {
    if (sourceFilter === 'all' || sourceFilter === 'marketnaija') {
      const marketNaijaData = await scrapeMarketNaija();
      allScraped.push(...marketNaijaData);
    }
  } catch (err) {
    log.error(`MarketNaijaTv scraper failed: ${err.message}`);
  }
  
  try {
    if (sourceFilter === 'all' || sourceFilter === 'pluckagro') {
      const pluckAgroData = await scrapePluckAgro();
      allScraped.push(...pluckAgroData);
    }
  } catch (err) {
    log.error(`PluckAgro scraper failed: ${err.message}`);
  }
  
  try {
    if (sourceFilter === 'all' || sourceFilter === 'nigerianqueries') {
      const nigerianQueriesData = await scrapeNigerianQueries();
      allScraped.push(...nigerianQueriesData);
    }
  } catch (err) {
    log.error(`NigerianQueries scraper failed: ${err.message}`);
  }
  
  if (allScraped.length === 0) {
    log.warn('No data scraped from any source. Exiting.');
    process.exit(1);
  }
  
  log.info(`Total scraped: ${allScraped.length} price entries`);
  
  // Step 2: Fetch database data and match
  let matched, unmatched;
  try {
    const { markets, commodities } = await fetchDbData();
    
    if (verbose) {
      console.log('\n📋 Database Markets:');
      markets.forEach(m => console.log(`  - [${m.id}] ${m.name}`));
      console.log('\n📋 Database Commodities:');
      commodities.forEach(c => console.log(`  - [${c.id}] ${c.name} (${c.category})`));
      console.log('');
    }
    
    ({ matched, unmatched } = matchPrices(allScraped, markets, commodities));
  } catch (err) {
    log.error(`Database matching failed: ${err.message}`);
    
    if (dryRun || !process.env.SUPABASE_URL) {
      log.info('Showing scraped data without matching:\n');
      const byMarket = {};
      for (const item of allScraped) {
        const key = `${item.market} (${item.state})`;
        if (!byMarket[key]) byMarket[key] = [];
        byMarket[key].push(item);
      }
      for (const [market, items] of Object.entries(byMarket)) {
        console.log(`\n🏪 ${market}:`);
        for (const item of items) {
          console.log(`   ${item.commodity}: ₦${item.price.toLocaleString()} / ${item.unit}`);
        }
      }
    }
    process.exit(1);
  }
  
  // Step 3: Log match results
  console.log('\n───────────────────────────────────────────────────');
  console.log('  Match Results');
  console.log('───────────────────────────────────────────────────');
  
  if (verbose && matched.length > 0) {
    console.log('\n✅ Matched prices:');
    for (const m of matched) {
      console.log(`  ${m._market} → ${m._matchedMarket} (${(m._marketScore * 100).toFixed(0)}%) | ` +
                  `${m._commodity} → ${m._matchedCommodity} (${(m._commodityScore * 100).toFixed(0)}%) | ` +
                  `₦${m.price.toLocaleString()}`);
    }
  }
  
  if (unmatched.length > 0) {
    console.log('\n⚠️  Unmatched items:');
    const unmatchedByReason = {};
    for (const u of unmatched) {
      const key = u.reason;
      if (!unmatchedByReason[key]) unmatchedByReason[key] = [];
      unmatchedByReason[key].push(u);
    }
    
    for (const [reason, items] of Object.entries(unmatchedByReason)) {
      console.log(`\n  ${reason}:`);
      // Show unique items
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
  
  // Step 4: Write to database
  let writeResult = { written: 0, errors: 0 };
  
  if (!dryRun && matched.length > 0) {
    try {
      writeResult = await writePrices(matched);
    } catch (err) {
      log.error(`Failed to write prices: ${err.message}`);
    }
  } else if (dryRun) {
    log.info('Dry run — skipping database write');
  }
  
  // Summary
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

main().catch(err => {
  log.error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
