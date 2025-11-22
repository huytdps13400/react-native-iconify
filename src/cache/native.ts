import type { NativeCacheModule } from './types';
import { CacheError } from './types';
import { NativeModules, Platform } from 'react-native';

/**
 * Load native cache module
 * Supports both Expo (with development build) and React Native CLI
 *
 * IMPORTANT: This package requires native modules and does NOT work in Expo Go.
 * You must use a development build or bare React Native project.
 */
function loadNativeModule(): NativeCacheModule {
  let module: NativeCacheModule | null = null;

  // Try React Native NativeModules (standard approach)
  try {
    module = NativeModules.TurboCacheModule as NativeCacheModule;
    if (module) {
      return module;
    }
  } catch (error) {
    // Module not available via NativeModules
  }

  // Try TurboModuleRegistry (for New Architecture)
  try {
    const { TurboModuleRegistry } = require('react-native');
    if (TurboModuleRegistry) {
      module = TurboModuleRegistry.get('TurboCache') as NativeCacheModule;
      if (module) {
        return module;
      }
    }
  } catch (error) {
    // TurboModuleRegistry not available
  }

  // No native module found - throw error
  throw new CacheError(
    `TurboCache native module not found. Platform: ${Platform.OS}\n\n` +
    'This package requires native modules and does NOT support Expo Go.\n\n' +
    'Solutions:\n' +
    '1. Use Expo Development Build: npx expo prebuild && npx expo run:ios/android\n' +
    '2. Use bare React Native CLI project\n' +
    '3. For Expo Go, use @react-native-iconify/native (static bundling) instead',
    'MODULE_NOT_FOUND'
  );
}

/**
 * Native disk cache wrapper
 * Provides type-safe interface to native cache module
 */
export class NativeDiskCache<T = unknown> {
  private nativeModule: NativeCacheModule;

  constructor(nativeModule?: NativeCacheModule) {
    this.nativeModule = nativeModule || loadNativeModule();
  }

  /**
   * Get value from native cache
   * @param key - Cache key
   * @returns Cached value or null
   */
  async get(key: string): Promise<T | null> {
    try {
      const value = await this.nativeModule.getValue(key);

      if (!value) {
        return null;
      }

      // Deserialize JSON
      return JSON.parse(value) as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new CacheError(
          `Failed to parse cached data for key: ${key}`,
          'SERIALIZATION_ERROR',
          error
        );
      }
      throw new CacheError(
        `Failed to get from native cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NATIVE_ERROR',
        error
      );
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
      // Serialize to JSON
      const value = JSON.stringify(data);
      await this.nativeModule.setValue(key, value, ttl);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new CacheError(
          `Failed to serialize data for key: ${key}`,
          'SERIALIZATION_ERROR',
          error
        );
      }
      throw new CacheError(
        `Failed to set in native cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NATIVE_ERROR',
        error
      );
    }
  }

  /**
   * Remove value from native cache
   * @param key - Cache key
   */
  async remove(key: string): Promise<void> {
    try {
      await this.nativeModule.remove(key);
    } catch (error) {
      throw new CacheError(
        `Failed to remove from native cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NATIVE_ERROR',
        error
      );
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await this.nativeModule.clear();
    } catch (error) {
      throw new CacheError(
        `Failed to clear native cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NATIVE_ERROR',
        error
      );
    }
  }

  /**
   * Get cache size in bytes
   * @returns Size in bytes
   */
  async getSize(): Promise<number> {
    try {
      return await this.nativeModule.getSize();
    } catch (error) {
      throw new CacheError(
        `Failed to get cache size: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NATIVE_ERROR',
        error
      );
    }
  }

  /**
   * Clear only memory cache (native layer)
   * @returns true if successful
   */
  async clearMemoryCache(): Promise<boolean> {
    try {
      return await this.nativeModule.clearMemoryCache();
    } catch (error) {
      throw new CacheError(
        `Failed to clear memory cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NATIVE_ERROR',
        error
      );
    }
  }

  /**
   * Clear only disk cache (native layer)
   * @returns true if successful
   */
  async clearDiskCache(): Promise<boolean> {
    try {
      return await this.nativeModule.clearDiskCache();
    } catch (error) {
      throw new CacheError(
        `Failed to clear disk cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NATIVE_ERROR',
        error
      );
    }
  }
}
