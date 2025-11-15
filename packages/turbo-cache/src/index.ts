/**
 * @react-native-iconify/turbo-cache
 *
 * Native caching via SDWebImage (iOS) and Glide (Android).
 * Uses native memory + disk cache only (no JavaScript cache layer).
 *
 * Based on expo-image's caching architecture.
 */

import { NativeDiskCache } from './native';
import type { CacheOptions, NativeCacheModule } from './types';

export { NativeDiskCache } from './native';
export type {
  CacheOptions,
  NativeCacheModule
} from './types';
export { CacheError } from './types';

/**
 * Native-only cache using SDWebImage (iOS) and Glide (Android).
 * Both libraries provide built-in memory + disk caching with LRU eviction.
 *
 * This avoids Hermes "property is not writable" errors by eliminating
 * JavaScript object manipulation in the cache layer.
 */
export class TurboCache<T = unknown> {
  private nativeCache: NativeDiskCache<T>;

  constructor(
    options: CacheOptions = {},
    nativeModule?: NativeCacheModule
  ) {
    this.nativeCache = new NativeDiskCache<T>(nativeModule);
  }

  /**
   * Get value from native cache (memory → disk handled by native layer)
   * @param key - Cache key
   * @returns Cached value or null
   */
  async get(key: string): Promise<T | null> {
    try {
      const value = await this.nativeCache.get(key);
      if (value !== null) {
        console.log(`[TurboCache] Native cache HIT for "${key}"`);
        return value;
      }
      console.log(`[TurboCache] Native cache MISS for "${key}"`);
      return null;
    } catch (error) {
      console.error(`[TurboCache] Error getting from cache:`, error);
      return null;
    }
  }

  /**
   * Set value in native cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time-to-live in milliseconds
   */
  async set(key: string, data: T, ttl?: number): Promise<void> {
    try {
      await this.nativeCache.set(key, data, ttl);
      console.log(`[TurboCache] Saved to native cache: "${key}"`);
    } catch (error) {
      console.error(`[TurboCache] Error saving to cache:`, error);
      throw error;
    }
  }

  /**
   * Remove value from cache
   * @param key - Cache key
   */
  async remove(key: string): Promise<void> {
    await this.nativeCache.remove(key);
  }

  /**
   * Clear all cache entries (memory + disk)
   */
  async clear(): Promise<void> {
    await this.nativeCache.clear();
  }

  /**
   * Clear only memory cache (native layer)
   */
  async clearMemoryCache(): Promise<boolean> {
    return await this.nativeCache.clearMemoryCache();
  }

  /**
   * Clear only disk cache (native layer)
   */
  async clearDiskCache(): Promise<boolean> {
    return await this.nativeCache.clearDiskCache();
  }

  /**
   * Get total cache size in bytes
   * @returns Size in bytes
   */
  async getSize(): Promise<number> {
    return await this.nativeCache.getSize();
  }
}

/**
 * Create a new TurboCache instance
 * @param options - Cache options (currently unused, for future extensibility)
 * @param nativeModule - Optional native module (for testing)
 * @returns TurboCache instance
 */
export function createCache<T = unknown>(
  options?: CacheOptions,
  nativeModule?: NativeCacheModule
): TurboCache<T> {
  return new TurboCache<T>(options, nativeModule);
}
