import { CacheEntry, CachedData } from "@/types/cache";

/**
 * Cache storage for API responses
 * Exported for use in direct manipulations when needed
 */
export const apiCache = new Map<string, CacheEntry<CachedData | string>>();

/**
 * Default cache validity period in milliseconds (5 minutes)
 */
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * Cache service for GitHub Repository Analyzer
 * Provides methods for storing, retrieving, and managing cached API responses
 * Uses a time-based expiration strategy to ensure data freshness
 */
export const cacheService = {
  /**
   * Generate a consistent cache key for a repository and endpoint
   * @param owner - Repository owner/organization name
   * @param repo - Repository name
   * @param endpoint - API endpoint or identifier
   * @returns Formatted cache key
   */
  getCacheKey: (owner: string, repo: string, endpoint: string): string => {
    return `${owner}/${repo}/${endpoint}`;
  },

  /**
   * Check if a cached entry is still valid
   * @param timestamp - Timestamp when the entry was cached
   * @param ttl - Time to live in milliseconds (defaults to 5 minutes)
   * @returns Boolean indicating if the cache is still valid
   */
  isValidCache: (timestamp: number, ttl = DEFAULT_CACHE_TTL): boolean => {
    return Date.now() - timestamp < ttl;
  },

  /**
   * Store data in the cache
   * @param key - Cache key
   * @param data - Data to cache
   */
  setCache: <T extends CachedData | string>(key: string, data: T): void => {
    apiCache.set(key, {
      data,
      timestamp: Date.now()
    });
  },

  /**
   * Get data from cache if available and valid
   * @param key - Cache key
   * @param ttl - Time to live in milliseconds (optional, defaults to 5 minutes)
   * @returns Cached data or null if not found or expired
   */
  getCache: <T extends CachedData | string>(key: string, ttl = DEFAULT_CACHE_TTL): T | null => {
    const cached = apiCache.get(key);
    if (cached && cacheService.isValidCache(cached.timestamp, ttl)) {
      return cached.data as T;
    }
    return null;
  },
  
  /**
   * Store string data in the cache (specialized method for non-CachedData strings)
   * @param key - Cache key
   * @param data - String data to cache
   */
  setCacheString: (key: string, data: string): void => {
    apiCache.set(key, {
      data,
      timestamp: Date.now()
    });
  },

  /**
   * Get string data from cache if available and valid
   * @param key - Cache key
   * @param ttl - Time to live in milliseconds (optional, defaults to 5 minutes)
   * @returns Cached string or null if not found or expired
   */
  getCacheString: (key: string, ttl = DEFAULT_CACHE_TTL): string | null => {
    const cached = apiCache.get(key);
    if (cached && cacheService.isValidCache(cached.timestamp, ttl)) {
      return cached.data as string;
    }
    return null;
  },

  /**
   * Clear a specific cache entry
   * @param key - Cache key to clear
   * @returns Boolean indicating if an entry was removed
   */
  clearCacheEntry: (key: string): boolean => {
    return apiCache.delete(key);
  },

  /**
   * Clear all cache entries for a specific repository
   * @param owner - Repository owner/organization name
   * @param repo - Repository name
   * @returns Number of entries cleared
   */
  clearRepoCache: (owner: string, repo: string): number => {
    const prefix = `${owner}/${repo}/`;
    let count = 0;
    
    for (const key of apiCache.keys()) {
      if (key.startsWith(prefix)) {
        apiCache.delete(key);
        count++;
      }
    }
    
    return count;
  },

  /**
   * Clear all cache entries
   * @returns Number of entries cleared
   */
  clearAllCache: (): number => {
    const size = apiCache.size;
    apiCache.clear();
    return size;
  },

  /**
   * Get cache statistics
   * @returns Object with cache statistics
   */
  getCacheStats: (): { size: number; keys: string[] } => {
    return {
      size: apiCache.size,
      keys: Array.from(apiCache.keys())
    };
  }
};