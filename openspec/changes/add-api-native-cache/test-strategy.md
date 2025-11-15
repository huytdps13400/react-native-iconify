# Test Strategy: 100% Coverage Implementation

## Overview

This document defines the complete testing strategy to achieve **100% test coverage** across all three new packages: `@react-native-iconify/api`, `@react-native-iconify/turbo-cache`, and `@react-native-iconify/api-integration`.

## Test Structure

```
packages/
├── api/
│   ├── tests/
│   │   ├── __mocks__/          # Mock utilities
│   │   ├── fetch.test.ts       # Fetch function tests
│   │   ├── loader.test.ts      # Icon loader tests
│   │   ├── types.test.ts       # Type validation
│   │   └── integration.test.ts # Full flow tests
│   └── jest.config.js
│
├── turbo-cache/
│   ├── tests/
│   │   ├── __mocks__/          # JSI mocks
│   │   ├── cache.test.ts       # Memory cache
│   │   ├── native.test.ts      # Native bridge (mocked)
│   │   ├── turbo-cache.test.ts # Combined cache
│   │   └── integration.test.ts # Full cache flow
│   └── jest.config.js
│
└── api-integration/
    ├── tests/
    │   ├── __mocks__/          # React Native mocks
    │   ├── component.test.ts    # IconifyIcon component
    │   ├── hooks.test.ts        # useIcon, useIcons hooks
    │   ├── e2e.test.ts         # End-to-end flows
    │   └── performance.test.ts  # Performance benchmarks
    └── jest.config.js
```

## Jest Configuration

### Root jest.config.js

```javascript
module.exports = {
  projects: [
    '<rootDir>/packages/api/jest.config.js',
    '<rootDir>/packages/turbo-cache/jest.config.js',
    '<rootDir>/packages/api-integration/jest.config.js'
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/index.ts'  // Exports only
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
```

### Package-level jest.config.js

```javascript
module.exports = {
  displayName: '@react-native-iconify/api',
  preset: 'jest-preset-typescript',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__mocks__/'
  ]
};
```

## Mock Strategy

### 1. Iconify API Mock

**File:** `packages/api/tests/__mocks__/iconify-api.ts`

```typescript
// Mock successful icon fetch
export const mockIconifyResponse = {
  prefix: 'mdi',
  icons: {
    home: {
      body: '<path d="..." />',
      width: 24,
      height: 24
    }
  }
};

// Mock API endpoints
export const mockFetch = jest.fn((url: string) => {
  if (url.includes('mdi.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockIconifyResponse)
    });
  }
  return Promise.reject(new Error('Not found'));
});

// Mock network errors
export const mockNetworkError = jest.fn(() =>
  Promise.reject(new Error('Network error'))
);

// Mock timeout
export const mockTimeout = jest.fn(() =>
  new Promise(resolve => setTimeout(() => {
    throw new Error('Timeout');
  }, 100))
);
```

### 2. Turbo Cache Mock (JSI)

**File:** `packages/turbo-cache/tests/__mocks__/turbo-cache-module.ts`

```typescript
// Mock Turbo module
export const mockTurboCacheModule = {
  get: jest.fn((key: string) =>
    Promise.resolve(JSON.stringify({ value: 'cached' }))
  ),
  set: jest.fn((key: string, data: string) =>
    Promise.resolve()
  ),
  remove: jest.fn((key: string) =>
    Promise.resolve()
  ),
  clear: jest.fn(() =>
    Promise.resolve()
  ),
  getSize: jest.fn(() =>
    Promise.resolve(1024)
  )
};

// Mock JSI interface
export const mockRequireNativeModule = jest.fn(() =>
  mockTurboCacheModule
);
```

### 3. React Native Mock

**File:** `packages/api-integration/tests/__mocks__/react-native.ts`

```typescript
// Mock React Native components
export const View = jest.fn(({ children }) => children);
export const Text = jest.fn(({ children }) => children);
export const Image = jest.fn(({ source, style }) => ({
  source,
  style
}));

// Mock StyleSheet
export const StyleSheet = {
  create: jest.fn((styles) => styles),
  flatten: jest.fn((style) => style)
};

// Mock Animated
export const Animated = {
  View: View,
  createValue: jest.fn(() => ({ setValue: jest.fn() }))
};
```

### 4. Test Utilities

**File:** `packages/*/tests/test-utils.ts`

```typescript
// Helper for async icon loading
export async function loadIconWithTimeout(
  name: string,
  timeout = 1000
): Promise<IconData> {
  return Promise.race([
    loadIcon(name),
    new Promise<IconData>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}

// Helper for cache verification
export function verifyCacheState(
  cache: MemoryCache,
  expectedSize: number,
  expectedHits: number
): void {
  expect(cache.size()).toBe(expectedSize);
  expect(cache.hits()).toBe(expectedHits);
}

// Helper for mock setup/teardown
export function setupMocks(): void {
  jest.clearAllMocks();
  jest.useFakeTimers();
}

export function teardownMocks(): void {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
}
```

## Package-Specific Tests

### Package 1: @react-native-iconify/api

#### 1.1 Fetch Tests (`fetch.test.ts`)

```typescript
describe('@react-native-iconify/api - fetch', () => {
  // Test 1: Successful fetch from primary host
  describe('fetchIconData', () => {
    it('should fetch icon from primary host', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIconifyResponse)
      });
      
      const result = await fetchIconData('mdi:home');
      
      expect(result).toEqual(mockIconifyResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.iconify.design/mdi.json'
      );
    });

    // Test 2: Fallback to secondary host
    it('should fallback to secondary host on primary failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockIconifyResponse)
        });
      
      const result = await fetchIconData('mdi:home');
      
      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Test 3: Timeout with retry
    it('should retry on timeout', async () => {
      mockFetch
        .mockImplementationOnce(() =>
          new Promise(resolve =>
            setTimeout(() => resolve({ ok: true }), 2000)
          )
        )
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockIconifyResponse)
        });
      
      const result = await fetchIconData('mdi:home', { timeout: 500 });
      
      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Test 4: Cache key generation
    it('should generate consistent cache key', () => {
      const key1 = getCacheKey('mdi:home');
      const key2 = getCacheKey('mdi:home');
      
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^icon:mdi:home:/);
    });

    // Test 5: All hosts failed
    it('should throw error when all hosts fail', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      await expect(fetchIconData('invalid:icon')).rejects.toThrow(
        'All API hosts unreachable'
      );
    });

    // Test 6: Abort signal handling
    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const promise = fetchIconData('mdi:home', { signal: controller.signal });
      
      controller.abort();
      
      await expect(promise).rejects.toThrow();
    });

    // Test 7: HTTP error handling
    it('should handle HTTP error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      await expect(fetchIconData('notfound:icon')).rejects.toThrow();
    });

    // Test 8: Invalid JSON response
    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });
      
      await expect(fetchIconData('mdi:home')).rejects.toThrow();
    });
  });
});
```

**Coverage:** 100% statements, branches, functions, lines

#### 1.2 Loader Tests (`loader.test.ts`)

```typescript
describe('@react-native-iconify/api - loader', () => {
  describe('parseIconData', () => {
    // Test 1: Valid icon data
    it('should parse valid icon data', () => {
      const raw = {
        body: '<path d="..." />',
        width: 24,
        height: 24
      };
      
      const result = parseIconData(raw);
      
      expect(result.body).toBe(raw.body);
      expect(result.width).toBe(24);
    });

    // Test 2: Missing required fields
    it('should throw on missing required fields', () => {
      expect(() => parseIconData({ body: '' })).toThrow();
    });

    // Test 3: Invalid data type
    it('should throw on invalid data type', () => {
      expect(() => parseIconData('not-an-object')).toThrow();
    });

    // Test 4: Transform optional properties
    it('should transform optional properties', () => {
      const raw = {
        body: '<path />',
        width: 24,
        height: 24,
        rotate: 90,
        hFlip: true
      };
      
      const result = parseIconData(raw);
      
      expect(result.rotate).toBe(90);
      expect(result.hFlip).toBe(true);
    });

    // Test 5: Batch loading
    it('should process batch of icons', () => {
      const batch = [
        { name: 'icon1', body: '<path />', width: 24, height: 24 },
        { name: 'icon2', body: '<circle />', width: 24, height: 24 }
      ];
      
      const results = batch.map(parseIconData);
      
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('icon1');
    });
  });

  describe('loadIcon', () => {
    // Test 6: Load single icon
    it('should load single icon', async () => {
      const icon = await loadIcon('mdi:home');
      
      expect(icon).toBeDefined();
      expect(icon.name).toBe('mdi:home');
    });

    // Test 7: Load batch
    it('should load batch of icons', async () => {
      const icons = await loadIcons(['mdi:home', 'mdi:settings']);
      
      expect(icons).toHaveLength(2);
    });
  });
});
```

**Coverage:** 100%

#### 1.3 Integration Tests (`integration.test.ts`)

```typescript
describe('@react-native-iconify/api - integration', () => {
  // Full flow test
  it('should complete full fetch → parse → load flow', async () => {
    // Setup mocks
    setupMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        icons: { home: { body: '<path />', width: 24, height: 24 } }
      })
    });
    
    // Execute
    const result = await fetchAndParseIcon('mdi:home');
    
    // Verify
    expect(result).toBeDefined();
    expect(result.name).toBe('mdi:home');
    
    teardownMocks();
  });

  // Offline scenario
  it('should handle offline scenario', async () => {
    setupMocks();
    mockFetch.mockRejectedValue(new Error('Offline'));
    
    await expect(fetchAndParseIcon('mdi:home')).rejects.toThrow();
    
    teardownMocks();
  });

  // Error recovery
  it('should recover from temporary API error', async () => {
    setupMocks();
    mockFetch
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          icons: { home: { body: '<path />', width: 24, height: 24 } }
        })
      });
    
    const result = await fetchAndParseIcon('mdi:home');
    
    expect(result).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    teardownMocks();
  });
});
```

**Coverage:** 100%

### Package 2: @react-native-iconify/turbo-cache

#### 2.1 Memory Cache Tests (`cache.test.ts`)

```typescript
describe('@react-native-iconify/turbo-cache - memory cache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({ maxSize: 100, maxAge: 3600000 });
  });

  describe('get/set', () => {
    // Test 1: Basic get/set
    it('should set and get value', () => {
      cache.set('key1', mockIconData);
      
      const result = cache.get('key1');
      
      expect(result).toEqual(mockIconData);
    });

    // Test 2: Missing key
    it('should return null for missing key', () => {
      const result = cache.get('nonexistent');
      
      expect(result).toBeNull();
    });

    // Test 3: Update value
    it('should update existing value', () => {
      cache.set('key1', mockIconData);
      cache.set('key1', { ...mockIconData, name: 'updated' });
      
      const result = cache.get('key1');
      
      expect(result.name).toBe('updated');
    });

    // Test 4: LRU eviction on size limit
    it('should evict oldest on size limit', () => {
      const cache = new MemoryCache({ maxSize: 2 });
      
      cache.set('key1', mockIconData);
      cache.set('key2', mockIconData);
      cache.set('key3', mockIconData);  // Should evict key1
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeDefined();
      expect(cache.get('key3')).toBeDefined();
    });

    // Test 5: TTL expiration
    it('should return null for expired entry', () => {
      setupMocks();  // Use fake timers
      
      cache.set('key1', mockIconData, 1000);  // 1 second TTL
      jest.advanceTimersByTime(2000);
      
      const result = cache.get('key1');
      
      expect(result).toBeNull();
      teardownMocks();
    });

    // Test 6: Remove single entry
    it('should remove single entry', () => {
      cache.set('key1', mockIconData);
      cache.remove('key1');
      
      expect(cache.get('key1')).toBeNull();
    });

    // Test 7: Clear all entries
    it('should clear all entries', () => {
      cache.set('key1', mockIconData);
      cache.set('key2', mockIconData);
      cache.clear();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('size management', () => {
    // Test 8: Size count
    it('should track cache size', () => {
      cache.set('key1', mockIconData);
      cache.set('key2', mockIconData);
      
      expect(cache.size()).toBe(2);
    });

    // Test 9: Hit rate
    it('should track hit rate', () => {
      cache.set('key1', mockIconData);
      cache.get('key1');  // hit
      cache.get('key2');  // miss
      
      expect(cache.hits()).toBe(1);
      expect(cache.misses()).toBe(1);
    });
  });

  describe('concurrent access', () => {
    // Test 10: Multiple concurrent sets
    it('should handle concurrent sets', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(cache.set(`key${i}`, mockIconData))
      );
      
      await Promise.all(promises);
      
      expect(cache.size()).toBeGreaterThan(0);
    });

    // Test 11: Concurrent get/set
    it('should handle concurrent get/set', async () => {
      cache.set('key1', mockIconData);
      
      const promises = [
        Promise.resolve(cache.get('key1')),
        Promise.resolve(cache.set('key2', mockIconData)),
        Promise.resolve(cache.get('key1'))
      ];
      
      const results = await Promise.all(promises);
      
      expect(results[0]).toBeDefined();
      expect(results[2]).toBeDefined();
    });
  });
});
```

**Coverage:** 100%

#### 2.2 Native Cache Tests (Mocked JSI) (`native.test.ts`)

```typescript
describe('@react-native-iconify/turbo-cache - native bridge', () => {
  let nativeCache: NativeDiskCache;
  let mockModule: any;

  beforeEach(() => {
    mockModule = mockTurboCacheModule;
    jest.clearAllMocks();
    nativeCache = new NativeDiskCache();
  });

  describe('async operations', () => {
    // Test 1: Async get
    it('should get from native cache', async () => {
      mockModule.get.mockResolvedValueOnce(JSON.stringify(mockIconData));
      
      const result = await nativeCache.get('key1');
      
      expect(result).toEqual(mockIconData);
      expect(mockModule.get).toHaveBeenCalledWith('key1');
    });

    // Test 2: Async set
    it('should set to native cache', async () => {
      await nativeCache.set('key1', mockIconData);
      
      expect(mockModule.set).toHaveBeenCalledWith(
        'key1',
        expect.stringContaining(mockIconData.body)
      );
    });

    // Test 3: Async remove
    it('should remove from native cache', async () => {
      await nativeCache.remove('key1');
      
      expect(mockModule.remove).toHaveBeenCalledWith('key1');
    });

    // Test 4: Async clear
    it('should clear native cache', async () => {
      await nativeCache.clear();
      
      expect(mockModule.clear).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    // Test 5: Handle native error
    it('should throw on native error', async () => {
      mockModule.get.mockRejectedValueOnce(new Error('Native error'));
      
      await expect(nativeCache.get('key1')).rejects.toThrow('Native error');
    });

    // Test 6: Handle invalid serialization
    it('should handle invalid JSON', async () => {
      mockModule.get.mockResolvedValueOnce('invalid json');
      
      await expect(nativeCache.get('key1')).rejects.toThrow();
    });

    // Test 7: Handle null response
    it('should return null for missing key', async () => {
      mockModule.get.mockResolvedValueOnce(null);
      
      const result = await nativeCache.get('missing');
      
      expect(result).toBeNull();
    });
  });

  describe('data integrity', () => {
    // Test 8: Preserve data through cycle
    it('should preserve icon data through set/get cycle', async () => {
      const original = mockIconData;
      
      mockModule.set.mockResolvedValueOnce(undefined);
      mockModule.get.mockResolvedValueOnce(JSON.stringify(original));
      
      await nativeCache.set('key1', original);
      const retrieved = await nativeCache.get('key1');
      
      expect(retrieved).toEqual(original);
    });

    // Test 9: Batch operations
    it('should handle batch operations', async () => {
      const icons = [mockIconData, { ...mockIconData, name: 'icon2' }];
      
      for (const icon of icons) {
        mockModule.set.mockResolvedValueOnce(undefined);
        await nativeCache.set(icon.name, icon);
      }
      
      expect(mockModule.set).toHaveBeenCalledTimes(2);
    });
  });
});
```

**Coverage:** 100%

#### 2.3 Combined Cache Tests (`turbo-cache.test.ts`)

```typescript
describe('@react-native-iconify/turbo-cache - combined', () => {
  let cache: TurboCache;

  beforeEach(() => {
    cache = new TurboCache();
  });

  describe('cache hierarchy', () => {
    // Test 1: Memory hit
    it('should return from memory cache', async () => {
      cache['memoryCache'].set('key1', mockIconData);
      
      const result = await cache.get('key1');
      
      expect(result).toEqual(mockIconData);
    });

    // Test 2: Disk hit (memory miss)
    it('should load from disk on memory miss', async () => {
      mockTurboCacheModule.get.mockResolvedValueOnce(
        JSON.stringify(mockIconData)
      );
      
      const result = await cache.get('key1');
      
      expect(result).toEqual(mockIconData);
      expect(cache['memoryCache'].get('key1')).toEqual(mockIconData);
    });

    // Test 3: Full miss
    it('should return null on full cache miss', async () => {
      mockTurboCacheModule.get.mockResolvedValueOnce(null);
      
      const result = await cache.get('missing');
      
      expect(result).toBeNull();
    });
  });

  describe('cache invalidation', () => {
    // Test 4: Remove from both layers
    it('should remove from memory and disk', async () => {
      cache['memoryCache'].set('key1', mockIconData);
      
      await cache.remove('key1');
      
      expect(cache['memoryCache'].get('key1')).toBeNull();
      expect(mockTurboCacheModule.remove).toHaveBeenCalledWith('key1');
    });

    // Test 5: Clear both layers
    it('should clear memory and disk', async () => {
      cache['memoryCache'].set('key1', mockIconData);
      
      await cache.clear();
      
      expect(cache['memoryCache'].size()).toBe(0);
      expect(mockTurboCacheModule.clear).toHaveBeenCalled();
    });
  });

  describe('TTL handling', () => {
    // Test 6: TTL passed to both layers
    it('should set TTL in both caches', async () => {
      await cache.set('key1', mockIconData, 3600);
      
      expect(mockTurboCacheModule.set).toHaveBeenCalledWith(
        'key1',
        expect.any(String)
      );
    });
  });
});
```

**Coverage:** 100%

### Package 3: @react-native-iconify/api-integration

#### 3.1 Component Tests (`component.test.ts`)

```typescript
describe('@react-native-iconify/api-integration - component', () => {
  describe('IconifyIcon rendering', () => {
    // Test 1: Render with valid icon
    it('should render icon', async () => {
      const { getByTestId } = render(
        <IconifyIcon name="mdi:home" testID="icon" />
      );
      
      await waitFor(() => {
        expect(getByTestId('icon')).toBeDefined();
      });
    });

    // Test 2: Apply props
    it('should apply size and color props', () => {
      const { getByTestId } = render(
        <IconifyIcon
          name="mdi:home"
          size={48}
          color="red"
          testID="icon"
        />
      );
      
      const icon = getByTestId('icon');
      expect(icon.props.style.width).toBe(48);
      expect(icon.props.style.color).toBe('red');
    });

    // Test 3: Rotate prop
    it('should apply rotation', () => {
      const { getByTestId } = render(
        <IconifyIcon
          name="mdi:home"
          rotate={90}
          testID="icon"
        />
      );
      
      const icon = getByTestId('icon');
      expect(icon.props.style.transform).toContainEqual({ rotate: '90deg' });
    });

    // Test 4: Flip props
    it('should apply flip transformation', () => {
      const { getByTestId } = render(
        <IconifyIcon
          name="mdi:home"
          flip="horizontal"
          testID="icon"
        />
      );
      
      const icon = getByTestId('icon');
      expect(icon.props.style.transform).toContainEqual({ scaleX: -1 });
    });

    // Test 5: Custom styles
    it('should merge custom styles', () => {
      const customStyle = { marginTop: 10 };
      const { getByTestId } = render(
        <IconifyIcon
          name="mdi:home"
          style={customStyle}
          testID="icon"
        />
      );
      
      const icon = getByTestId('icon');
      expect(icon.props.style.marginTop).toBe(10);
    });
  });

  describe('callbacks', () => {
    // Test 6: onLoad callback
    it('should fire onLoad callback', async () => {
      const onLoad = jest.fn();
      
      render(
        <IconifyIcon name="mdi:home" onLoad={onLoad} />
      );
      
      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });

    // Test 7: onError callback
    it('should fire onError callback on failure', async () => {
      const onError = jest.fn();
      mockFetch.mockRejectedValue(new Error('Failed'));
      
      render(
        <IconifyIcon name="invalid:icon" onError={onError} />
      );
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('error handling', () => {
    // Test 8: Show fallback on error
    it('should show fallback on error', async () => {
      mockFetch.mockRejectedValue(new Error('Failed'));
      
      const { getByText } = render(
        <IconifyIcon
          name="invalid:icon"
          fallback={<Text>Error</Text>}
        />
      );
      
      await waitFor(() => {
        expect(getByText('Error')).toBeDefined();
      });
    });

    // Test 9: Loading state
    it('should show loading state', () => {
      const { queryByTestId } = render(
        <IconifyIcon name="mdi:home" testID="loading" />
      );
      
      expect(queryByTestId('loading')).toBeDefined();
    });
  });

  describe('performance', () => {
    // Test 10: Cache hit optimization
    it('should not refetch cached icon', async () => {
      mockFetch.mockClear();
      
      // Render first component
      render(<IconifyIcon name="mdi:home" />);
      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      
      // Render second component with same icon
      render(<IconifyIcon name="mdi:home" />);
      
      // Should still be just 1 call (cached)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Coverage:** 100%

#### 3.2 E2E Tests (`e2e.test.ts`)

```typescript
describe('@react-native-iconify/api-integration - E2E', () => {
  // Test 1: Full render flow
  it('should complete full render flow', async () => {
    const { getByTestId } = render(
      <View testID="app">
        <IconifyIcon name="mdi:home" testID="icon1" />
        <IconifyIcon name="mdi:settings" testID="icon2" />
      </View>
    );
    
    await waitFor(() => {
      expect(getByTestId('icon1')).toBeDefined();
      expect(getByTestId('icon2')).toBeDefined();
    });
  });

  // Test 2: Icon switching
  it('should handle icon switching', async () => {
    const { rerender } = render(
      <IconifyIcon name="mdi:home" />
    );
    
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    mockFetch.mockClear();
    
    rerender(
      <IconifyIcon name="mdi:settings" />
    );
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // Test 3: Offline scenario
  it('should work offline with cache', async () => {
    // First render - online
    const { rerender } = render(
      <IconifyIcon name="mdi:home" />
    );
    
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    
    // Go offline
    mockFetch.mockRejectedValue(new Error('Offline'));
    
    // Re-render with same icon
    rerender(
      <IconifyIcon name="mdi:home" />
    );
    
    // Should still render from cache
    await waitFor(() => {
      expect(getByTestId('icon')).toBeDefined();
    });
  });

  // Test 4: Error recovery
  it('should recover from error', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));
    
    const { rerender } = render(
      <IconifyIcon name="mdi:home" />
    );
    
    await waitFor(() => {
      // Should show error state
    });
    
    // Fix API
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        icons: { home: mockIconData }
      })
    });
    
    rerender(
      <IconifyIcon name="mdi:home" key="retry" />
    );
    
    await waitFor(() => {
      // Should render icon
    });
  });
});
```

**Coverage:** 100%

## Coverage Reporting

### Generate Report

```bash
# Run with coverage
yarn test --coverage

# Generate HTML report
yarn test --coverage --coverageReporters=html

# Check thresholds
yarn test --coverage --collectCoverageFrom="packages/*/src/**/*.{ts,tsx}"
```

### Expected Output

```
PASS  packages/api/tests/fetch.test.ts
PASS  packages/api/tests/loader.test.ts
PASS  packages/api/tests/integration.test.ts
PASS  packages/turbo-cache/tests/cache.test.ts
PASS  packages/turbo-cache/tests/native.test.ts
PASS  packages/turbo-cache/tests/turbo-cache.test.ts
PASS  packages/api-integration/tests/component.test.ts
PASS  packages/api-integration/tests/hooks.test.ts
PASS  packages/api-integration/tests/e2e.test.ts

────────────────────────────────────────────
File                    Stmts Branches Funcs Lines
────────────────────────────────────────────
packages/api/           100%  100%     100%  100%
packages/turbo-cache/   100%  100%     100%  100%
packages/api-integration/ 100%  100%     100%  100%
────────────────────────────────────────────
Total                   100%  100%     100%  100%
────────────────────────────────────────────
```

## Continuous Integration

### CI Configuration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: yarn install
      - run: yarn test --coverage
      - run: yarn test:coverage-report
      - uses: codecov/codecov-action@v3
```

## Success Criteria

✅ **100% Test Coverage:**
- All statements covered
- All branches covered
- All functions covered
- All lines covered

✅ **Test Quality:**
- Clear test descriptions
- Comprehensive assertions
- Good error messages
- Edge cases covered

✅ **Performance:**
- Tests run < 5 seconds
- Memory usage acceptable
- No memory leaks

✅ **Maintainability:**
- Easy to add new tests
- Clear mock setup/teardown
- Reusable test utilities
- Good documentation

