/**
 * Tests for errorHandler.ts — error classification, retry logic
 * Includes happy-path AND error/edge case tests.
 */
import {
  DatabaseError,
  handleError,
  NetworkError,
  retryWithBackoff,
  ValidationError,
} from '../errorHandler';

// Mock Alert since we're in a Node test environment
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

describe('handleError', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('classifies ValidationError correctly', () => {
    const result = handleError(new ValidationError('Bad input'), 'test');
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('Bad input');
  });

  it('classifies NetworkError correctly', () => {
    const result = handleError(new NetworkError('No internet'));
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.message).toContain('Network error');
  });

  it('classifies DatabaseError correctly', () => {
    const result = handleError(new DatabaseError('Connection lost'));
    expect(result.code).toBe('DATABASE_ERROR');
    expect(result.message).toContain('Database error');
  });

  it('classifies generic Error as UNKNOWN_ERROR', () => {
    const result = handleError(new Error('Something broke'));
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('Something broke');
  });

  it('handles non-Error values (string)', () => {
    const result = handleError('raw string error');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.details).toBe('raw string error');
  });

  it('handles non-Error values (null)', () => {
    const result = handleError(null);
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('handles non-Error values (undefined)', () => {
    const result = handleError(undefined);
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('includes context in console.error call', () => {
    handleError(new Error('test'), 'MyComponent');
    expect(console.error).toHaveBeenCalledWith(
      'Error in MyComponent:',
      expect.any(Error)
    );
  });

  it('uses "unknown context" when no context provided', () => {
    handleError(new Error('test'));
    expect(console.error).toHaveBeenCalledWith(
      'Error in unknown context:',
      expect.any(Error)
    );
  });
});

describe('retryWithBackoff', () => {
  it('returns immediately on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await retryWithBackoff(fn, 3, 10);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds on second attempt', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');
    const result = await retryWithBackoff(fn, 3, 10);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting all retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fail'));
    await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('uses exponential backoff between retries', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const start = Date.now();
    await retryWithBackoff(fn, 3, 50);
    const elapsed = Date.now() - start;
    // First wait: 50ms, second wait: 100ms → ~150ms total
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});

describe('Custom error classes', () => {
  it('NetworkError has correct name', () => {
    const err = new NetworkError('test');
    expect(err.name).toBe('NetworkError');
    expect(err).toBeInstanceOf(Error);
  });

  it('ValidationError has correct name', () => {
    const err = new ValidationError('test');
    expect(err.name).toBe('ValidationError');
    expect(err).toBeInstanceOf(Error);
  });

  it('DatabaseError has correct name', () => {
    const err = new DatabaseError('test');
    expect(err.name).toBe('DatabaseError');
    expect(err).toBeInstanceOf(Error);
  });
});
