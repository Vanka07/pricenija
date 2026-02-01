/**
 * NigerianQueries Scraper
 * Source: https://nigerianqueries.com/prices-of-commodities-in-nigeria/
 *
 * WordPress article with commodity prices in list format:
 *   ### Current Prices of Beans in Nigeria (2026)
 *   - White Beans (100kg) @ Bodija Market, Oyo State == ₦90,000
 *   - Groundnut (100kg) @ Mile 12, Lagos State == ₦45,000
 */

import { parsePrice, log } from '../utils.js';

const SOURCE_URL = 'https://nigerianqueries.com/prices-of-commodities-in-nigeria/';

// Only match these DB markets
const MARKET_MAP = {
  'bodija market': 'Bodija',
  'bodija': 'Bodija',
  'dawanau market': 'Dawanau',
  'dawanau': 'Dawanau',
  'mile 12 market': 'Mile 12',
  'mile 12': 'Mile 12',
  'minna grain market': 'Minna Grain Market',
  'ogbete main': 'Ogbete Main',
  'saminaka': 'Saminaka',
  'wurukum market': 'Wurukum Market',
  'wuse': 'Wuse',
};

// Map scraped commodity names → DB commodity names
const COMMODITY_MAP = {
  'white beans': 'Beans (White)',
  'brown beans': 'Beans (Brown)',
  'groundnut': 'Groundnut',
  'maize': 'Maize (White)',
  'white maize': 'Maize (White)',
  'yellow maize': 'Maize (Yellow)',
  'palm oil': 'Palm Oil',
  'rice': 'Rice (Local)',
  'local rice': 'Rice (Local)',
  'foreign rice': 'Rice (Foreign)',
  'imported rice': 'Rice (Foreign)',
  'tomatoes': 'Tomatoes',
  'soya beans': 'Soybeans',
  'onions': 'Onions',
  'yam': 'Yam',
  'garri': 'Garri (White)',
  'white garri': 'Garri (White)',
  'white gaari': 'Garri (White)',
  'yellow garri': 'Garri (Yellow)',
  'yellow gaari': 'Garri (Yellow)',
  'millet': 'Millet',
  'sorghum': 'Sorghum (Red)',
  'red sorghum': 'Sorghum (Red)',
  'white sorghum': 'Sorghum (White)',
  'guinea corn': 'Sorghum (Red)',
  'pepper': 'Pepper (Rodo)',
  'rodo pepper': 'Pepper (Rodo)',
};

// Units we accept (wholesale / bag-level). Skip paint bucket, mudu, congo, tier, per-unit.
const WHOLESALE_UNITS = ['100kg', '50kg', '40kg', '25l', '25kg', '80kg'];
const SKIP_UNITS = ['paint bucket', 'mudu', 'congo', 'tier', 'big', 'medium', 'small'];

/**
 * Scrape all prices from NigerianQueries
 * Returns array of { market, commodity, price, unit, source }
 */
export async function scrapeNigerianQueries() {
  log.info('Scraping NigerianQueries...');

  const response = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent': 'PriceNija-Scraper/1.0 (commodity price aggregator)',
    },
  });

  if (!response.ok) {
    throw new Error(`NigerianQueries returned ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const results = [];

  // Extract publish date from meta tag: article:published_time
  let sourceDate = null;
  const dateMatch = html.match(/published_time["\s]+content="(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    sourceDate = dateMatch[1];
    log.info(`NigerianQueries: source published date is ${sourceDate}`);
  } else {
    log.warn('NigerianQueries: could not extract publish date from page');
  }

  // Extract text lines from HTML - strip tags, split on newlines
  const textContent = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|li|h[1-6]|div|ul|ol)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8358;/g, '₦')
    .replace(/&amp;/g, '&');

  const lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);

  let currentSection = '';

  for (const line of lines) {
    // Track section headers for context (e.g., "Current Prices of Beans in Nigeria")
    const sectionMatch = line.match(/Current Prices of (.+?) in/i);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    // Parse price lines: "- Commodity (unit) @ Market, State == ₦price"
    // Also handle lines without leading dash
    const priceMatch = line.match(
      /^[-–•*]?\s*(.+?)\s*\(([^)]+)\)\s*@\s*(.+?)\s*==\s*₦([\d,]+(?:\.\d+)?)/
    );
    if (!priceMatch) continue;

    const rawCommodity = priceMatch[1].trim();
    const rawUnit = priceMatch[2].trim();
    const rawMarket = priceMatch[3].trim();
    const rawPrice = priceMatch[4].trim();

    // Skip non-wholesale units
    const unitLower = rawUnit.toLowerCase();
    if (SKIP_UNITS.some(skip => unitLower.includes(skip))) continue;
    if (unitLower.includes('1 ')) continue; // "1 tier", "1 mudu", etc.

    // Parse price
    const price = parsePrice(`₦${rawPrice}`);
    if (!price || price <= 0) continue;

    // Match market
    const market = matchMarket(rawMarket);
    if (!market) continue;

    // Match commodity
    const commodity = matchCommodity(rawCommodity, currentSection);
    if (!commodity) continue;

    // Determine unit string
    const unit = normalizeUnit(rawUnit);

    results.push({
      source: 'nigerianqueries',
      market,
      commodity,
      price,
      unit,
      date: sourceDate,
      raw: line,
    });
  }

  log.success(
    `NigerianQueries: scraped ${results.length} prices from ` +
    `${new Set(results.map(r => r.market)).size} markets`
  );
  return results;
}

/**
 * Match raw market string to a known DB market
 */
function matchMarket(rawMarket) {
  // Clean: remove state suffix like ", Oyo State", ", Lagos", ", Kano State"
  const cleaned = rawMarket
    .replace(/,\s*[A-Za-z]+(\s+State)?\s*$/i, '')
    .trim()
    .toLowerCase();

  // Direct lookup
  if (MARKET_MAP[cleaned]) return MARKET_MAP[cleaned];

  // Try without "market" suffix
  const withoutMarket = cleaned.replace(/\s+market$/i, '').trim();
  if (MARKET_MAP[withoutMarket]) return MARKET_MAP[withoutMarket];

  // Try full lowercase raw
  const fullLower = rawMarket.toLowerCase().trim();
  for (const [key, value] of Object.entries(MARKET_MAP)) {
    if (fullLower.includes(key)) return value;
  }

  return null;
}

/**
 * Match raw commodity name to a known DB commodity
 */
function matchCommodity(rawCommodity, sectionHint) {
  const lower = rawCommodity.toLowerCase().trim();

  // Direct lookup
  if (COMMODITY_MAP[lower]) return COMMODITY_MAP[lower];

  // Try section hint if commodity name is generic
  const sectionLower = (sectionHint || '').toLowerCase().trim();

  // For "Rice" without local/foreign qualifier, check section context
  if (lower === 'rice' || sectionLower === 'rice') {
    if (lower.includes('foreign') || lower.includes('imported')) return 'Rice (Foreign)';
    if (lower.includes('local')) return 'Rice (Local)';
    // Default rice to Local
    return 'Rice (Local)';
  }

  // Use section hint as fallback
  if (COMMODITY_MAP[sectionLower]) return COMMODITY_MAP[sectionLower];

  // Partial matches
  for (const [key, value] of Object.entries(COMMODITY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }

  return null;
}

/**
 * Normalize unit string for consistency
 */
function normalizeUnit(rawUnit) {
  const lower = rawUnit.toLowerCase().trim();
  if (lower.includes('100kg')) return '100kg Bag';
  if (lower.includes('50kg')) return '50kg Bag';
  if (lower.includes('40kg')) return '40kg Basket';
  if (lower.includes('25l')) return '25L';
  if (lower.includes('80kg')) return '80kg Bag';
  if (lower.includes('25kg')) return '25kg Bag';
  return rawUnit;
}
