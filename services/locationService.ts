export interface LocationContext {
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: null;
  longitude: null;
}

export function getLocationFromProfile(profile: { city?: string | null; region?: string | null; country?: string | null } | null): LocationContext {
  return {
    city: profile?.city || null,
    region: profile?.region || null,
    country: profile?.country || null,
    latitude: null,
    longitude: null,
  };
}

export function formatLocationLabel(ctx: LocationContext | null): string | null {
  if (!ctx) return null;
  const parts = [ctx.city, ctx.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
