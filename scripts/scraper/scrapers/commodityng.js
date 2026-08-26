/**
 * Commodity.ng state-page scraper
 * https://commodity.ng/
 *
 * Replaces MarketNaijaTv / PluckAgro / NigerianQueries for the 8 PriceNija
 * markets. Each state page has a "Major Commodity Prices" table and a
 * WordPress last-modified date (fetched via wp-json — never invented).
 */

import * as cheerio from 'cheerio';
import { REQUEST_DELAY } from '../config.js';
import { fetchPage, log, sleep, toIsoDate } from '../utils.js';

const WP_PAGES = 'https://commodity.ng/wp-json/wp/v2/pages';

/**
 * Map each PriceNija market to the commodity.ng state page that covers it.
 * The named market is the state's primary wholesale hub already in our DB.
 */
const MARKET_PAGES = [
  { market: 'Dawanau', slug: 'kano-state', path: '/kano-state/' },
  { market: 'Mile 12', slug: 'lagos-state', path: '/lagos-state/' },
  { market: 'Bodija', slug: 'oyo-state', path: '/oyo-state/' },
  { market: 'Ogbete Main', slug: 'enugu-state', path: '/enugu-state/' },
  { market: 'Saminaka', slug: 'kaduna-state', path: '/kaduna-state/' },
  { market: 'Wurukum Market', slug: 'benue-state', path: '/benue-state/' },
  { market: 'Wuse', slug: 'fct-abuja', path: '/fct/' },
  { market: 'Minna Grain Market', slug: 'niger', path: '/niger/' },
];

const COMMODITY_MAP = {
  rice: 'Rice (Local)',
  maize: 'Maize (White)',
  millet: 'Millet',
  groundnut: 'Groundnut',
  cowpea: 'Beans (White)',
  beans: 'Beans (White)',
  'soya beans': 'Soybeans',
  soybeans: 'Soybeans',
  yam: 'Yam',
  tomatoes: 'Tomatoes',
  tomato: 'Tomatoes',
  onions: 'Onions',
  onion: 'Onions',
  sorghum: 'Sorghum (Red)',
  'palm oil': 'Palm Oil',
  garri: 'Garri (White)',
  pepper: 'Pepper (Rodo)',
};

const SKIP_COMMODITIES = [
  'cassava', 'cocoa', 'eggs', 'cattle', 'fish', 'ginger', 'sesame',
  'live cattle', 'cocoa (bag)', 'eggs (crate)',
];

export async function scrapeCommodityNg() {
  log.info('Scraping Commodity.ng state pages...');
  const results = [];

  for (const page of MARKET_PAGES) {
    try {
      await sleep(REQUEST_DELAY);
      const rows = await scrapeStatePage(page);
      results.push(...rows);
      log.info(`  ${page.market}: ${rows.length} prices`);
    } catch (err) {
      log.warn(`  ${page.market}: failed - ${err.message}`);
    }
  }

  log.success(
    `Commodity.ng: scraped ${results.length} prices from ` +
    `${new Set(results.map((r) => r.market)).size} markets`
  );
  return results;
}

async function scrapeStatePage(page) {
  const sourceDate = await fetchPageModified(page.slug);
  if (!sourceDate) {
    log.warn(`  ${page.market}: no WordPress modified date — skipping page`);
    return [];
  }

  const response = await fetchPage(`https://commodity.ng${page.path}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results = [];

  $('table').each((_, table) => {
    const headers = $(table).find('tr').first().find('th,td').map((_, el) =>
      $(el).text().trim().toLowerCase()
    ).get();
    if (!headers.some((h) => h.includes('price') || h.includes('commodity'))) return;

    $(table).find('tr').slice(1).each((__, row) => {
      const cells = $(row).find('td').map((___, el) => $(el).text().trim()).get();
      if (cells.length < 2) return;

      const parsed = parseTableRow(cells[0], cells[1]);
      if (!parsed) return;

      results.push({
        source: 'commodityng',
        market: page.market,
        commodity: parsed.commodity,
        price: parsed.price,
        unit: parsed.unit,
        date: sourceDate,
        raw: `${cells[0]} ${cells[1]}`,
      });
    });
  });

  return results;
}

async function fetchPageModified(slug) {
  const url = `${WP_PAGES}?slug=${encodeURIComponent(slug)}&_fields=modified`;
  const response = await fetchPage(url);
  if (!response.ok) return null;
  const payload = await response.json();
  const modified = payload?.[0]?.modified;
  return toIsoDate(modified);
}

function parseTableRow(rawName, rawPrice) {
  const name = (rawName || '').replace(/\s+/g, ' ').trim();
  const nameKey = name.toLowerCase().replace(/\(.*?\)/g, '').trim();

  if (!nameKey || SKIP_COMMODITIES.some((skip) => nameKey.includes(skip))) {
    return null;
  }

  let commodity = COMMODITY_MAP[nameKey];
  if (!commodity) {
    for (const [key, value] of Object.entries(COMMODITY_MAP)) {
      if (nameKey.includes(key)) {
        commodity = value;
        break;
      }
    }
  }
  if (!commodity) return null;

  const priceMatch = String(rawPrice).replace(/,/g, '').match(/₦?\s*(\d+(?:\.\d+)?)/);
  if (!priceMatch) return null;
  const price = parseFloat(priceMatch[1]);
  if (!Number.isFinite(price) || price <= 100) return null;
  if (String(rawPrice).includes('+')) return null;

  let unit = '50kg Bag';
  const unitMatch = `${name} ${rawPrice}`.match(/(\d+\s?kg|25l|20 tubers|basket|bag)/i);
  if (unitMatch) {
    const u = unitMatch[1].toLowerCase();
    if (u.includes('tuber')) unit = '20 Tubers';
    else if (u.includes('basket')) unit = 'Basket';
    else if (u.includes('25')) unit = '25L';
    else if (u.includes('kg')) unit = `${unitMatch[1].replace(/\s+/g, '')} Bag`;
  }

  return { commodity, price, unit };
}
