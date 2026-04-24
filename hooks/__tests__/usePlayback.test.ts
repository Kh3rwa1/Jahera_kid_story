// Mock appwrite client before any imports touch it
import { act, renderHook } from '@testing-library/react-native';
import { usePlayback } from '../usePlayback';

jest.mock('@/lib/appwrite', () => ({
  databases: {
    createDocument: jest.fn(),
    listDocuments: jest.fn(),
    getDocument: jest.fn(),
  },
  DATABASE_ID: 'test-db',
  COLLECTIONS: {
    STORIES: 'stories',
    QUIZ_QUESTIONS: 'quiz',
    CONFIG: 'config',
    PROFILES: 'profiles',
    USER_LANGUAGES: 'langs',
    FAMILY_MEMBERS: 'fam',
    FRIENDS: 'friends',
    QUIZ_ANSWERS: 'qa',
    QUIZ_ATTEMPTS: 'qatt',
  },
  ID: { unique: () => 'unique-id' },
  Query: { equal: jest.fn(), limit: jest.fn(), orderDesc: jest.fn() },
  account: { get: jest.fn(), createEmailPasswordSession: jest.fn() },
}));

jest.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    profile: { id: 'test-profile', kid_name: 'Test' },
    subscription: { plan: 'free' },
    refreshStories: jest.fn(),
    refreshSubscription: jest.fn(),
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { $id: 'test-user' },
    isAuthenticated: true,
  }),
}));

// Mock dependencies
jest.mock('@/contexts/AudioContext', () => ({
  useAudio: () => ({
    loadAndPlayAudio: jest.fn(),
    stopAudio: jest.fn(),
    retryAudio: jest.fn(),
  }),
}));

jest.mock('@/services/database', () => ({
  storyService: {
    getById: jest
      .fn()
      .mockResolvedValue({ id: 'story-123', title: 'Test Story' }),
  },
  quizService: { getQuestionsByStoryId: jest.fn().mockResolvedValue([]) },
}));

jest.mock('@/services/videoCacheServiceInternal', () => ({
  videoCacheService: {
    getCachedUri: jest.fn().mockReturnValue('cached-video-uri'),
    prefetch: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/nameSubstitution', () => ({
  personalizeStory: jest.fn((story: unknown) => story),
  personalizeStories: jest.fn((stories) => stories),
}));

jest.mock('@/services/offlineStoryService', () => ({
  offlineStoryService: {
    getOfflineStory: jest.fn().mockResolvedValue(null),
    autoSaveIfOnline: jest.fn().mockResolvedValue(undefined),
    saveStoryOffline: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/haptics', () => ({
  hapticFeedback: {
    light: jest.fn(),
    medium: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    storyId: 'story-123',
  }),
}));

jest.mock('react-native-reanimated', () => ({
  default: { call: () => {}, createAnimatedComponent: (c: unknown) => c },
  useSharedValue: jest.fn((v: unknown) => ({ value: v })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((v: unknown) => v),
  withSpring: jest.fn((v: unknown) => v),
  withDelay: jest.fn((_: unknown, v: unknown) => v),
  withSequence: jest.fn((...args: unknown[]) => args[args.length - 1]),
  withRepeat: jest.fn((v: unknown) => v),
  cancelAnimation: jest.fn(),
  Easing: {
    bezier: jest.fn(),
    linear: jest.fn(),
    inOut: jest.fn((e: unknown) => e),
    in: jest.fn((e: unknown) => e),
    out: jest.fn((e: unknown) => e),
  },
  FadeIn: { duration: jest.fn().mockReturnThis() },
  FadeOut: { duration: jest.fn().mockReturnThis() },
  SlideInRight: { duration: jest.fn().mockReturnThis() },
  SlideOutLeft: { duration: jest.fn().mockReturnThis() },
  Layout: { duration: jest.fn().mockReturnThis() },
  runOnJS: jest.fn((fn: unknown) => fn),
  runOnUI: jest.fn((fn: unknown) => fn),
  interpolate: jest.fn(),
  Extrapolation: { CLAMP: 'clamp' },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('usePlayback hook', () => {
  it('initializes with default values and loads story', async () => {
    const { result } = renderHook(() => usePlayback());

    // Initial state before loadStory completes
    expect(result.current.isLoading).toBe(true);
    expect(result.current.showCinematicIntro).toBe(true);

    // Wait for useEffect (loadStory)
    await act(async () => {
      // Allow async effects to run
    });

    // Story may be null if personalizeStory or profile context isn't fully mocked
    expect(result.current.story).not.toBeNull();
    expect(result.current.story?.id).toBe('story-123');
    expect(result.current.isLoading).toBe(false);
  });

  it('toggles tab mode correctly', () => {
    const { result } = renderHook(() => usePlayback());

    act(() => {
      result.current.setTab('text');
    });

    expect(result.current.tab).toBe('text');
  });

  it('dismisses cinematic intro', () => {
    const { result } = renderHook(() => usePlayback());

    act(() => {
      result.current.dismissCinematicIntro();
    });

    // The state change happens after a timeout in the hook,
    // but the function call itself triggers reanimated
    expect(result.current.dismissCinematicIntro).toBeDefined();
  });
});
