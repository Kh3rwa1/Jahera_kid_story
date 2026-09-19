/**
 * Tests for AuthContext — OAuth callback parsing, session persistence,
 * and sign-out/delete account cleanup. The Appwrite account client is mocked.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from '@testing-library/react-native';
import React from 'react';
import { renderHook } from '@testing-library/react-native';

// ─── Mocks (factories must be self-contained — jest hoists them) ─────

jest.mock('@/lib/appwrite', () => ({
  APPWRITE_PROJECT_ID: 'test-project',
  account: {
    get: jest.fn(),
    getSession: jest.fn(),
    createSession: jest.fn(),
    createEmailPasswordSession: jest.fn(),
    createOAuth2Token: jest.fn(),
    deleteSession: jest.fn(),
    updateStatus: jest.fn(),
    create: jest.fn(),
  },
  ID: { unique: jest.fn(() => 'unique-id') },
}));

const { account: mockAccount } = jest.requireMock('@/lib/appwrite') as {
  account: Record<string, jest.Mock>;
};

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('@/utils/storage', () => ({
  storage: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

const { storage } = jest.requireMock('@/utils/storage') as {
  storage: Record<string, jest.Mock>;
};

// Linking: capture listener so tests can fire deep-link callbacks
type LinkingListener = (event: { url: string }) => void;
let linkingListener: LinkingListener | null = null;

jest.mock('expo-linking', () => ({
  parse: jest.fn((url: string) => {
    const match = url.match(/userId=([^&]+)&secret=([^&]+)/);
    return {
      queryParams: match ? { userId: match[1], secret: match[2] } : null,
    };
  }),
  addEventListener: jest.fn((_event: string, listener: LinkingListener) => {
    linkingListener = listener;
    return { remove: () => (linkingListener = null) };
  }),
  getInitialURL: jest.fn().mockResolvedValue(null),
  createURL: jest.fn(() => 'jahera://'),
}));

jest.mock('expo-constants', () => ({
  default: { appOwnership: 'standalone' },
}));

// eslint-disable-next-line import/first -- must come after jest.mock hoisting block
import { AuthProvider, useAuth } from '../AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────

const mockUser = { $id: 'user-1', name: 'Test Parent', email: 'p@test.dev' };
const mockSession = { $id: 'session-1', userId: 'user-1' };

async function renderAuth() {
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider as React.ComponentType<{ children: React.ReactNode }>,
  });
  await act(async () => {});
  return result;
}

beforeEach(() => {
  jest.clearAllMocks();
  linkingListener = null;
  AsyncStorage.clear();
  storage.getItem.mockResolvedValue(null);
  mockAccount.get.mockRejectedValue(new Error('not logged in'));
});

// ─── Tests ───────────────────────────────────────────────────────────

describe('AuthContext — initial state', () => {
  it('starts unauthenticated when no session exists', async () => {
    const result = await renderAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('restores a cached session immediately, then validates in background', async () => {
    storage.getItem.mockImplementation((key: string) => {
      if (key === 'authUser') return Promise.resolve(mockUser);
      if (key === 'authSession') return Promise.resolve(mockSession);
      return Promise.resolve(null);
    });
    // Background revalidation succeeds
    mockAccount.get.mockResolvedValue(mockUser);
    mockAccount.getSession.mockResolvedValue(mockSession);

    const result = await renderAuth();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.$id).toBe('user-1');
  });

  it('stays unauthenticated when no cache and network fails', async () => {
    mockAccount.get.mockRejectedValue(new Error('offline'));

    const result = await renderAuth();

    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('AuthContext — email auth', () => {
  it('signUp creates the account, starts a session and persists it', async () => {
    mockAccount.create.mockResolvedValue(mockUser);
    mockAccount.createEmailPasswordSession.mockResolvedValue(mockSession);
    mockAccount.get.mockResolvedValue(mockUser);

    const result = await renderAuth();

    await act(async () => {
      await result.current.signUp('p@test.dev', 'secret123', 'Parent');
    });

    expect(mockAccount.create).toHaveBeenCalledWith(
      'unique-id',
      'p@test.dev',
      'secret123',
      'Parent',
    );
    expect(result.current.isAuthenticated).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith('authUser', mockUser);
    expect(storage.setItem).toHaveBeenCalledWith('authSession', mockSession);
  });

  it('signIn creates an email/password session and sets the user', async () => {
    mockAccount.createEmailPasswordSession.mockResolvedValue(mockSession);
    mockAccount.get.mockResolvedValue(mockUser);

    const result = await renderAuth();

    await act(async () => {
      await result.current.signIn('p@test.dev', 'secret123');
    });

    expect(mockAccount.createEmailPasswordSession).toHaveBeenCalledWith(
      'p@test.dev',
      'secret123',
    );
    expect(result.current.user?.$id).toBe('user-1');
  });

  it('propagates errors from failed sign-in', async () => {
    mockAccount.createEmailPasswordSession.mockRejectedValue(
      new Error('invalid credentials'),
    );

    const result = await renderAuth();

    let caught: unknown = null;
    await act(async () => {
      try {
        await result.current.signIn('p@test.dev', 'wrong');
      } catch (err) {
        caught = err;
      }
    });

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe('invalid credentials');
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('AuthContext — OAuth deep links', () => {
  it('creates a session from a deep-link OAuth callback', async () => {
    mockAccount.createSession.mockResolvedValue(mockSession);
    mockAccount.get.mockResolvedValue(mockUser);

    await renderAuth();

    expect(linkingListener).not.toBeNull();

    await act(async () => {
      linkingListener!({
        url: 'appwrite-callback-test-project://auth?userId=user-1&secret=tok123',
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockAccount.createSession).toHaveBeenCalledWith('user-1', 'tok123');
  });

  it('ignores deep links without OAuth params', async () => {
    await renderAuth();

    await act(async () => {
      linkingListener!({ url: 'jahera://some/other/path' });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockAccount.createSession).not.toHaveBeenCalled();
  });
});

describe('AuthContext — signOut / deleteAccount', () => {
  it('signOut deletes the session and clears persisted auth', async () => {
    mockAccount.createEmailPasswordSession.mockResolvedValue(mockSession);
    mockAccount.get.mockResolvedValue(mockUser);
    mockAccount.deleteSession.mockResolvedValue(undefined);

    const result = await renderAuth();
    await act(async () => {
      await result.current.signIn('p@test.dev', 'secret123');
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockAccount.deleteSession).toHaveBeenCalledWith('current');
    expect(storage.removeItem).toHaveBeenCalledWith('authUser');
    expect(storage.removeItem).toHaveBeenCalledWith('authSession');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('signOut still clears local state when the API call fails', async () => {
    mockAccount.deleteSession.mockRejectedValue(new Error('network'));

    const result = await renderAuth();

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('deleteAccount blocks the account and clears local state', async () => {
    mockAccount.updateStatus.mockResolvedValue(undefined);
    mockAccount.deleteSession.mockResolvedValue(undefined);

    const result = await renderAuth();

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(mockAccount.updateStatus).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith('authUser');
  });
});
