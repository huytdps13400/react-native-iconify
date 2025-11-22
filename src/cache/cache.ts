import type { CacheEntry, CacheOptions, CacheStats } from './types';

/**
 * LRU (Least Recently Used) Memory Cache
 * Fast in-memory caching with automatic eviction
 */
export class MemoryCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>>;
  private accessOrder: string[];
  private maxSize: number;
  private defaultTTL?: number;
  private statsHits: number;
  private statsMisses: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL;
    this.statsHits = 0;
    this.statsMisses = 0;
  }

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.statsMisses++;
      return null;
    }

    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.statsMisses++;
      return null;
    }

    // Update access order (move to end = most recently used)
    this.updateAccessOrder(key);
    this.statsHits++;

    return entry.data;
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time-to-live in milliseconds
   */
  set(key: string, data: T, ttl?: number): void {
    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  /**
   * Remove value from cache
   * @param key - Cache key
   * @returns true if removed, false if not found
   */
  remove(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.removeFromAccessOrder(key);
    }
    return result;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.statsHits = 0;
    this.statsMisses = 0;
  }

  /**
   * Get current cache size
   * @returns Number of entries in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns Cache stats
   */
  getStats(): CacheStats {
    const total = this.statsHits + this.statsMisses;
    const hitRate = total > 0 ? (this.statsHits / total) * 100 : 0;

    return {
      hits: this.statsHits,
      misses: this.statsMisses,
      size: this.cache.size,
      hitRate: parseFloat(hitRate.toFixed(2))
    };
  }

  /**
   * Check if entry is expired
   * @param entry - Cache entry
   * @returns true if expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) {
      return false;
    }

    const age = Date.now() - entry.timestamp;
    return age > entry.ttl;
  }

  /**
   * Evict least recently used entry
   */
  private evictOldest(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const oldest = this.accessOrder[0];
    this.cache.delete(oldest);
    this.accessOrder.shift();
  }

  /**
   * Update access order for key
   * @param key - Cache key
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   * @param key - Cache key
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Check if key exists in cache
   * @param key - Cache key
   * @returns true if key exists and not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }

    return true;
  }

  /**
   * Get all keys in cache
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}
