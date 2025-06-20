/**
 * Checks if a postcode matches one of the supported areas.
 * Supported areas: Peterborough, Stamford, Bourne, Holbeach, London, Spalding
 * @param postcode The postcode to check
 * @returns The matched area name (string) or null if not found
 */
export function matchSupportedArea(postcode: string): string | null {
  if (!postcode) return null;
  const normalized = postcode.trim().toLowerCase();

  // Define area patterns with specific postcode ranges
  const areaPatterns: { [key: string]: RegExp } = {
    Stamford: /^(pe9|stamford)/i,
    Bourne: /^(pe10|bourne)/i,
    Spalding: /^(pe11|spalding)/i,
    Holbeach: /^(pe12|holbeach)/i,
    Peterborough: /^(pe[1-8]|peterborough)/i,
    London: /^(sw|se|nw|ne|w[1-9]|e[1-9]|wc[1-2]|ec[1-4]|n[1-9]|london)/i,
  };

  for (const [area, pattern] of Object.entries(areaPatterns)) {
    if (pattern.test(normalized)) {
      return area;
    }
  }
  return null;
} 