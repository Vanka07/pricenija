/**
 * MarketNaijaTv Scraper
 * Source: https://marketnaijatv.com/commodity-market-prices/
 * 
 * WordPress/Elementor site. Structure:
 *   .elementor-widget-heading h2 → Market Name
 *   .elementor-widget-text-editor p → Price lines
 */

import * as cheerio from 'cheerio';
import { SOURCES } from '../config.js';
import { parsePrice, log } from '../utils.js';

/**
 * Scrape all prices from MarketNaijaTv
 * Returns array of { source, market, state, commodity, price, unit, raw }
 */
export async function scrapeMarketNaija() {
  log.info('Scraping MarketNaijaTv...');
  
  const response = await fetch(SOURCES.MARKET_NAIJA, {
    headers: {
      'User-Agent': 'PriceNija-Scraper/1.0 (commodity price aggregator)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`MarketNaijaTv returned ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const results = [];

  // Try to extract date from meta tags or page content
  let sourceDate = null;
  const metaDate = $('meta[property="article:modified_time"]').attr('content') 
    || $('meta[property="article:published_time"]').attr('content');
  if (metaDate) {
    sourceDate = metaDate.split('T')[0];
    log.info(`MarketNaijaTv: source date is ${sourceDate}`);
  } else {
    log.warn('MarketNaijaTv: could not extract date from page — prices will use source date or be skipped');
  }
  
  // Find all heading widgets with h2 elements
  const headings = $('h2.elementor-heading-title');
  
  headings.each((_, headingEl) => {
    const headerText = $(headingEl).text().trim();
    
    // Skip non-market headers
    if (!headerText || 
        headerText.toLowerCase().includes('commodity market price') ||
        headerText.toLowerCase().includes('get weekly update') ||
        headerText.toLowerCase().includes('subscribe')) {
      return;
    }
    
    // Parse market name and state
    const { market, state } = parseMarketHeader(headerText);
    if (!market) return;
    
    // Find the next text-editor widget after this heading
    // Navigate: h2 → .elementor-widget-container → .elementor-widget-heading → next sibling
    const headingWidget = $(headingEl).closest('.elementor-widget-heading');
    const textWidget = headingWidget.nextAll('.elementor-widget-text-editor').first();
    
    if (!textWidget.length) return;
    
    // Extract price lines from <p> tags and <br> separated text
    const textContainer = textWidget.find('.elementor-widget-container');
    
    // Get all text content, handling both <p> and <br> formats
    const lines = [];
    
    // Replace <br> with newlines in the HTML before extracting text
    const containerHtml = textContainer.html() || '';
    const withNewlines = containerHtml.replace(/<br\s*\/?>/gi, '\n');
    
    // Load the modified HTML
    const $container = cheerio.load(`<div>${withNewlines}</div>`);
    
    // Get text from <p> tags
    $container('p').each((_, pEl) => {
      const text = $container(pEl).text().trim();
      if (text) {
        // Split on newlines (from <br> replacement)
        const subLines = text.split('\n').map(l => l.trim()).filter(Boolean);
        lines.push(...subLines);
      }
    });
    
    // If no <p> tags found, get raw text
    if (lines.length === 0) {
      const rawText = $container.text().trim();
      lines.push(...rawText.split('\n').map(l => l.trim()).filter(Boolean));
    }
    
    // Parse each line
    for (const line of lines) {
      // Skip separators
      if (line === '—' || line === '-' || line === '–' || line.length < 5) continue;
      
      const parsed = parsePriceLine(line);
      if (parsed) {
        results.push({
          source: 'marketnaija',
          market,
          state,
          commodity: parsed.commodity,
          price: parsed.price,
          unit: parsed.unit,
          date: sourceDate,
          raw: line,
        });
      }
    }
  });
  
  log.success(`MarketNaijaTv: scraped ${results.length} prices from ${new Set(results.map(r => r.market)).size} markets`);
  return results;
}

/**
 * Parse market header like "Suleja Market, Niger State"
 */
function parseMarketHeader(header) {
  const cleaned = header.replace(/—/g, '').replace(/–/g, '').trim();
  
  // Extract state - match "XXX State" at the end
  // e.g., "Suleja Market, Niger State" → "Niger State"
  // e.g., "Soba market, Soba Local Government, Kaduna state" → "Kaduna State"
  const stateMatch = cleaned.match(/(\w+)\s+[Ss]tate\s*$/);
  const state = stateMatch ? stateMatch[1].trim() + ' State' : '';
  
  let market = cleaned;
  if (state) {
    // Remove "State" portion and everything after the last comma before it
    market = cleaned.replace(/,?\s*\w+\s+[Ss]tate\s*$/, '').trim();
    // Also remove "Local Government" qualifiers
    market = market.replace(/,\s*\w+\s+Local Government/i, '').trim();
    // Remove trailing comma
    market = market.replace(/,\s*$/, '').trim();
  }
  
  market = market.replace(/\s+/g, ' ').trim();
  
  return { market: market || null, state };
}

/**
 * Parse a price line like:
 *   "Honey Beans N155,000/Bag"
 *   "Rice – N55,000/Bag(N1,500/Mudu)"
 *   "Maize- N50,000/Bag"
 *   "Guinea corn-N30,000/Bag"
 *   "Beans (White)- N75,000/bag"
 *   "G/nut (Husk-Dried)-N37,000/ 25kg"
 */
function parsePriceLine(line) {
  // Try multiple patterns
  
  // Pattern 1: Name followed by N/₦ price
  // Handles: "Name N123,456/Unit", "Name – N123,456/Unit", "Name- N123,456/Unit"
  const match = line.match(
    /^(.+?)[\s]*[\-–]+[\s]*[₦N]\s*([\d,]+(?:\.\d+)?)\s*\/?(.*)$/
  );
  
  if (!match) {
    // Pattern 2: Name space N price (no dash)
    const match2 = line.match(
      /^(.+?)\s+[₦N]([\d,]+(?:\.\d+)?)\s*\/?(.*)$/
    );
    if (!match2) return null;
    return extractParsed(match2);
  }
  
  return extractParsed(match);
}

function extractParsed(match) {
  let commodity = match[1].trim();
  const priceStr = match[2];
  const unitPart = match[3] || '';
  
  // Clean commodity name - remove trailing dashes/spaces
  commodity = commodity.replace(/[\-–\s]+$/, '').trim();
  // Remove leading dashes
  commodity = commodity.replace(/^[\-–\s]+/, '').trim();
  
  if (!commodity || commodity.length < 2) return null;
  
  const price = parseFloat(priceStr.replace(/,/g, ''));
  if (isNaN(price) || price <= 0) return null;
  
  // Extract unit
  let unit = 'Bag';
  if (unitPart) {
    // Handle "Bag(N1,500/Mudu)" → "Bag"
    const unitClean = unitPart
      .replace(/\([^)]*\)/g, '')  // Remove parenthetical
      .replace(/\s*\(.*$/, '')     // Remove unclosed parens
      .trim();
    if (unitClean) unit = unitClean;
  }
  
  return { commodity, price, unit };
}
