/**
 * PluckAgro Scraper
 * Source: https://pluckagro.com/liveprice/
 * 
 * Scrapes market list, then fetches each market's detail page for commodity prices.
 * Data format: OHLCV (Open, High, Low, Close, Volume) per commodity per market.
 * We use the Close price as the current price.
 */

import * as cheerio from 'cheerio';
import { SOURCES, REQUEST_DELAY } from '../config.js';
import { log, sleep } from '../utils.js';

/**
 * Scrape all prices from PluckAgro
 * Returns array of { market, state, commodity, price, unit, raw, date }
 */
export async function scrapePluckAgro() {
  log.info('Scraping PluckAgro...');
  
  // Step 1: Get list of markets
  const markets = await fetchMarketList();
  log.info(`PluckAgro: found ${markets.length} markets`);
  
  const results = [];
  
  // Step 2: For each market, fetch the detail page
  for (const market of markets) {
    try {
      await sleep(REQUEST_DELAY);
      const prices = await fetchMarketPrices(market);
      results.push(...prices);
      log.info(`  ${market.name}: ${prices.length} prices`);
    } catch (err) {
      log.warn(`  ${market.name}: failed - ${err.message}`);
    }
  }
  
  log.success(`PluckAgro: scraped ${results.length} prices from ${markets.length} markets`);
  return results;
}

/**
 * Fetch the list of markets from PluckAgro
 */
async function fetchMarketList() {
  const response = await fetch(SOURCES.PLUCK_AGRO_MARKETS, {
    headers: {
      'User-Agent': 'PriceNija-Scraper/1.0 (commodity price aggregator)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`PluckAgro markets page returned ${response.status}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const markets = [];
  
  // Parse market links: href="market-detail.php?market_id=7"
  $('a[href*="market-detail.php?market_id="]').each((_, el) => {
    const href = $(el).attr('href');
    const idMatch = href.match(/market_id=(\d+)/);
    if (!idMatch) return;
    
    const id = idMatch[1];
    // Get market name from the row
    const row = $(el).closest('tr');
    const name = row.find('h5').text().trim() || $(el).text().trim();
    const location = row.find('td').eq(1).text().trim();
    
    // Parse state from location (e.g., "Kano, Kano, Nigeria" → "Kano")
    const parts = location.split(',').map(s => s.trim());
    const state = parts.length >= 2 ? parts[1] : parts[0];
    
    if (id && name) {
      markets.push({ id, name, location, state });
    }
  });
  
  return markets;
}

/**
 * Fetch prices for a specific market from PluckAgro
 * First fetches the default commodity, then iterates through all commodities
 */
async function fetchMarketPrices(market) {
  const results = [];
  
  // Fetch the market page to get the list of commodities
  const url = `${SOURCES.PLUCK_AGRO_MARKET_DETAIL}?market_id=${market.id}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'PriceNija-Scraper/1.0 (commodity price aggregator)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Market detail page returned ${response.status}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Get list of commodities from the sidebar links or dropdown
  const commodities = [];
  
  // From sidebar links
  $('a[href*="commodity_id="]').each((_, el) => {
    const href = $(el).attr('href');
    const idMatch = href.match(/commodity_id=(\d+)/);
    if (!idMatch) return;
    
    const text = $(el).text().trim();
    // Clean name (remove count badges etc)
    const name = text.replace(/\d+$/, '').trim();
    
    if (name && idMatch[1]) {
      commodities.push({ id: idMatch[1], name });
    }
  });
  
  // Also check dropdown/select
  $('select[name="commodity_id"] option').each((_, el) => {
    const value = $(el).attr('value');
    const name = $(el).text().trim();
    if (value && name && !commodities.find(c => c.id === value)) {
      commodities.push({ id: value, name });
    }
  });
  
  // For the currently loaded page, extract the price data
  const currentPrices = extractPricesFromPage($, market);
  results.push(...currentPrices);
  
  // For other commodities, fetch their pages
  const visitedCommodities = new Set();
  
  // Mark current commodity as visited
  const activeCommodity = $('a.list-group-item-action.active').attr('href');
  if (activeCommodity) {
    const match = activeCommodity.match(/commodity_id=(\d+)/);
    if (match) visitedCommodities.add(match[1]);
  }
  
  // Also check selected option
  const selectedOption = $('select[name="commodity_id"] option[selected]');
  if (selectedOption.length) {
    visitedCommodities.add(selectedOption.attr('value'));
  }
  
  // Fetch remaining commodities (with delay)
  for (const commodity of commodities) {
    if (visitedCommodities.has(commodity.id)) continue;
    visitedCommodities.add(commodity.id);
    
    try {
      await sleep(REQUEST_DELAY);
      const commodityUrl = `${SOURCES.PLUCK_AGRO_MARKET_DETAIL}?market_id=${market.id}&commodity_id=${commodity.id}`;
      const resp = await fetch(commodityUrl, {
        headers: {
          'User-Agent': 'PriceNija-Scraper/1.0 (commodity price aggregator)',
        },
      });
      
      if (resp.ok) {
        const commodityHtml = await resp.text();
        const c$ = cheerio.load(commodityHtml);
        const prices = extractPricesFromPage(c$, market);
        results.push(...prices);
      }
    } catch (err) {
      log.warn(`    ${commodity.name}: failed - ${err.message}`);
    }
  }
  
  return results;
}

/**
 * Extract prices from a PluckAgro market detail page
 * The page shows OHLCV table. We take the most recent Close price.
 */
function extractPricesFromPage($, market) {
  const results = [];
  
  // Get commodity name from the page context
  const activeSidebar = $('a.list-group-item-action.active').text().trim()
    .replace(/\d+\s*entries?/gi, '').replace(/\d+$/, '').trim();
  const selectedDropdown = $('select[name="commodity_id"] option[selected]').text().trim();
  const commodityName = activeSidebar || selectedDropdown || '';
  
  if (!commodityName) return results;
  
  // Parse the OHLCV table - get the most recent row
  const rows = $('table.table tbody tr, table.table tr').toArray();
  
  for (const row of rows) {
    const cells = $(row).find('td');
    if (cells.length < 5) continue;
    
    const dateStr = $(cells[0]).text().trim();
    const closeStr = $(cells[4]).text().trim().replace(/[₦,]/g, '');
    const closePrice = parseFloat(closeStr);
    
    if (!dateStr || isNaN(closePrice) || closePrice <= 0) continue;
    
    // Parse the date
    const date = parsePluckAgroDate(dateStr);
    if (!date) continue;
    
    // Only take the most recent entry
    results.push({
      source: 'pluckagro',
      market: market.name,
      state: market.state || '',
      commodity: commodityName,
      price: closePrice,
      unit: 'per unit', // PluckAgro doesn't always specify unit
      date,
      raw: `${commodityName}: ${closePrice} (${dateStr})`,
    });
    
    // Only take the latest price (first row)
    break;
  }
  
  return results;
}

/**
 * Parse PluckAgro date string (e.g., "Jul 2, 2025")
 */
function parsePluckAgroDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}
