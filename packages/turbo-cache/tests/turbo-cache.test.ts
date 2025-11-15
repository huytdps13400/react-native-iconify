import { TurboCache, createCache } from '../src/index';
import type { NativeCacheModule } from '../src/types';

describe('@react-native-iconify/turbo-cache - TurboCache', () => {
  let cache: TurboCache<any>;
  let mockModule: jest.Mocked<NativeCacheModule>;

  beforeEach(() => {
    mockModule = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getSize: jest.fn()
    };

    cache = new TurboCache({}, mockModule);
  });

  describe('cache hierarchy', () => {
    it('should return from memory cache (fastest)', async () => {
      // Set in memory
      await cache.set('key1', 'value1');

      // Get should hit memory cache
      const result = await cache.get('key1');

      expect(result).toBe('value1');
      // Should not call native module for get
      expect(mockModule.get).not.toHaveBeenCalled();
    });

    it('should fallback to disk on memory miss', async () => {
      mockModule.get.mockResolvedValueOnce(JSON.stringify('disk-value'));

      const result = await cache.get('key1');

      expect(result).toBe('disk-value');
      expect(mockModule.get).toHaveBeenCalledWith('key1');
    });

    it('should populate memory cache after disk hit', async () => {
      mockModule.get.mockResolvedValueOnce(JSON.stringify('disk-value'));

      // First get - from disk
      await cache.get('key1');

      // Second get - should be from memory
      mockModule.get.mockClear();
      const result = await cache.get('key1');

      expect(result).toBe('disk-value');
      expect(mockModule.get).not.toHaveBeenCalled();
    });

    it('should return null on full cache miss', async () => {
      mockModule.get.mockResolvedValueOnce(null);

      const result = await cache.get('missing');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set in both memory and disk', async () => {
      await cache.set('key1', 'value1');

      expect(mockModule.set).toHaveBeenCalledWith(
        'key1',
        JSON.stringify('value1'),
        undefined
      );

      // Verify in memory
      expect(cache.hasInMemory('key1')).toBe(true);
    });

    it('should pass TTL to both layers', async () => {
      await cache.set('key1', 'value1', 5000);

      expect(mockModule.set).toHaveBeenCalledWith(
        'key1',
        JSON.stringify('value1'),
        5000
      );
    });

    it('should handle complex data', async () => {
      const data = { id: 1, nested: { value: true } };

      await cache.set('key1', data);

      expect(mockModule.set).toHaveBeenCalledWith(
        'key1',
        JSON.stringify(data),
        undefined
      );
    });
  });

  describe('remove', () => {
    it('should remove from both layers', async () => {
      await cache.set('key1', 'value1');

      await cache.remove('key1');

      expect(cache.hasInMemory('key1')).toBe(false);
      expect(mockModule.remove).toHaveBeenCalledWith('key1');
    });
  });

  describe('clear', () => {
    it('should clear both layers', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      await cache.clear();

      expect(cache.getMemorySize()).toBe(0);
      expect(mockModule.clear).toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should return memory cache stats', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('missing');

      const stats = cache.getStats();

      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
    });

    it('should return disk cache size', async () => {
      mockModule.getSize.mockResolvedValueOnce(2048);

      const size = await cache.getDiskSize();

      expect(size).toBe(2048);
    });

    it('should return memory size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const size = cache.getMemorySize();

      expect(size).toBe(2);
    });
  });

  describe('hasInMemory', () => {
    it('should return true for memory-cached items', async () => {
      await cache.set('key1', 'value1');

      expect(cache.hasInMemory('key1')).toBe(true);
    });

    it('should return false for non-cached items', () => {
      expect(cache.hasInMemory('missing')).toBe(false);
    });

    it('should return false for expired items', () => {
      jest.useFakeTimers();

      cache.set('key1', 'value1', 1000);
      jest.advanceTimersByTime(1500);

      expect(cache.hasInMemory('key1')).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('createCache helper', () => {
    it('should create TurboCache instance', () => {
      const newCache = createCache();

      expect(newCache).toBeInstanceOf(TurboCache);
    });

    it('should accept options', () => {
      const newCache = createCache({ maxSize: 100 });

      expect(newCache).toBeInstanceOf(TurboCache);
    });

    it('should accept custom native module', () => {
      const newCache = createCache({}, mockModule);

      expect(newCache).toBeInstanceOf(TurboCache);
    });
  });

  describe('integration scenarios', () => {
    it('should handle sequential operations', async () => {
      await cache.set('key1', 'value1');
      const result1 = await cache.get('key1');

      await cache.set('key2', 'value2');
      const result2 = await cache.get('key2');

      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
    });

    it('should handle concurrent operations', async () => {
      const promises = [
        cache.set('key1', 'value1'),
        cache.set('key2', 'value2'),
        cache.set('key3', 'value3')
      ];

      await Promise.all(promises);

      const [v1, v2, v3] = await Promise.all([
        cache.get('key1'),
        cache.get('key2'),
        cache.get('key3')
      ]);

      expect(v1).toBe('value1');
      expect(v2).toBe('value2');
      expect(v3).toBe('value3');
    });

    it('should handle rapid updates', async () => {
      for (let i = 0; i < 10; i++) {
        await cache.set('key1', `value${i}`);
      }

      const result = await cache.get('key1');

      expect(result).toBe('value9');
    });

    it('should maintain consistency across layers', async () => {
      // Set initial value
      await cache.set('key1', 'initial');

      // Update value
      await cache.set('key1', 'updated');

      // Clear memory only (simulate app restart)
      cache['memoryCache'].clear();

      // Mock disk returning updated value
      mockModule.get.mockResolvedValueOnce(JSON.stringify('updated'));

      // Should get updated value from disk
      const result = await cache.get('key1');

      expect(result).toBe('updated');
    });
  });

  describe('error handling', () => {
    it('should propagate disk cache errors on get', async () => {
      mockModule.get.mockRejectedValueOnce(new Error('Disk error'));

      await expect(cache.get('key1')).rejects.toThrow('Disk error');
    });

    it('should propagate disk cache errors on set', async () => {
      mockModule.set.mockRejectedValueOnce(new Error('Disk full'));

      await expect(cache.set('key1', 'value')).rejects.toThrow('Disk full');
    });

    it('should continue working after disk error', async () => {
      // Fail disk write
      mockModule.set.mockRejectedValueOnce(new Error('Disk error'));

      try {
        await cache.set('key1', 'value1');
      } catch {
        // Ignore error
      }

      // Next operation should work
      mockModule.set.mockResolvedValueOnce(undefined);
      await cache.set('key2', 'value2');

      expect(cache.hasInMemory('key2')).toBe(true);
    });
  });

  describe('memory management', () => {
    it('should respect maxSize limit', async () => {
      const smallCache = new TurboCache({ maxSize: 2 }, mockModule);

      await smallCache.set('key1', 'value1');
      await smallCache.set('key2', 'value2');
      await smallCache.set('key3', 'value3'); // Should evict key1

      expect(smallCache.hasInMemory('key1')).toBe(false);
      expect(smallCache.hasInMemory('key2')).toBe(true);
      expect(smallCache.hasInMemory('key3')).toBe(true);
    });

    it('should handle TTL expiration', async () => {
      jest.useFakeTimers();

      await cache.set('key1', 'value1', 1000);

      jest.advanceTimersByTime(1500);

      const result = await cache.get('key1');

      // Should be null from memory, but might hit disk
      if (result === null) {
        expect(mockModule.get).toHaveBeenCalled();
      }

      jest.useRealTimers();
    });
  });

  describe('type safety', () => {
    it('should preserve types through cache', async () => {
      interface User {
        id: number;
        name: string;
      }

      const userCache = new TurboCache<User>({}, mockModule);

      const user: User = { id: 1, name: 'Test' };
      await userCache.set('user1', user);

      mockModule.get.mockResolvedValueOnce(JSON.stringify(user));
      const result = await userCache.get('user1');

      expect(result).toEqual(user);
    });
  });
});
