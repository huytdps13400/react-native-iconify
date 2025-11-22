/**
 * TurboCacheModule Spec for New Architecture (TurboModules)
 *
 * This spec enables TurboModule support for both iOS and Android.
 * It will be used by Codegen to generate native interfaces.
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or null
   */
  getValue(key: string): Promise<string | null>;

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache (JSON string)
   * @param ttl - Time-to-live in milliseconds (optional)
   */
  setValue(key: string, value: string, ttl?: number | null): Promise<void>;

  /**
   * Remove value from cache
   * @param key - Cache key
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Get cache size in bytes
   * @returns Size in bytes
   */
  getSize(): Promise<number>;

  /**
   * Clear only memory cache (native layer)
   * @returns true if successful
   */
  clearMemoryCache(): Promise<boolean>;

  /**
   * Clear only disk cache (native layer)
   * @returns true if successful
   */
  clearDiskCache(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('TurboCacheModule');
