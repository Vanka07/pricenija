/**
 * Utility functions for the scraper
 */

/**
 * Parse Nigerian price string to numeric value
 * Handles: "N45,000/Bag", "₦60,000/Bag", "N/A", "N155,000/100kg Bag"
 * Returns null for N/A or unparseable values
 */
export function parsePrice(priceStr) {
  if (!priceStr) return null;
  
  const cleaned = priceStr.trim();
  if (cleaned === 'N/A' || cleaned === '-' || cleaned === '') return null;
  
  // Remove currency symbols and extract the number
  // Match patterns like: N45,000 or ₦60,000 or 12,500.00
  const match = cleaned.match(/[₦N]?\s*([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  
  const numStr = match[1].replace(/,/g, '');
  const value = parseFloat(numStr);
  
  return isNaN(value) ? null : value;
}

/**
 * Extract unit from price string
 * e.g., "N45,000/Bag" → "Bag", "N155,000/100kg Bag" → "100kg Bag"
 */
export function parseUnit(priceStr) {
  if (!priceStr) return 'Bag';
  const match = priceStr.match(/\/(.+)$/);
  return match ? match[1].trim() : 'Bag';
}

/**
 * Normalize commodity name for matching
 */
export function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple fuzzy string similarity (Dice coefficient)
 */
export function similarity(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0;
  
  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  
  // Bigram similarity
  const bigramsA = new Set();
  for (let i = 0; i < na.length - 1; i++) bigramsA.add(na.slice(i, i + 2));
  
  const bigramsB = new Set();
  for (let i = 0; i < nb.length - 1; i++) bigramsB.add(nb.slice(i, i + 2));
  
  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  
  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

/**
 * Find best match for a name in a list of candidates
 * Returns { id, name, score } or null
 */
export function findBestMatch(name, candidates, threshold = 0.6) {
  let bestMatch = null;
  let bestScore = 0;
  
  const normalized = normalizeName(name);
  
  for (const candidate of candidates) {
    // Try exact normalized match first
    if (normalizeName(candidate.name) === normalized) {
      return { id: candidate.id, name: candidate.name, score: 1.0 };
    }
    
    const score = similarity(name, candidate.name);
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = { id: candidate.id, name: candidate.name, score };
    }
  }
  
  // Also check common aliases
  const aliases = getAliases(name);
  for (const alias of aliases) {
    for (const candidate of candidates) {
      const score = similarity(alias, candidate.name);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = { id: candidate.id, name: candidate.name, score };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Common commodity name aliases for Nigerian markets
 */
function getAliases(name) {
  const aliasMap = {
    'honey beans': ['oloyin beans', 'brown beans'],
    'oloyin beans': ['honey beans', 'brown beans'],
    'iron beans': ['white beans'],
    'potasco beans': ['potasco'],
    'akara/moi-moi beans': ['akara beans', 'moi moi beans'],
    'white corn': ['white maize', 'maize'],
    'yellow corn': ['yellow maize'],
    'guinea corn': ['sorghum', 'red sorghum'],
    'red sorghum': ['guinea corn', 'sorghum'],
    'gari': ['garri', 'cassava flakes'],
    'peanut oil': ['groundnut oil'],
    'kogi red oil': ['palm oil', 'red oil'],
    'sweet potatoes': ['sweet potato'],
    'irish potatoes': ['irish potato', 'potatoes'],
    'dry potatoes': ['dried potatoes'],
    'hand peeled egusi': ['egusi', 'melon seeds'],
    'sesame seeds': ['beniseed', 'sesame'],
    'cassava flour': ['cassava', 'fufu flour'],
    'paddy rice': ['rice paddy', 'paddy'],
    'white rice': ['rice', 'local rice'],
    'foreign rice': ['imported rice'],
    'groundnut': ['peanut', 'groundnuts'],
    'soybeans': ['soya beans', 'soybean'],
    'maize': ['corn', 'white corn'],
    'millet': ['millet grain'],
    'beans': ['brown beans', 'white beans'],
    'dried chilli pepper': ['dry pepper', 'dried pepper', 'pepper'],
    'dried ginger': ['ginger'],
    'bambara nuts': ['bambara nut', 'okpa'],
    'brown beans oloyin': ['oloyin beans', 'honey beans', 'brown beans'],
  };
  
  const key = normalizeName(name);
  for (const [k, v] of Object.entries(aliasMap)) {
    if (normalizeName(k) === key) return v;
  }
  return [];
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format date as YYYY-MM-DD
 */
export function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Logger with timestamp
 */
export const log = {
  info: (msg, ...args) => console.log(`[${new Date().toISOString()}] ℹ️  ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[${new Date().toISOString()}] ⚠️  ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[${new Date().toISOString()}] ❌ ${msg}`, ...args),
  success: (msg, ...args) => console.log(`[${new Date().toISOString()}] ✅ ${msg}`, ...args),
};
