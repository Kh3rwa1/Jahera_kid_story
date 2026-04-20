import AsyncStorage from '@react-native-async-storage/async-storage';

type EvictionStrategy = 'lru' | 'oldest-first';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
  insertedAt?: number;
  lastAccessedAt?: number;
  accessCount?: number;
}

interface CacheServiceOptions {
  maxEntries?: number;
  evictionStrategy?: EvictionStrategy;
  cleanupIntervalMs?: number;
}

/**
 * Production-ready caching service with TTL support.
 * All memory operations use bulk Map reconstruction (no per-key loops).
 */
class CacheService {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number;
  private readonly evictionStrategy: EvictionStrategy;
  private readonly cleanupIntervalMs: number;
  private lastCleanupAt = 0;

  constructor(options: CacheServiceOptions = {}) {
    this.maxEntries = options.maxEntries ?? 200;
    this.evictionStrategy = options.evictionStrategy ?? 'oldest-first';
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? 60_000;
  }

  private normalizeEntry<T>(entry: CacheEntry<T>): CacheEntry<T> {
    const now = Date.now();
    return {
      ...entry,
      insertedAt: entry.insertedAt ?? entry.timestamp ?? now,
      lastAccessedAt:
        entry.lastAccessedAt ?? entry.insertedAt ?? entry.timestamp ?? now,
      accessCount: entry.accessCount ?? 0,
    };
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.expiresIn;
  }

  private async maybeCleanupExpiredEntries(
    force: boolean = false,
  ): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastCleanupAt < this.cleanupIntervalMs) return;
    this.lastCleanupAt = now;

    // Single-pass partition: separate valid from expired
    const entries = Array.from(this.memoryCache.entries());
    const validEntries = entries.filter(([, entry]) => !this.isExpired(entry));
    const expiredKeys = entries
      .filter(([, entry]) => this.isExpired(entry))
      .map(([key]) => key);

    if (expiredKeys.length === 0) return;

    // Atomic swap: replace entire map with filtered entries
    this.memoryCache = new Map(validEntries);

    try {
      await AsyncStorage.multiRemove(expiredKeys.map((key) => `cache_${key}`));
    } catch (error) {
      console.error('[CacheService] Cleanup error:', error);
    }
  }

  private async enforceMaxEntries(): Promise<void> {
    if (this.memoryCache.size <= this.maxEntries) return;

    // Score all entries, sort, determine which to keep
    const scored = Array.from(this.memoryCache.entries()).map(
      ([key, entry]) => ({
        key,
        entry,
        score:
          this.evictionStrategy === 'lru'
            ? (entry.lastAccessedAt ?? entry.timestamp)
            : (entry.insertedAt ?? entry.timestamp),
      }),
    );
    scored.sort((a, b) => a.score - b.score);

    const numToEvict = this.memoryCache.size - this.maxEntries;
    const evictedKeys = scored.slice(0, numToEvict).map((s) => s.key);
    const keepEntries = scored
      .slice(numToEvict)
      .map((s) => [s.key, s.entry] as [string, CacheEntry<unknown>]);

    if (evictedKeys.length === 0) return;

    // Atomic swap: new Map from kept entries only
    this.memoryCache = new Map(keepEntries);

    try {
      await AsyncStorage.multiRemove(evictedKeys.map((key) => `cache_${key}`));
    } catch (error) {
      console.error('[CacheService] Eviction error:', error);
    }
  }

  /**
   * Set cache with TTL (time to live in milliseconds)
   */
  async set<T>(key: string, data: T, ttl: number = 3600000): Promise<void> {
    await this.maybeCleanupExpiredEntries();

    const now = Date.now();
    const existingEntry = this.memoryCache.get(key) as
      | CacheEntry<T>
      | undefined;
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresIn: ttl,
      insertedAt: existingEntry?.insertedAt ?? now,
      lastAccessedAt: now,
      accessCount: existingEntry?.accessCount ?? 0,
    };

    this.memoryCache.set(key, this.normalizeEntry(entry));
    await this.enforceMaxEntries();

    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Get cached data if not expired
   */
  async get<T>(key: string): Promise<T | null> {
    await this.maybeCleanupExpiredEntries();

    let entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      try {
        const stored = await AsyncStorage.getItem(`cache_${key}`);
        if (stored) {
          entry = JSON.parse(stored);
          if (entry) {
            this.memoryCache.set(key, this.normalizeEntry(entry));
            await this.enforceMaxEntries();
          }
        }
      } catch (error) {
        console.error('Failed to retrieve cached data:', error);
        return null;
      }
    }

    if (!entry) return null;

    const normalizedEntry = this.normalizeEntry(entry);
    if (this.isExpired(normalizedEntry)) {
      await this.delete(key);
      return null;
    }

    const touchedEntry: CacheEntry<T> = {
      ...normalizedEntry,
      lastAccessedAt: Date.now(),
      accessCount: (normalizedEntry.accessCount ?? 0) + 1,
    };
    this.memoryCache.set(key, touchedEntry);

    return touchedEntry.data;
  }

  /**
   * Delete cached entry
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Failed to delete cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.lastCleanupAt = 0;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get or fetch data with caching
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600000,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache by prefix
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    await this.maybeCleanupExpiredEntries();

    // Atomic swap: new Map from entries that DON'T match the prefix
    const kept = Array.from(this.memoryCache.entries()).filter(
      ([key]) => !key.startsWith(prefix),
    );
    this.memoryCache = new Map(kept);

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(`cache_${prefix}`));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to invalidate cache by prefix:', error);
    }
  }
}

export const cacheService = new CacheService();
