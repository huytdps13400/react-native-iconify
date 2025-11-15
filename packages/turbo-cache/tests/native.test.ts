import { NativeDiskCache } from '../src/native';
import { CacheError } from '../src/types';
import type { NativeCacheModule } from '../src/types';

describe('@react-native-iconify/turbo-cache - NativeDiskCache', () => {
  let cache: NativeDiskCache<any>;
  let mockModule: jest.Mocked<NativeCacheModule>;

  beforeEach(() => {
    mockModule = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getSize: jest.fn()
    };

    cache = new NativeDiskCache(mockModule);
  });

  describe('get', () => {
    it('should get and deserialize value', async () => {
      const data = { id: 1, name: 'test' };
      mockModule.get.mockResolvedValueOnce(JSON.stringify(data));

      const result = await cache.get('key1');

      expect(result).toEqual(data);
      expect(mockModule.get).toHaveBeenCalledWith('key1');
    });

    it('should return null for missing key', async () => {
      mockModule.get.mockResolvedValueOnce(null);

      const result = await cache.get('missing');

      expect(result).toBeNull();
    });

    it('should throw CacheError on invalid JSON', async () => {
      mockModule.get.mockResolvedValue('invalid json');

      await expect(cache.get('key1')).rejects.toThrow(CacheError);
      await expect(cache.get('key1')).rejects.toThrow('Failed to parse');
    });

    it('should wrap native errors in CacheError', async () => {
      mockModule.get.mockRejectedValue(new Error('Native error'));

      await expect(cache.get('key1')).rejects.toThrow(CacheError);
      await expect(cache.get('key1')).rejects.toThrow('Failed to get from native cache');
    });
  });

  describe('set', () => {
    it('should serialize and set value', async () => {
      const data = { id: 1, name: 'test' };

      await cache.set('key1', data);

      expect(mockModule.set).toHaveBeenCalledWith(
        'key1',
        JSON.stringify(data),
        undefined
      );
    });

    it('should pass TTL to native module', async () => {
      const data = 'test';

      await cache.set('key1', data, 5000);

      expect(mockModule.set).toHaveBeenCalledWith(
        'key1',
        JSON.stringify(data),
        5000
      );
    });

    it('should throw CacheError on serialization failure', async () => {
      const circular: any = {};
      circular.self = circular; // Circular reference

      await expect(cache.set('key1', circular)).rejects.toThrow(CacheError);
      await expect(cache.set('key1', circular)).rejects.toThrow('Failed to serialize');
    });

    it('should wrap native errors in CacheError', async () => {
      mockModule.set.mockRejectedValue(new Error('Storage full'));

      await expect(cache.set('key1', 'data')).rejects.toThrow(CacheError);
      await expect(cache.set('key1', 'data')).rejects.toThrow('Failed to set in native cache');
    });
  });

  describe('remove', () => {
    it('should remove from native cache', async () => {
      await cache.remove('key1');

      expect(mockModule.remove).toHaveBeenCalledWith('key1');
    });

    it('should wrap native errors in CacheError', async () => {
      mockModule.remove.mockRejectedValue(new Error('Native error'));

      await expect(cache.remove('key1')).rejects.toThrow(CacheError);
    });
  });

  describe('clear', () => {
    it('should clear native cache', async () => {
      await cache.clear();

      expect(mockModule.clear).toHaveBeenCalled();
    });

    it('should wrap native errors in CacheError', async () => {
      mockModule.clear.mockRejectedValue(new Error('Clear failed'));

      await expect(cache.clear()).rejects.toThrow(CacheError);
    });
  });

  describe('getSize', () => {
    it('should get cache size from native', async () => {
      mockModule.getSize.mockResolvedValueOnce(1024);

      const size = await cache.getSize();

      expect(size).toBe(1024);
      expect(mockModule.getSize).toHaveBeenCalled();
    });

    it('should wrap native errors in CacheError', async () => {
      mockModule.getSize.mockRejectedValue(new Error('Size check failed'));

      await expect(cache.getSize()).rejects.toThrow(CacheError);
    });
  });

  describe('data integrity', () => {
    it('should preserve data through set/get cycle', async () => {
      const original = { id: 123, name: 'test', nested: { value: true } };

      mockModule.set.mockResolvedValueOnce(undefined);
      mockModule.get.mockResolvedValueOnce(JSON.stringify(original));

      await cache.set('key1', original);
      const retrieved = await cache.get('key1');

      expect(retrieved).toEqual(original);
    });

    it('should handle null values', async () => {
      mockModule.set.mockResolvedValueOnce(undefined);
      mockModule.get.mockResolvedValueOnce(JSON.stringify(null));

      await cache.set('key1', null);
      const result = await cache.get('key1');

      expect(result).toBeNull();
    });

    it('should handle primitive values', async () => {
      const testCases = [
        'string',
        123,
        true,
        false,
        0
      ];

      for (const value of testCases) {
        mockModule.set.mockResolvedValueOnce(undefined);
        mockModule.get.mockResolvedValueOnce(JSON.stringify(value));

        await cache.set('key', value);
        const result = await cache.get('key');

        expect(result).toBe(value);
      }
    });

    it('should handle arrays', async () => {
      const array = [1, 2, 3, { nested: true }];

      mockModule.set.mockResolvedValueOnce(undefined);
      mockModule.get.mockResolvedValueOnce(JSON.stringify(array));

      await cache.set('key1', array);
      const result = await cache.get('key1');

      expect(result).toEqual(array);
    });
  });

  describe('error handling', () => {
    it('should include key in error message', async () => {
      mockModule.get.mockResolvedValueOnce('invalid json');

      try {
        await cache.get('test-key');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CacheError);
        expect((error as CacheError).message).toContain('test-key');
      }
    });

    it('should preserve error details', async () => {
      const originalError = new Error('Original error');
      mockModule.get.mockRejectedValueOnce(originalError);

      try {
        await cache.get('key1');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CacheError);
        expect((error as CacheError).details).toBe(originalError);
      }
    });

    it('should set correct error code for serialization errors', async () => {
      const circular: any = {};
      circular.self = circular;

      try {
        await cache.set('key1', circular);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CacheError);
        expect((error as CacheError).code).toBe('SERIALIZATION_ERROR');
      }
    });

    it('should set correct error code for native errors', async () => {
      mockModule.get.mockRejectedValueOnce(new Error('Native error'));

      try {
        await cache.get('key1');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CacheError);
        expect((error as CacheError).code).toBe('NATIVE_ERROR');
      }
    });
  });
});
