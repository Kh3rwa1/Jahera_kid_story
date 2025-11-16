import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

/**
 * Production-ready caching service with TTL support
 */
class CacheService {
  private memoryCache = new Map<string, any>();

  /**
   * Set cache with TTL (time to live in milliseconds)
   */
  async set<T>(key: string, data: T, ttl: number = 3600000): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    };

    // Store in memory
    this.memoryCache.set(key, entry);

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
            this.memoryCache.set(key, entry);
          }
        }
      } catch (error) {
        console.error('Failed to retrieve cached data:', error);
        return null;
      }
    }

    if (!entry) return null;

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.expiresIn) {
      await this.delete(key);
      return null;
    }

    return entry.data;
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
