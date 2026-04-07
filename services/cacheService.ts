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
 * Production-ready caching service with TTL support
 */
class CacheService {
  private readonly memoryCache = new Map<string, CacheEntry<unknown>>();
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
    const insertedAt = entry.insertedAt ?? entry.timestamp ?? now;
    const lastAccessedAt = entry.lastAccessedAt ?? insertedAt;
    const accessCount = entry.accessCount ?? 0;

    return {
      ...entry,
      insertedAt,
      lastAccessedAt,
      accessCount,
    };
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    const age = Date.now() - entry.timestamp;
    return age > entry.expiresIn;
  }

  private async maybeCleanupExpiredEntries(force: boolean = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastCleanupAt < this.cleanupIntervalMs) {
      return;
    }
    this.lastCleanupAt = now;

    const expiredKeys: string[] = [];
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    if (expiredKeys.length === 0) {
      return;
    }

    expiredKeys.forEach((key) => this.memoryCache.delete(key));

    try {
      await AsyncStorage.multiRemove(expiredKeys.map((key) => `cache_${key}`));
    } catch (error) {
      console.error('Failed to cleanup expired cache entries:', error);
    }
  }

  private selectEvictionKey(): string | null {
    if (this.memoryCache.size === 0) {
      return null;
    }

    let selectedKey: string | null = null;
    let selectedScore = Number.POSITIVE_INFINITY;

    for (const [key, entry] of this.memoryCache.entries()) {
      const normalized = this.normalizeEntry(entry);
      const score =
        this.evictionStrategy === 'lru'
          ? normalized.lastAccessedAt ?? normalized.insertedAt ?? normalized.timestamp
          : normalized.insertedAt ?? normalized.timestamp;

      if (score < selectedScore) {
        selectedScore = score;
        selectedKey = key;
      }
    }

    return selectedKey;
  }

  private async enforceMaxEntries(): Promise<void> {
    if (this.memoryCache.size <= this.maxEntries) {
      return;
    }

    const keysToEvict: string[] = [];
    while (this.memoryCache.size - keysToEvict.length > this.maxEntries) {
      const evictionKey = this.selectEvictionKey();
      if (!evictionKey) {
        break;
      }
      this.memoryCache.delete(evictionKey);
      keysToEvict.push(evictionKey);
    }

    if (keysToEvict.length === 0) {
      return;
    }

    try {
      await AsyncStorage.multiRemove(keysToEvict.map((key) => `cache_${key}`));
    } catch (error) {
      console.error('Failed to evict cache entries:', error);
    }
  }

  /**
   * Set cache with TTL (time to live in milliseconds)
   */
  async set<T>(key: string, data: T, ttl: number = 3600000): Promise<void> {
    await this.maybeCleanupExpiredEntries();

    const now = Date.now();
    const existingEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresIn: ttl,
      insertedAt: existingEntry?.insertedAt ?? now,
      lastAccessedAt: now,
      accessCount: existingEntry?.accessCount ?? 0,
    };

    // Store in memory
    this.memoryCache.set(key, this.normalizeEntry(entry));
    await this.enforceMaxEntries();

    // Store in AsyncStorage for persistence
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

    // Try memory cache first
    let entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;

    // If not in memory, try AsyncStorage
    if (!entry) {
      try {
        const stored = await AsyncStorage.getItem(`cache_${key}`);
        if (stored) {
          entry = JSON.parse(stored);
          // Restore to memory cache
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

    // Check if expired
    const normalizedEntry = this.normalizeEntry(entry);
    if (this.isExpired(normalizedEntry)) {
      await this.delete(key);
      return null;
    }

    const now = Date.now();
    const touchedEntry: CacheEntry<T> = {
      ...normalizedEntry,
      lastAccessedAt: now,
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
    ttl: number = 3600000
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache by prefix
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    await this.maybeCleanupExpiredEntries();

    // Clear memory cache
    const memoryKeys = Array.from(this.memoryCache.keys());
    memoryKeys.forEach((key) => {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    });

    // Clear AsyncStorage
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
