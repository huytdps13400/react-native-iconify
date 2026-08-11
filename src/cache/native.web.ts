import { MemoryCache } from './cache';
import type { CacheOptions, NativeCacheModule } from './types';
import { CacheError } from './types';

function getUtf8ByteLength(value: string): number {
  let length = 0;

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;

    if (codePoint <= 0x7f) {
      length += 1;
    } else if (codePoint <= 0x7ff) {
      length += 2;
    } else if (codePoint <= 0xffff) {
      length += 3;
    } else {
      length += 4;
    }
  }

  return length;
}

/**
 * In-memory cache backend for React Native Web.
 *
 * Web builds cannot load the iOS/Android cache module, so they use the same
 * asynchronous contract backed by the existing LRU memory cache.
 */
export class NativeDiskCache<T = unknown> {
  private memoryCache: MemoryCache<string>;

  constructor(
    _nativeModule?: NativeCacheModule,
    options: CacheOptions = {}
  ) {
    this.memoryCache = new MemoryCache<string>(options);
  }

  async get(key: string): Promise<T | null> {
    const value = this.memoryCache.get(key);

    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      throw new CacheError(
        `Failed to parse cached data for key: ${key}`,
        'SERIALIZATION_ERROR',
        error
      );
    }
  }

  async set(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const value = JSON.stringify(data);
      this.memoryCache.set(key, value, ttl);
    } catch (error) {
      throw new CacheError(
        `Failed to serialize data for key: ${key}`,
        'SERIALIZATION_ERROR',
        error
      );
    }
  }

  async remove(key: string): Promise<void> {
    this.memoryCache.remove(key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
  }

  async getSize(): Promise<number> {
    return this.memoryCache.keys().reduce((size, key) => {
      const value = this.memoryCache.get(key);
      return size + (value === null ? 0 : getUtf8ByteLength(value));
    }, 0);
  }

  async clearMemoryCache(): Promise<boolean> {
    this.memoryCache.clear();
    return true;
  }

  async clearDiskCache(): Promise<boolean> {
    return true;
  }
}
