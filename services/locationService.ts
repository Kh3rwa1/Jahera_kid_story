import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface LocationContext {
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

const CACHE_KEY = 'jahera_location_cache';
const CACHE_TTL_MS = 30 * 60 * 1000;

interface CachedLocation {
  context: LocationContext;
  timestamp: number;
}

async function readCache(): Promise<LocationContext | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedLocation = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
    return cached.context;
  } catch {
    return null;
  }
}

async function writeCache(context: LocationContext): Promise<void> {
  try {
    const payload: CachedLocation = { context, timestamp: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
  }
}

export async function getLocationContext(): Promise<LocationContext | null> {
  try {
    const cached = await readCache();
    if (cached) return cached;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });

    const context: LocationContext = {
      city: place?.city || place?.district || place?.subregion || null,
      region: place?.region || null,
      country: place?.country || null,
      latitude,
      longitude,
    };

    await writeCache(context);
    return context;
  } catch {
    return null;
  }
}

export function formatLocationLabel(ctx: LocationContext | null): string | null {
  if (!ctx) return null;
  const parts = [ctx.city, ctx.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
