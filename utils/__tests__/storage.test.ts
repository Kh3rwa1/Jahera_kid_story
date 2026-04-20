/**
 * Tests for storage utility
 * Covers happy-path AND error/edge cases.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// handleError logs to console.error — suppress in tests
jest.mock('../errorHandler', () => ({
  handleError: jest.fn((_err: unknown, _ctx?: string) => ({
    message: 'mock error',
    code: 'TEST_ERROR',
  })),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('storage.getItem', () => {
  it('returns parsed JSON value for a stored key', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ name: 'test' }),
    );
    const result = await storage.getItem('key');
    expect(result).toEqual({ name: 'test' });
  });

  it('returns null when key does not exist', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await storage.getItem('nonexistent');
    expect(result).toBeNull();
  });

  it('returns null on AsyncStorage error (graceful)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
      new Error('Storage fail'),
    );
    const result = await storage.getItem('error');
    expect(result).toBeNull();
  });

  it('returns string values correctly', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify('hello'),
    );
    const result = await storage.getItem<string>('key');
    expect(result).toBe('hello');
  });
});

describe('storage.setItem', () => {
  it('stores JSON stringified value', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    await storage.setItem('key', { foo: 'bar' });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'key',
      JSON.stringify({ foo: 'bar' }),
    );
  });

  it('throws on AsyncStorage error', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(storage.setItem('key', 'val')).rejects.toThrow('mock error');
  });
});

describe('storage.removeItem', () => {
  it('calls AsyncStorage.removeItem', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    await storage.removeItem('key');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('key');
  });

  it('throws on AsyncStorage error', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(storage.removeItem('key')).rejects.toThrow('mock error');
  });
});

describe('storage.getProfileId', () => {
  it('returns stored profile ID', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('profile-123');
    const result = await storage.getProfileId();
    expect(result).toBe('profile-123');
  });

  it('returns null when no profile stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await storage.getProfileId();
    expect(result).toBeNull();
  });

  it('returns null on error (graceful)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('fail'));
    const result = await storage.getProfileId();
    expect(result).toBeNull();
  });
});

describe('storage.clear', () => {
  it('calls AsyncStorage.clear', async () => {
    (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);
    await storage.clear();
    expect(AsyncStorage.clear).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    (AsyncStorage.clear as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(storage.clear()).rejects.toThrow('mock error');
  });
});
