/**
 * Matcher module
 * Maps scraped market/commodity names to PriceNija database IDs using fuzzy matching
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, MATCH_THRESHOLD } from './config.js';
import { findBestMatch, log } from './utils.js';

let supabase = null;

function getSupabase() {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error(
        'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.\n' +
        'Copy .env.example to .env and fill in your credentials.'
      );
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
}

/**
 * Fetch all markets and commodities from the database
 */
export async function fetchDbData() {
  const sb = getSupabase();
  
  log.info('Fetching markets and commodities from database...');
  
  const [marketsResult, commoditiesResult] = await Promise.all([
    sb.from('markets').select('*').eq('is_active', true).order('name'),
    sb.from('commodities').select('*').eq('is_active', true).order('name'),
  ]);
  
  if (marketsResult.error) throw new Error(`Failed to fetch markets: ${marketsResult.error.message}`);
  if (commoditiesResult.error) throw new Error(`Failed to fetch commodities: ${commoditiesResult.error.message}`);
  
  const markets = marketsResult.data || [];
  const commodities = commoditiesResult.data || [];
  
  log.info(`Database has ${markets.length} markets and ${commodities.length} commodities`);
  
  return { markets, commodities };
}

/**
 * Match scraped prices to database IDs
 * Returns { matched: [...], unmatched: [...] }
 */
export function matchPrices(scrapedPrices, dbMarkets, dbCommodities) {
  const matched = [];
  const unmatched = [];
  const matchCache = new Map(); // Cache match results
  
  for (const item of scrapedPrices) {
    // Try to match market
    const marketKey = `market:${item.market}`;
    let marketMatch;
    if (matchCache.has(marketKey)) {
      marketMatch = matchCache.get(marketKey);
    } else {
      marketMatch = findBestMatch(item.market, dbMarkets, MATCH_THRESHOLD);
      matchCache.set(marketKey, marketMatch);
    }
    
    // Try to match commodity
    const commodityKey = `commodity:${item.commodity}`;
    let commodityMatch;
    if (matchCache.has(commodityKey)) {
      commodityMatch = matchCache.get(commodityKey);
    } else {
      commodityMatch = findBestMatch(item.commodity, dbCommodities, MATCH_THRESHOLD);
      matchCache.set(commodityKey, commodityMatch);
    }
    
    if (marketMatch && commodityMatch) {
      // Skip items with no source date — we don't want to write fake dates
      if (!item.date) {
        unmatched.push({
          source: item.source,
          market: item.market,
          marketMatched: marketMatch.name,
          commodity: item.commodity,
          commodityMatched: commodityMatch.name,
          price: item.price,
          reason: 'no source date available',
        });
        continue;
      }
      matched.push({
        market_id: marketMatch.id,
        commodity_id: commodityMatch.id,
        price: item.price,
        date: item.date,
        // Metadata for logging
        _source: item.source,
        _market: item.market,
        _matchedMarket: marketMatch.name,
        _marketScore: marketMatch.score,
        _commodity: item.commodity,
        _matchedCommodity: commodityMatch.name,
        _commodityScore: commodityMatch.score,
      });
    } else {
      unmatched.push({
        source: item.source,
        market: item.market,
        marketMatched: marketMatch ? marketMatch.name : null,
        commodity: item.commodity,
        commodityMatched: commodityMatch ? commodityMatch.name : null,
        price: item.price,
        reason: !marketMatch ? 'market not found' : 'commodity not found',
      });
    }
  }
  
  return { matched, unmatched };
}

/**
 * Write matched prices to the database via upsert
 */
export async function writePrices(matchedPrices) {
  if (matchedPrices.length === 0) {
    log.warn('No prices to write');
    return { written: 0, errors: 0 };
  }
  
  const sb = getSupabase();
  
  // Prepare clean records for upsert (remove metadata fields)
  const records = matchedPrices.map(p => ({
    market_id: p.market_id,
    commodity_id: p.commodity_id,
    date: p.date,
    price: p.price,
  }));
  
  // Deduplicate - keep last (in case of duplicates, later source wins)
  const dedupMap = new Map();
  for (const record of records) {
    const key = `${record.market_id}:${record.commodity_id}:${record.date}`;
    dedupMap.set(key, record);
  }
  const dedupedRecords = Array.from(dedupMap.values());
  
  log.info(`Writing ${dedupedRecords.length} prices (${records.length - dedupedRecords.length} duplicates removed)...`);
  
  // Batch upsert (Supabase handles up to 1000 rows at once)
  const BATCH_SIZE = 500;
  let written = 0;
  let errors = 0;
  
  for (let i = 0; i < dedupedRecords.length; i += BATCH_SIZE) {
    const batch = dedupedRecords.slice(i, i + BATCH_SIZE);
    
    const { error } = await sb
      .from('prices')
      .upsert(batch, {
        onConflict: 'market_id,commodity_id,date',
      });
    
    if (error) {
      log.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
      errors += batch.length;
    } else {
      written += batch.length;
    }
  }
  
  return { written, errors };
}
