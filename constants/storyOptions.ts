export const THEMES = [
  {
    id: 'adventure',
    label: 'Adventure',
    emoji: '🗺️',
    gradient: ['#F97316', '#EF4444'] as [string, string],
  },
  {
    id: 'fantasy',
    label: 'Fantasy',
    emoji: '🐉',
    gradient: ['#8B5CF6', '#6D28D9'] as [string, string],
  },
  {
    id: 'space',
    label: 'Space',
    emoji: '🚀',
    gradient: ['#0EA5E9', '#1D4ED8'] as [string, string],
  },
  {
    id: 'animals',
    label: 'Animals',
    emoji: '🦁',
    gradient: ['#F59E0B', '#D97706'] as [string, string],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    emoji: '🌊',
    gradient: ['#06B6D4', '#0284C7'] as [string, string],
  },
  {
    id: 'superheroes',
    label: 'Heroes',
    emoji: '🦸',
    gradient: ['#EC4899', '#BE185D'] as [string, string],
  },
  {
    id: 'nature',
    label: 'Nature',
    emoji: '🌿',
    gradient: ['#10B981', '#059669'] as [string, string],
  },
  {
    id: 'science',
    label: 'Science',
    emoji: '🔬',
    gradient: ['#6366F1', '#4338CA'] as [string, string],
  },
];

export const MOODS = [
  {
    id: 'exciting',
    label: 'Exciting',
    emoji: '⚡',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  { id: 'funny', label: 'Funny', emoji: '😄', color: '#10B981', bg: '#ECFDF5' },
  {
    id: 'calming',
    label: 'Calming',
    emoji: '🌙',
    color: '#6366F1',
    bg: '#EEF2FF',
  },
  {
    id: 'educational',
    label: 'Learn',
    emoji: '📚',
    color: '#0EA5E9',
    bg: '#F0F9FF',
  },
];

export const LENGTHS = [
  { id: 'short', label: 'Quick', desc: '~750 words', emoji: '⚡' },
  { id: 'medium', label: 'Medium', desc: '~1500 words', emoji: '📖' },
  {
    id: 'long',
    label: 'Long',
    desc: '~3000 words',
    emoji: '📜',
    pro: true,
  } as const,
];

export const FUN_FACTS = [
  'Did you know? Dolphins sleep with one eye open!',
  'Did you know? Octopuses have 3 hearts!',
  'Did you know? Honey never spoils!',
  'Did you know? Sloths can hold their breath for 40 minutes!',
  'Did you know? The moon has moonquakes!',
  'Did you know? Butterflies taste with their feet!',
  'Did you know? Cats have over 20 vocalizations!',
  'Did you know? Penguins propose with pebbles!',
  'Did you know? Bananas glow blue under UV light!',
  'Did you know? A group of flamingos is called a flamboyance!',
];
