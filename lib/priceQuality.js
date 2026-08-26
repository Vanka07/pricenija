/**
 * Display-time guards for stored prices.
 * Never invents a replacement amount — junk rows are skipped so a
 * later legitimate observation (or no value) is shown instead.
 */

// No wholesale bag in this dataset is ₦100. The known bad row is
// Dawanau soybeans at ₦2 on 2026-03-03.
export const JUNK_WHOLESALE_PRICE_MAX = 100;

export function isJunkWholesalePrice(price) {
  const n = Number(price);
  return !Number.isFinite(n) || n <= JUNK_WHOLESALE_PRICE_MAX;
}

export function usablePrices(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => !isJunkWholesalePrice(row?.price));
}
