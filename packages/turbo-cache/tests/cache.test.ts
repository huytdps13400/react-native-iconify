import { MemoryCache } from '../src/cache';

describe('@react-native-iconify/turbo-cache - MemoryCache', () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    cache = new MemoryCache<string>({ maxSize: 3 });
  });

  describe('get/set', () => {
    it('should set and get value', () => {
      cache.set('key1', 'value1');

      const result = cache.get('key1');

      expect(result).toBe('value1');
    });

    it('should return null for missing key', () => {
      const result = cache.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should update existing value', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');

      const result = cache.get('key1');

      expect(result).toBe('value2');
    });

    it('should handle multiple entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest when size limit reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should update access order on get', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 (makes it most recent)
      cache.get('key1');

      // Add key4 (should evict key2, not key1)
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should not evict when updating existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Update key1 (should not trigger eviction)
      cache.set('key1', 'updated');

      expect(cache.size()).toBe(3);
      expect(cache.get('key1')).toBe('updated');
    });
  });

  describe('TTL expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return null for expired entry', () => {
      cache.set('key1', 'value1', 1000); // 1 second TTL

      jest.advanceTimersByTime(1500);

      const result = cache.get('key1');
      expect(result).toBeNull();
    });

    it('should return value before expiration', () => {
      cache.set('key1', 'value1', 1000);

      jest.advanceTimersByTime(500);

      const result = cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should use default TTL if provided', () => {
      const cacheWithTTL = new MemoryCache<string>({ defaultTTL: 1000 });
      cacheWithTTL.set('key1', 'value1');

      jest.advanceTimersByTime(1500);

      expect(cacheWithTTL.get('key1')).toBeNull();
    });

    it('should not expire if no TTL set', () => {
      cache.set('key1', 'value1');

      jest.advanceTimersByTime(10000);

      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('remove', () => {
    it('should remove single entry', () => {
      cache.set('key1', 'value1');

      const removed = cache.remove('key1');

      expect(removed).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      const removed = cache.remove('nonexistent');

      expect(removed).toBe(false);
    });

    it('should update size after removal', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.remove('key1');

      expect(cache.size()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
      expect(cache.size()).toBe(0);
    });

    it('should reset statistics', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('missing');

      cache.clear();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      cache.set('key1', 'value1');

      cache.get('key1'); // hit
      cache.get('missing'); // miss
      cache.get('key1'); // hit

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit rate', () => {
      cache.set('key1', 'value1');

      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('missing'); // miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(66.67);
    });

    it('should return 0 hit rate when no access', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should return current size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('key1', 'value1');

      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('missing')).toBe(false);
    });

    it('should return false for expired key', () => {
      jest.useFakeTimers();

      cache.set('key1', 'value1', 1000);
      jest.advanceTimersByTime(1500);

      expect(cache.has('key1')).toBe(false);

      jest.useRealTimers();
    });

    it('should clean up expired entry when checking', () => {
      jest.useFakeTimers();

      cache.set('key1', 'value1', 1000);
      jest.advanceTimersByTime(1500);

      cache.has('key1');

      expect(cache.size()).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('keys', () => {
    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const keys = cache.keys();

      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should return empty array when cache is empty', () => {
      const keys = cache.keys();

      expect(keys).toHaveLength(0);
    });
  });

  describe('size', () => {
    it('should return current cache size', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });

    it('should update after operations', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.remove('key1');
      expect(cache.size()).toBe(1);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle zero maxSize', () => {
      const zeroCache = new MemoryCache<string>({ maxSize: 0 });

      zeroCache.set('key1', 'value1');

      // Should evict immediately
      expect(zeroCache.size()).toBe(1);
    });

    it('should handle large maxSize', () => {
      const largeCache = new MemoryCache<string>({ maxSize: 10000 });

      for (let i = 0; i < 100; i++) {
        largeCache.set(`key${i}`, `value${i}`);
      }

      expect(largeCache.size()).toBe(100);
    });

    it('should handle complex data types', () => {
      const objectCache = new MemoryCache<{ id: number; name: string }>();

      const data = { id: 1, name: 'test' };
      objectCache.set('key1', data);

      const result = objectCache.get('key1');
      expect(result).toEqual(data);
    });
  });
});
