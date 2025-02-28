import { RepoStats, GitHubTreeResponse, GitHubContentResponse } from './github';

/**
 * Cache entry interface for storing data with timestamps
 */
export interface CacheEntry<T = CachedData | string> {
  data: T;
  timestamp: number;
}

/** Union type for all cacheable data types */
export type CachedData = RepoStats | GitHubTreeResponse | GitHubContentResponse;

/** Cache storage for API responses */
export const apiCache = new Map<string, CacheEntry<CachedData | string>>();
