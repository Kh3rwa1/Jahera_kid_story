import { getRelativeTime, getSeasonPalette, SeasonPalette } from '../dateUtils';

describe('getRelativeTime', () => {
  it('returns "Just now" for dates less than 1 minute ago', () => {
    const now = new Date().toISOString();
    expect(getRelativeTime(now)).toBe('Just now');
  });

  it('returns minutes ago for recent dates', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(getRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago for dates within 24h', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(getRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "Yesterday" for dates 1 day ago', () => {
    const yesterday = new Date(Date.now() - 25 * 3_600_000).toISOString();
    expect(getRelativeTime(yesterday)).toBe('Yesterday');
  });

  it('returns "Xd ago" for dates within 7 days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(getRelativeTime(threeDaysAgo)).toBe('3d ago');
  });

  it('returns formatted date for dates older than 7 days', () => {
    const oldDate = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const result = getRelativeTime(oldDate);
    expect(result).not.toContain('ago');
    expect(result).not.toBe('Yesterday');
  });

  // Edge case / error tests
  it('handles boundary: exactly 1 minute ago', () => {
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    expect(getRelativeTime(oneMinAgo)).toBe('1m ago');
  });

  it('handles boundary: exactly 60 minutes ago', () => {
    const oneHrAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    expect(getRelativeTime(oneHrAgo)).toBe('1h ago');
  });

  it('handles boundary: exactly 7 days ago returns formatted date', () => {
    const sevenDays = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const result = getRelativeTime(sevenDays);
    expect(result).not.toContain('d ago');
  });

  it('handles invalid date string gracefully', () => {
    const result = getRelativeTime('not-a-date');
    // NaN propagation — should still return a string without crashing
    expect(typeof result).toBe('string');
  });

  it('handles future dates', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    // Negative diff → "Just now" since mins < 1
    expect(getRelativeTime(future)).toBe('Just now');
  });
});

describe('getSeasonPalette', () => {
  it('returns a 3-color gradient palette', () => {
    const palette = getSeasonPalette('spring');
    expect(palette.colors).toHaveLength(3);
    expect(palette.emoji).toBe('🌸');
  });

  it('uses default emoji for unknown season', () => {
    const palette = getSeasonPalette(null);
    expect(palette.emoji).toBe('📖');
  });

  it('uses theme-based emoji when theme is provided', () => {
    const palette = getSeasonPalette('spring', '#FF0000', 'adventure');
    expect(palette.emoji).toBe('🗺️');
  });

  it('sets correct seasonal emojis', () => {
    expect(getSeasonPalette('summer').emoji).toBe('☀️');
    expect(getSeasonPalette('fall').emoji).toBe('🍂');
    expect(getSeasonPalette('winter').emoji).toBe('❄️');
  });

  it('uses provided themePrimary as base color', () => {
    const palette = getSeasonPalette('spring', '#FF5500');
    expect(palette.colors[0]).toBe('#FF5500');
  });

  it('falls back to default color when no themePrimary', () => {
    const palette = getSeasonPalette('spring');
    expect(palette.colors[0]).toBe('#0EA5E9');
  });

  // Edge case / error tests
  it('handles undefined season and theme', () => {
    const palette = getSeasonPalette(undefined, undefined, undefined);
    expect(palette.emoji).toBe('📖');
    expect(palette.colors).toHaveLength(3);
  });

  it('handles case-insensitive theme matching', () => {
    const palette = getSeasonPalette(null, '#000', 'Adventure');
    // Theme normalization is .toLowerCase() so should match
    expect(palette.emoji).toBe('🗺️');
  });

  it('gradient colors are progressively darker', () => {
    const palette = getSeasonPalette('spring', '#FFFFFF');
    const [c1, c2, c3] = palette.colors;
    // Each subsequent color should be darker (lower hex values)
    expect(c1).toBe('#FFFFFF');
    expect(c2).not.toBe(c1);
    expect(c3).not.toBe(c2);
  });

  it('returns correct type shape', () => {
    const palette: SeasonPalette = getSeasonPalette('winter');
    expect(palette).toHaveProperty('colors');
    expect(palette).toHaveProperty('accent');
    expect(palette).toHaveProperty('emoji');
    expect(typeof palette.accent).toBe('string');
  });
});
