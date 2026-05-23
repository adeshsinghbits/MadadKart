/**
 * Geoapify utility — autocomplete, reverse-geocoding, and nearby-search
 * Docs: https://apidocs.geoapify.com
 */

const API_KEY = () => {
  const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_GEOAPIFY_API_KEY is not set');
  return key;
};

export interface GeoFeature {
  place_id: string;
  formatted: string;
  address_line1: string;
  address_line2: string;
  city?: string;
  state?: string;
  country?: string;
  lat: number;
  lon: number;
  result_type?: string;
  rank?: { confidence: number };
}

/** Autocomplete — returns up to `limit` suggestions */
export async function autocomplete(query: string, limit = 7, countryCode = 'in'): Promise<GeoFeature[]> {
  if (!query || query.trim().length < 2) return [];
  const key = API_KEY();
  const params = new URLSearchParams({
    text: query.trim(),
    apiKey: key,
    limit: String(limit),
    filter: `countrycode:${countryCode}`,
    bias: 'proximity:78.9629,22.5937',   // centre of India
    format: 'json',
  });
  const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`);
  if (!res.ok) throw new Error(`Geoapify autocomplete error: ${res.status}`);
  const data = await res.json();
  return (data.results ?? []) as GeoFeature[];
}

/** Reverse geocode a lat/lng pair to a human address */
export async function reverseGeocode(lat: number, lon: number): Promise<GeoFeature | null> {
  const key = API_KEY();
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), apiKey: key, format: 'json' });
  const res = await fetch(`https://api.geoapify.com/v1/geocode/reverse?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return (data.results?.[0] ?? null) as GeoFeature | null;
}

/** Forward geocode an address string → lat/lon */
export async function geocode(address: string): Promise<GeoFeature | null> {
  const key = API_KEY();
  const params = new URLSearchParams({ text: address, apiKey: key, format: 'json', limit: '1' });
  const res = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return (data.results?.[0] ?? null) as GeoFeature | null;
}

/** Build a Geoapify map tile URL (styled OSM) */
export function geoapifyTileUrl(style: 'osm-carto' | 'osm-bright' | 'positron' | 'dark-matter' = 'positron') {
  const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';
  return `https://maps.geoapify.com/v1/tile/${style}/{z}/{x}/{y}.png?apiKey=${key}`;
}