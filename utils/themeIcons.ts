import {
  Rocket,
  PawPrint,
  BookOpen,
  TreePine,
  Castle,
  Telescope,
  Heart,
  Compass,
  Music,
  Globe,
  Sparkles,
} from 'lucide-react-native';

export const THEME_ICONS: Record<string, { icon: any; size: number }> = {
  Space: { icon: Rocket, size: 42 },
  Animals: { icon: PawPrint, size: 42 },
  Nature: { icon: TreePine, size: 42 },
  Fantasy: { icon: Castle, size: 42 },
  Science: { icon: Telescope, size: 42 },
  Friendship: { icon: Heart, size: 42 },
  Adventure: { icon: Compass, size: 42 },
  Music: { icon: Music, size: 42 },
  Culture: { icon: Globe, size: 42 },
  Magic: { icon: Sparkles, size: 42 },
};

export const DEFAULT_THEME_ICON = { icon: BookOpen, size: 42 };

export function getThemeIcon(theme?: string | null) {
  if (!theme) return DEFAULT_THEME_ICON;
  return THEME_ICONS[theme] || DEFAULT_THEME_ICON;
}
