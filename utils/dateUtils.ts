/**
 * Shared date & season utilities used across multiple screens.
 * Eliminates duplication between Home, History, and other screens.
 */

/**
 * Formats a date string into a human-readable relative time.
 * e.g. "Just now", "5m ago", "3h ago", "Yesterday", "Mar 12"
 */
export function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export interface SeasonPalette {
  colors: readonly [string, string, string];
  accent: string;
  emoji: string;
}

/**
 * Helper to darken a hex color by a specified percentage.
 * (0.1 = 10% darker, 0.5 = 50% darker)
 */
function darkenColor(hex: string, amount: number): string {
  // Remove hash if present
  const base = hex.replace('#', '');
  
  // Convert to RGB
  let r = Number.parseInt(base.substring(0, 2), 16);
  let g = Number.parseInt(base.substring(2, 4), 16);
  let b = Number.parseInt(base.substring(4, 6), 16);

  // Darken each channel
  r = Math.floor(Math.max(0, r * (1 - amount)));
  g = Math.floor(Math.max(0, g * (1 - amount)));
  b = Math.floor(Math.max(0, b * (1 - amount)));

  // Convert back to hex
  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * Returns a high-impact, theme-aware color palette and emoji for a story.
 * Modified for a premium 'Magic' aesthetic (3-stop gradients).
 */
export function getSeasonPalette(
  season: string | null | undefined, 
  themePrimary?: string,
  theme?: string | null
): SeasonPalette {
  const base = themePrimary || '#0EA5E9';
  
  // Create a 3-stop "Magic Gradient" derived from the theme primary
  // Step 1: Base (Theme Primary)
  // Step 2: Slightly shifted (12% darker)
  // Step 3: Significantly deeper (24% darker)
  const palette: SeasonPalette = {
    colors: [
      base,
      darkenColor(base, 0.12),
      darkenColor(base, 0.24)
    ] as readonly [string, string, string],
    accent: darkenColor(base, 0.35),
    emoji: '📖'
  };

  // 1. Theme-based emoji mapping (Content Priority)
  const themeEmojis: Record<string, string> = {
    adventure: '🗺️', fantasy: '🐉', space: '🚀', animals: '🦁',
    ocean: '🌊', superheroes: '🦸‍♂️', nature: '🌿', science: '🔬',
    exciting: '⚡', funny: '😄', calming: '🌙', educational: '📚',
    mystery: '🕵️', music: '🎵', sports: '⚽', food: '🍎'
  };

  const normalizedTheme = theme?.toLowerCase() || '';
  if (themeEmojis[normalizedTheme]) {
    palette.emoji = themeEmojis[normalizedTheme];
    return palette;
  }

  // 2. Fallback: Seasonal emoji
  switch (season?.toLowerCase()) {
    case 'spring': palette.emoji = '🌸'; break;
    case 'summer': palette.emoji = '☀️'; break;
    case 'fall':   palette.emoji = '🍂'; break;
    case 'winter': palette.emoji = '❄️'; break;
    default:       palette.emoji = '📖'; break;
  }

  return palette;
}
