import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = 'jahera_location_cache';

export interface LocationContext {
  city: string;
  region: string;
  country: string;
}

export function getLocationFromProfile(profile: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): LocationContext {
  return {
    city: profile.city || 'your city',
    region: profile.region || '',
    country: profile.country || 'India',
  };
}

export function formatLocationLabel(location: LocationContext): string {
  if (location.city && location.country) {
    return `${location.city}, ${location.country}`;
  }
  if (location.city) {
    return location.city;
  }
  return '';
}

export async function saveLocationToCache(
  location: LocationContext,
): Promise<void> {
  await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
}

export async function getLocationFromCache(): Promise<LocationContext | null> {
  const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as LocationContext;
  }
  return null;
}
