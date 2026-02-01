/**
 * Scraper configuration
 */

// Load .env file if present (no dependency needed - use built-in)
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = resolve(__dirname, '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      const value = rest.join('=').trim();
      if (key && value && !process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  } catch {
    // .env file not found, rely on environment variables
  }
}

loadEnv();

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SOURCES = {
  MARKET_NAIJA: 'https://marketnaijatv.com/commodity-market-prices/',
  PLUCK_AGRO_MARKETS: 'https://pluckagro.com/liveprice/markets.php',
  PLUCK_AGRO_MARKET_DETAIL: 'https://pluckagro.com/liveprice/market-detail.php',
};

// Fuzzy match threshold (0-1, higher = stricter)
export const MATCH_THRESHOLD = 0.6;

// Request delay between pages (ms) - be polite
export const REQUEST_DELAY = 1500;
