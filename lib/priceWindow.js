/**
 * Price date helpers.
 *
 * The public UI used to filter by "last 30 calendar days". After the scraper
 * stopped running, that window was empty even though older prices still exist.
 * Lookbacks are now relative to the newest date actually stored.
 */

export const PRICE_LOOKBACK_DAYS = 90;
export const STALE_AFTER_DAYS = 3;

export function subtractDays(isoDate, days) {
  const base = isoDate && /^\d{4}-\d{2}-\d{2}/.test(isoDate)
    ? isoDate.slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const d = new Date(`${base}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setUTCDate(fallback.getUTCDate() - days);
    return fallback.toISOString().split('T')[0];
  }
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split('T')[0];
}

export function parsePriceDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const iso = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? `${value.slice(0, 10)}T00:00:00`
    : value;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isPriceDataStale(value, staleAfterDays = STALE_AFTER_DAYS) {
  const d = parsePriceDate(value);
  if (!d) return true;
  return Date.now() - d.getTime() > staleAfterDays * 24 * 60 * 60 * 1000;
}

export function formatPriceDate(value) {
  const d = parsePriceDate(value);
  if (!d) return null;
  return d.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
