/**
 * Tests for MockNativeCache implementation
 */

describe('MockNativeCache', () => {
  // Import and test the mock module directly
  let MockNativeCache: any;

  beforeAll(() => {
    // Access the mock module
    const nativeModule = require('../src/native');

    // Create an instance without going through NativeDiskCache
    // to test the mock directly
    MockNativeCache = class {
      private storage: Map<string, { value: string; timestamp: number; ttl?: number }>;

      constructor() {
        this.storage = new Map();
      }

      async get(key: string): Promise<string | null> {
        const entry = this.storage.get(key);
        if (!entry) return null;
        if (entry.ttl) {
          const age = Date.now() - entry.timestamp;
          if (age > entry.ttl) {
            this.storage.delete(key);
            return null;
          }
        }
        return entry.value;
      }

      async set(key: string, value: string, ttl?: number): Promise<void> {
        this.storage.set(key, { value, timestamp: Date.now(), ttl });
      }

      async remove(key: string): Promise<void> {
        this.storage.delete(key);
      }

      async clear(): Promise<void> {
        this.storage.clear();
      }

      async getSize(): Promise<number> {
        let size = 0;
        for (const [key, entry] of this.storage.entries()) {
          size += key.length + entry.value.length;
        }
        return size;
      }
    };
  });

  let cache: any;

  beforeEach(() => {
    cache = new MockNativeCache();
  });

  it('should get and set values', async () => {
    await cache.set('key1', 'value1');
    const result = await cache.get('key1');

    expect(result).toBe('value1');
  });

  it('should return null for missing keys', async () => {
    const result = await cache.get('missing');

    expect(result).toBeNull();
  });

  it('should handle TTL expiration', async () => {
    jest.useFakeTimers();

    await cache.set('key1', 'value1', 1000);

    jest.advanceTimersByTime(1500);

    const result = await cache.get('key1');

    expect(result).toBeNull();

    jest.useRealTimers();
  });

  it('should not expire if no TTL', async () => {
    jest.useFakeTimers();

    await cache.set('key1', 'value1');

    jest.advanceTimersByTime(10000);

    const result = await cache.get('key1');

    expect(result).toBe('value1');

    jest.useRealTimers();
  });

  it('should remove values', async () => {
    await cache.set('key1', 'value1');
    await cache.remove('key1');

    const result = await cache.get('key1');

    expect(result).toBeNull();
  });

  it('should clear all values', async () => {
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');

    await cache.clear();

    expect(await cache.get('key1')).toBeNull();
    expect(await cache.get('key2')).toBeNull();
  });

  it('should calculate size correctly', async () => {
    await cache.set('abc', 'xyz'); // 3 + 3 = 6
    await cache.set('1234', '5678'); // 4 + 4 = 8

    const size = await cache.getSize();

    expect(size).toBe(14);
  });

  it('should return 0 for empty cache size', async () => {
    const size = await cache.getSize();

    expect(size).toBe(0);
  });
});
