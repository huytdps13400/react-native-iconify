/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = unknown> {
  /** Cached data */
  data: T;
  /** Timestamp when cached */
  timestamp: number;
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Size of entry in bytes (optional) */
  size?: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
  /** Maximum number of items in cache */
  maxSize?: number;
  /** Default TTL in milliseconds */
  defaultTTL?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Current cache size */
  size: number;
  /** Hit rate percentage */
  hitRate: number;
}

/**
 * Native module interface for disk cache
 */
export interface NativeCacheModule {
  /**
   * Get value from native cache
   * @param key - Cache key
   * @returns Cached data or null
   */
  getValue(key: string): Promise<string | null>;

  /**
   * Set value in native cache
   * @param key - Cache key
   * @param value - Value to cache (JSON string)
   * @param ttl - Time-to-live in milliseconds
   */
  setValue(key: string, value: string, ttl?: number): Promise<void>;

  /**
   * Remove value from native cache
   * @param key - Cache key
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Get cache size in bytes
   */
  getSize(): Promise<number>;

  /**
   * Clear only memory cache (native layer)
   */
  clearMemoryCache(): Promise<boolean>;

  /**
   * Clear only disk cache (native layer)
   */
  clearDiskCache(): Promise<boolean>;
}

/**
 * Error types for cache operations
 */
export class CacheError extends Error {
  constructor(
    message: string,
    public code: 'SERIALIZATION_ERROR' | 'NATIVE_ERROR' | 'STORAGE_ERROR' | 'INVALID_KEY' | 'MODULE_NOT_FOUND',
    public details?: unknown
  ) {
    super(message);
    this.name = 'CacheError';
  }
}
