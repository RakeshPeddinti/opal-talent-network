/**
 * Distance calculation and geolocation utilities for "Near Me" filtering.
 */

export interface UserLocation {
  lat: number;
  lng: number;
  city: string;
  state?: string;
  zip?: string;
  isCustom?: boolean;
}

// Preset popular metro regions
export const PRESET_LOCATIONS: UserLocation[] = [
  { lat: 37.7749, lng: -122.4194, city: 'San Francisco', state: 'CA', zip: '94102' },
  { lat: 30.2672, lng: -97.7431, city: 'Austin', state: 'TX', zip: '78701' },
  { lat: 40.7128, lng: -74.0060, city: 'New York', state: 'NY', zip: '10001' },
  { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', state: 'CA', zip: '90012' },
  { lat: 41.8781, lng: -87.6298, city: 'Chicago', state: 'IL', zip: '60601' },
  { lat: 32.7767, lng: -96.7970, city: 'Dallas', state: 'TX', zip: '75201' },
  { lat: 29.7604, lng: -95.3698, city: 'Houston', state: 'TX', zip: '77002' },
  { lat: 25.7617, lng: -80.1918, city: 'Miami', state: 'FL', zip: '33101' },
  { lat: 47.6062, lng: -122.3321, city: 'Seattle', state: 'WA', zip: '98101' },
  { lat: 33.7490, lng: -84.3880, city: 'Atlanta', state: 'GA', zip: '30303' },
  { lat: 39.7392, lng: -104.9903, city: 'Denver', state: 'CO', zip: '80202' },
  { lat: 42.3601, lng: -71.0589, city: 'Boston', state: 'MA', zip: '02108' },
  { lat: 33.4484, lng: -112.0740, city: 'Phoenix', state: 'AZ', zip: '85001' },
  { lat: 32.7157, lng: -117.1611, city: 'San Diego', state: 'CA', zip: '92101' },
  { lat: 36.1699, lng: -115.1398, city: 'Las Vegas', state: 'NV', zip: '89101' },
  { lat: 38.9072, lng: -77.0369, city: 'Washington', state: 'DC', zip: '20001' },
  { lat: 39.9526, lng: -75.1652, city: 'Philadelphia', state: 'PA', zip: '19107' }
];

export const DEFAULT_USER_LOCATION: UserLocation = PRESET_LOCATIONS[0];

/**
 * Calculates distance between two coordinates in miles using the Haversine formula.
 */
export function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

/**
 * Finds the closest recognized metro area from any GPS coordinate.
 */
export function findNearestMetro(lat: number, lng: number): UserLocation {
  let closest = PRESET_LOCATIONS[0];
  let minDistance = Infinity;

  for (const loc of PRESET_LOCATIONS) {
    const dist = calculateDistanceMiles(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  // If within 50 miles of a known metro, return with that metro name; otherwise return coordinates
  if (minDistance <= 65) {
    return {
      lat,
      lng,
      city: closest.city,
      state: closest.state,
      isCustom: true
    };
  }

  return {
    lat,
    lng,
    city: 'Local Area',
    isCustom: true
  };
}

/**
 * Search locations by city name or ZIP code.
 */
export function searchLocation(query: string): UserLocation | null {
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) return null;

  // Exact or prefix match on city
  const cityMatch = PRESET_LOCATIONS.find(loc => 
    loc.city.toLowerCase() === cleaned || 
    loc.city.toLowerCase().startsWith(cleaned) ||
    `${loc.city.toLowerCase()}, ${loc.state?.toLowerCase()}`.includes(cleaned)
  );
  if (cityMatch) return cityMatch;

  // Match on zip code prefix
  const zipMatch = PRESET_LOCATIONS.find(loc => 
    loc.zip && (loc.zip === cleaned || loc.zip.startsWith(cleaned))
  );
  if (zipMatch) return zipMatch;

  return null;
}

/**
 * Computes a destination point given a starting point, distance in miles, and bearing.
 */
export function getDestinationPoint(
  lat: number,
  lng: number,
  distanceMiles: number,
  bearingDegrees: number
): { lat: number; lng: number } {
  const R = 3958.8;
  const d = distanceMiles / R;
  const radBearing = (bearingDegrees * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const sinLat2 = Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(radBearing);
  const lat2 = Math.asin(sinLat2);
  const y = Math.sin(radBearing) * Math.sin(d) * Math.cos(lat1);
  const x = Math.cos(d) - Math.sin(lat1) * sinLat2;
  const lng2 = lng1 + Math.atan2(y, x);

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI,
  };
}
