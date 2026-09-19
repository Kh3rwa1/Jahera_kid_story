/**
 * Tests for AppContext — cache-first profile loading, story personalization,
 * and refresh behavior. All Appwrite/RevenueCat/offline dependencies are mocked.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

// ─── Mocks (factories must be self-contained — jest hoists them) ─────

jest.mock('@/lib/appwrite', () => ({
  APPWRITE_PROJECT_ID: 'test-project',
  account: {
    get: jest.fn(),
    getSession: jest.fn(),
  },
  ID: { unique: jest.fn(() => 'unique-id') },
  databases: {},
  functions: {},
  storage: {},
  COLLECTIONS: {},
  DATABASE_ID: 'jahera_db',
}));

jest.mock('@/services/revenueCatServiceInternal', () => ({
  revenueCatService: {
    identify: jest.fn().mockResolvedValue(undefined),
    addCustomerInfoListener: jest.fn().mockReturnValue(() => {}),
    reset: jest.fn(),
  },
}));

jest.mock('@/services/offlineStoryService', () => ({
  offlineStoryService: {
    getAllOfflineStories: jest.fn().mockResolvedValue([]),
    autoSaveIfOnline: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/services/subscriptionService', () => ({
  subscriptionService: {
    getStatus: jest.fn().mockResolvedValue(null),
    syncFromRevenueCat: jest.fn().mockResolvedValue(undefined),
  },
  streakService: {
    getStreak: jest.fn().mockResolvedValue(null),
  },
}));

interface DatabaseMocks {
  profileService: { getWithRelationsByUserId: jest.Mock };
  storyService: { getByProfileId: jest.Mock };
  quizService: { getAttemptsByProfileId: jest.Mock };
}

jest.mock('@/services/database', () => ({
  profileService: {
    getWithRelationsByUserId: jest.fn(),
  },
  storyService: {
    getByProfileId: jest.fn(),
  },
  quizService: {
    getAttemptsByProfileId: jest.fn(),
  },
}));

const {
  profileService: mockProfileService,
  storyService: mockStoryService,
  quizService: mockQuizService,
} = jest.requireMock('@/services/database') as DatabaseMocks;

jest.mock('@/utils/nameSubstitution', () => ({
  personalizeStories: jest.fn((stories: { title: string }[], kidName: string) =>
    stories.map((s) => ({ ...s, title: `${s.title} [${kidName}]` })),
  ),
}));

// AuthContext is mocked so AppContext tests don't depend on real auth
const authState = {
  user: null as { $id: string } | null,
  isAuthenticated: false,
  isLoading: false,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

// eslint-disable-next-line import/first -- must come after jest.mock hoisting block
import { AppProvider, useApp } from '../AppContext';

// ─── Helpers ─────────────────────────────────────────────────────────

const testProfile = {
  id: 'profile-1',
  user_id: 'user-1',
  kid_name: 'Max',
  city: 'Mumbai',
  languages: [],
  family_members: [],
  friends: [],
  interests: [],
};

const testStory = {
  id: 'story-1',
  profile_id: 'profile-1',
  title: 'The Brave Star',
  content: 'Once upon a time...',
  language_code: 'en',
};

async function renderApp() {
  const { result } = renderHook(() => useApp(), {
    wrapper: AppProvider as React.ComponentType<{ children: React.ReactNode }>,
  });
  return result;
}

function setAuthenticated(userId = 'user-1') {
  authState.user = { $id: userId };
  authState.isAuthenticated = true;
  authState.isLoading = false;
}

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
  authState.user = null;
  authState.isAuthenticated = false;
  authState.isLoading = false;
});

// ─── Tests ───────────────────────────────────────────────────────────

describe('AppContext', () => {
  it('exposes empty state when not authenticated', async () => {
    const result = await renderApp();

    await act(async () => {});
    expect(result.current.profile).toBeNull();
    expect(result.current.stories).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads profile and personalized stories for an authenticated user', async () => {
    setAuthenticated();

    mockProfileService.getWithRelationsByUserId.mockResolvedValue(testProfile);
    mockStoryService.getByProfileId.mockResolvedValue([testStory]);
    mockQuizService.getAttemptsByProfileId.mockResolvedValue([]);

    const result = await renderApp();

    await act(async () => {});

    expect(result.current.profile).toEqual(testProfile);
    // personalizeStories is applied with the kid name
    expect(result.current.stories[0].title).toBe('The Brave Star [Max]');
    expect(result.current.isLoading).toBe(false);
  });

  it('uses cached profile first (cache-first strategy)', async () => {
    await AsyncStorage.setItem(
      'app_profile',
      JSON.stringify({ ...testProfile, kid_name: 'CachedKid' }),
    );

    setAuthenticated();

    // Server responds slowly — cache should unblock the UI first
    mockProfileService.getWithRelationsByUserId.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(testProfile), 300)),
    );
    mockStoryService.getByProfileId.mockResolvedValue([]);

    const result = await renderApp();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.profile?.kid_name).toBe('CachedKid');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles server errors gracefully without crashing', async () => {
    setAuthenticated();

    mockProfileService.getWithRelationsByUserId.mockRejectedValue(
      new Error('network down'),
    );

    const result = await renderApp();

    await act(async () => {});

    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBe('network down');
    expect(result.current.isLoading).toBe(false);
  });

  it('refreshStories tolerates fetch errors', async () => {
    setAuthenticated();

    mockProfileService.getWithRelationsByUserId.mockResolvedValue(testProfile);
    mockStoryService.getByProfileId.mockResolvedValue([testStory]);
    mockQuizService.getAttemptsByProfileId.mockResolvedValue([]);

    const result = await renderApp();
    await act(async () => {});

    // Now make the next fetch fail — refreshStories should swallow it
    mockStoryService.getByProfileId.mockRejectedValue(new Error('offline'));
    await act(async () => {
      await result.current.refreshStories();
    });

    expect(result.current.stories.length).toBeGreaterThanOrEqual(0);
  });

  it('updateProfile merges updates into the current profile', async () => {
    setAuthenticated();

    mockProfileService.getWithRelationsByUserId.mockResolvedValue(testProfile);
    mockStoryService.getByProfileId.mockResolvedValue([]);
    mockQuizService.getAttemptsByProfileId.mockResolvedValue([]);

    const result = await renderApp();
    await act(async () => {});

    act(() => {
      result.current.updateProfile({ city: 'Delhi' });
    });

    expect(result.current.profile?.city).toBe('Delhi');
    expect(result.current.profile?.kid_name).toBe('Max');
  });

  it('clearProfile resets all state', async () => {
    setAuthenticated();

    mockProfileService.getWithRelationsByUserId.mockResolvedValue(testProfile);
    mockStoryService.getByProfileId.mockResolvedValue([testStory]);
    mockQuizService.getAttemptsByProfileId.mockResolvedValue([]);

    const result = await renderApp();
    await act(async () => {});

    act(() => {
      result.current.clearProfile();
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.stories).toEqual([]);
    expect(result.current.quizAttempts).toEqual([]);
  });
});
