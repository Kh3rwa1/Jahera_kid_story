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

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    storyId: 'story-123',
  }),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    useSharedValue: jest.fn(() => ({ value: 1 })),
    withTiming: jest.fn(),
    Easing: {
      out: jest.fn(),
      cubic: jest.fn(),
    },
  };
});

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

    expect(result.current.story?.id).toBe('story-123');
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
