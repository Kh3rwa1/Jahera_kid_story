import { act,renderHook } from '@testing-library/react-native';
import { useStoryGeneration } from '../useStoryGeneration';

// Mock dependencies
jest.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    profile: { id: 'test-profile-id' },
    subscription: { plan: 'free' },
    refreshSubscription: jest.fn(),
    refreshStories: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    profileId: 'test-profile-id',
    languageCode: 'en',
  }),
}));

jest.mock('@/services/database', () => ({
  familyMemberService: { getByProfileId: jest.fn().mockResolvedValue([]) },
  friendService: { getByProfileId: jest.fn().mockResolvedValue([]) },
  profileService: { getWithRelations: jest.fn().mockResolvedValue({ id: 'test-profile-id' }) },
  storyService: { create: jest.fn().mockResolvedValue({ id: 'story-123', title: 'Test Story' }) },
  quizService: { createQuestion: jest.fn(), createAnswer: jest.fn() },
}));

jest.mock('@/services/aiService', () => ({
  generateAdventureStory: jest.fn().mockResolvedValue({
    title: 'Test Story',
    content: 'Once upon a time...',
    quiz: [],
    word_count: 100,
  }),
}));

jest.mock('@/services/audioService', () => ({
  generateAudio: jest.fn().mockResolvedValue('audio-url'),
}));

jest.mock('@/services/locationService', () => ({
  getLocationFromProfile: jest.fn().mockReturnValue({ city: 'Test City', country: 'Test Country', region: '' }),
}));

jest.mock('@/utils/contextUtils', () => ({
  getCurrentContext: () => ({ season: 'Spring', timeOfDay: 'Morning' }),
}));

jest.mock('@/utils/haptics', () => ({
  hapticFeedback: {
    light: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('useStoryGeneration hook', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useStoryGeneration());
    
    expect(result.current.phase).toBe('options');
    expect(result.current.selectedTheme).toBe('adventure');
    expect(result.current.progress).toBe(0);
  });

  it('updates form state correctly', () => {
    const { result } = renderHook(() => useStoryGeneration());
    
    act(() => {
      result.current.setSelectedTheme('fantasy');
      result.current.setSelectedMood('calm');
    });

    expect(result.current.selectedTheme).toBe('fantasy');
    expect(result.current.selectedMood).toBe('calm');
  });

  it('triggers generation phase when started', async () => {
    const { result } = renderHook(() => useStoryGeneration());
    
    await act(async () => {
      result.current.handleStartGeneration();
    });

    expect(result.current.phase).toBe('generating');
  });

  it('handles retry correctly', () => {
    const { result } = renderHook(() => useStoryGeneration());
    
    act(() => {
      result.current.handleRetry();
    });

    expect(result.current.phase).toBe('options');
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
  });
});
