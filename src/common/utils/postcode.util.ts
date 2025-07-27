/**
 * Checks if a postcode matches one of the supported areas.
 * Supported areas: Peterborough, Stamford, Bourne, Holbeach, London, Spalding
 * @param postcode The postcode to check
 * @returns The matched area name (string) or null if not found
 */
const areaOutwards: Record<string, string> = {
  // LN (Lincolnshire)
  'LN13': 'Alford',
  'LN11': 'Louth',
  'LN12': 'Mablethorpe',
  'LN08': 'Market Rasen',
  'LN10': 'Woodhall Spa',
  'LN7':  'Caistor',

  // PE (Peterborough & South Lincolnshire)
  'PE21': 'Boston',
  'PE24': 'Wainfleet All Saints',
  'PE6':  'Market Deeping/Crowland',
  'PE9':  'Stamford',
  'PE10': 'Bourne',
  'PE11': 'Spalding',
  'PE12': 'Holbeach',
  'PE3':  'Peterborough',

  // NG (Nottinghamshire / Lincolnshire)
  'NG34': 'Sleaford',

  // DN (Doncaster / Scunthorpe area)
  'DN22': 'Gainsborough',
  'DN16': 'Scunthorpe',
  'DN20': 'Brigg',
  'DN18': 'Barton-upon-Humber',
};

const londonPrefixes = [
  /^E(?:\d|1\d|20)?$/, /^EC[1-4][A-Z]?$/,
  /^N(?:\d|1\d|2[0-2])?[A-Z]?$/, /^NE\d$/,
  /^NW(?:\d|1[01])?[A-Z]?$/, /^SE(?:\d|1\d|2[0-8])?[A-Z]?$/,
  /^SW(?:\d|1\d|20)?[A-Z]?$/, /^W(?:\d|1[0-4])?[A-Z]?$/,
  /^WC[12][A-Z]?$/,
];

export function matchSupportedArea(postcode: string): string | null {
  if (!postcode) return null;

  const clean = postcode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (clean.length < 5) return null;

  const outward = clean.slice(0, clean.length - 3); // remove inward code

  // Match mapped areas
  if (areaOutwards[outward]) {
    return areaOutwards[outward];
  }

  // Match special pattern for Peterborough if PE[1-8]
  if (/^PE[1-8]$/.test(outward)) {
    return 'Peterborough';
  }

  // Match London by prefix
  if (londonPrefixes.some(re => re.test(outward)) || outward === 'LONDON') {
    return 'London';
  }

  return null;
}
