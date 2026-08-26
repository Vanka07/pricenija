/**
 * Scraper configuration
 */

// Load .env file if present (no dependency needed - use built-in)
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function applyEnvFile(envPath) {
  try {
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
    // file not present
  }
}

function loadEnv() {
  applyEnvFile(resolve(__dirname, '.env'));
  applyEnvFile(resolve(__dirname, '../../.env.local'));
  applyEnvFile(resolve(__dirname, '../../.env'));
}

loadEnv();

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const HAS_SERVICE_KEY = Boolean(
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const SOURCES = {
  COMMODITY_NG: 'https://commodity.ng/',
};

// Retired 2026-08-26 (still live, but unusable for the 8 DB markets):
// MarketNaijaTv https://marketnaijatv.com/commodity-market-prices/ — rural only
// PluckAgro     https://pluckagro.com/liveprice/ — dates stuck in 2025
// NigerianQueries https://nigerianqueries.com/prices-of-commodities-in-nigeria/ — 3/8 markets
// nigerianprice.com — SEO title "August 2026", article:modified_time 2022-11-15

// Fuzzy match threshold (0-1, higher = stricter)
export const MATCH_THRESHOLD = 0.6;

// Request delay between pages (ms) - be polite
export const REQUEST_DELAY = 1500;
