# Design Document: Iconify API + Native Cache

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  <IconifyIcon name="mdi:home" size={24} color="blue" />     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│           API Integration Layer                             │
│  (@react-native-iconify/api)                                │
│  ├─ fetchIconData(name) → Promise<IconData>                 │
│  ├─ Error handling & retry logic                            │
│  └─ Redundancy (multi-host failover)                        │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│           Cache Layer                                       │
│  Memory Cache (LRU) → Turbo Module → Disk Cache             │
│  ├─ Memory: Fast, limited size                              │
│  ├─ Turbo: JSI bridge to native                             │
│  └─ Disk: Persistent (SDWebImage/Glide)                     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│           Native Bridge (Turbo Module)                      │
│  iOS: Swift (SDWebImage wrapper)                            │
│  Android: Kotlin (Glide wrapper)                            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User renders: <IconifyIcon name="mdi:home" />
                        │
                        ▼
            Check memory cache
            ├─ Hit? → Render ✓
            └─ Miss? ▼
            
            Check Turbo cache (disk)
            ├─ Hit? → Load to memory → Render ✓
            └─ Miss? ▼
            
            Fetch from Iconify API
            ├─ Host 1 → Success? ✓
            ├─ Host 2 → Success? ✓
            └─ Host 3 → Success? ✓
            
            Save to:
            ├─ Disk cache (Turbo)
            ├─ Memory cache
            └─ Render
            
            Error handling:
            ├─ Offline? → Use disk cache
            ├─ API fail? → Show fallback
            └─ Retry logic
```

## Package Specifications

### 1. `@react-native-iconify/api`

**Purpose:** Iconify API integration with redundancy

**Key Files:**

```typescript
// src/index.ts - Public API
export { fetchIconData, getIconByName, preloadIcons };
export type { IconData, FetchOptions, IconifyConfig };

// src/fetch.ts - HTTP fetching with redundancy
async function fetchIconData(
  iconName: string,
  options?: FetchOptions
): Promise<IconData>

// src/loader.ts - Icon data parsing and validation
function parseIconData(raw: unknown): IconData

// src/types.ts - Type definitions
interface IconData {
  name: string;
  body: string;
  width: number;
  height: number;
  left?: number;
  top?: number;
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
}
```

**Dependencies:**
- `@iconify/fetch` (Iconify's fetch wrapper with redundancy)
- `@iconify/utils` (Icon parsing utilities)

**Test Strategy:**

```typescript
// tests/fetch.test.ts
- ✅ Fetch from primary host
- ✅ Fallback to secondary host
- ✅ Retry logic on timeout
- ✅ Cache key generation
- ✅ Error handling & recovery

// tests/loader.test.ts
- ✅ Parse valid icon data
- ✅ Validate icon structure
- ✅ Handle invalid data
- ✅ Transform icon format

// tests/integration.test.ts
- ✅ Full flow: API → parsing → return
- ✅ Offline scenario
- ✅ Network error recovery
```

### 2. `@react-native-iconify/turbo-cache`

**Purpose:** Native disk/memory caching via Turbo module

**Architecture:**

```
JS Layer (TypeScript):
├─ Memory cache (LRU)
├─ Turbo module interface
└─ Serialization/deserialization

JSI Bridge:
├─ Native module loading
├─ Exception handling
└─ Type conversion

Native Layer:
├─ iOS: SDWebImage wrapper (Swift)
└─ Android: Glide wrapper (Kotlin)
```

**Key Files:**

```typescript
// src/index.ts - Public API
export { IconifyCache, createCache };
export type { CacheOptions, CacheEntry };

// src/cache.ts - Memory cache implementation
class MemoryCache {
  get(key: string): IconData | null;
  set(key: string, data: IconData, ttl?: number): void;
  remove(key: string): void;
  clear(): void;
}

// src/native.ts - Turbo module bridge
class NativeDiskCache {
  async get(key: string): Promise<IconData | null>;
  async set(key: string, data: IconData, ttl?: number): Promise<void>;
  async remove(key: string): Promise<void>;
  async clear(): Promise<void>;
}

// src/turbo-cache-native.ts - JSI interface
const TurboCacheModule = requireNativeModule('TurboCacheModule');
```

**Test Strategy:**

```typescript
// tests/cache.test.ts
- ✅ Memory cache hit/miss
- ✅ Cache expiration
- ✅ LRU eviction
- ✅ Size limits

// tests/native.test.ts (mock JSI)
- ✅ Disk cache write/read
- ✅ Native module loading
- ✅ Error handling
- ✅ Data serialization

// tests/integration.test.ts
- ✅ Memory → Disk flow
- ✅ Cache invalidation
- ✅ Offline access
- ✅ Performance benchmarks
```

### 3. `@react-native-iconify/api-integration`

**Purpose:** React Native component for dynamic icon rendering

**Key Components:**

```typescript
// src/IconifyIcon.tsx
<IconifyIcon
  name="mdi:home"
  size={24}
  color="blue"
  rotate={90}
  flip="horizontal"
  onLoad={() => console.log('loaded')}
  onError={(error) => console.log(error)}
/>

// src/index.ts
export { IconifyIcon };
export type { IconifyIconProps };
```

**Props:**

```typescript
interface IconifyIconProps {
  name: string;                    // "mdi:home" - icon name
  size?: number;                   // 24 - icon size in pixels
  color?: string;                  // "blue" - icon color
  rotate?: number;                 // 0-360 - rotation degrees
  flip?: 'horizontal' | 'vertical' | 'both';  // flip direction
  style?: StyleProp<ViewStyle>;    // additional styles
  onLoad?: () => void;             // callback when loaded
  onError?: (error: Error) => void; // callback on error
  fallback?: React.ReactNode;      // fallback UI while loading
}
```

**Features:**

- ✅ Dynamic icon loading from API
- ✅ Automatic caching (memory + disk)
- ✅ Offline support (uses cached icons)
- ✅ Error handling with fallback
- ✅ Loading state management
- ✅ Props: size, color, rotate, flip
- ✅ Custom styling support

**Test Strategy:**

```typescript
// tests/component.test.ts
- ✅ Render with valid icon
- ✅ Props applied correctly (size, color, rotate, flip)
- ✅ Load callback fired on success
- ✅ Error callback on failure
- ✅ Show fallback during loading
- ✅ Show fallback on error
- ✅ Cache hit optimization (no refetch)
- ✅ Icon switching
- ✅ Multiple icons rendering
- ✅ Offline scenario (use cache)
```

## Test Infrastructure

### Test Setup

```typescript
// jest.config.js
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
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

### Mock Strategy

```typescript
// tests/mocks/iconify-api.ts
- Mock Iconify API responses
- Simulate network errors
- Control failover behavior

// tests/mocks/turbo-cache.ts
- Mock JSI native module
- Simulate disk cache operations
- Test concurrent access

// tests/mocks/react-native.ts
- Mock React Native components
- Image loading simulation
```

### Coverage Targets

```
@react-native-iconify/api:        100%
  ├─ fetch.ts:                    100%
  ├─ loader.ts:                   100%
  └─ types.ts:                    100%

@react-native-iconify/turbo-cache: 100%
  ├─ cache.ts:                    100%
  ├─ native.ts:                   100%
  └─ turbo-cache-native.ts:       100%

@react-native-iconify/api-integration: 100%
  ├─ IconifyIcon.tsx:             100%
  ├─ hooks.ts:                    100%
  └─ types.ts:                    100%
```

## Implementation Details

### Iconify API Integration

**Redundancy Strategy (from @iconify/fetch):**

```typescript
const hosts = [
  'https://api.iconify.design',
  'https://api.icon.horse',
  'https://icon.horse'
];

async function fetchWithRedundancy(iconName: string) {
  for (const host of hosts) {
    try {
      const data = await fetch(`${host}/${iconName}.json`);
      return data;
    } catch (error) {
      // Try next host
    }
  }
  // All hosts failed
  throw new Error('All API hosts unreachable');
}
```

### Cache Key Generation

```typescript
// Consistent key for caching
function getCacheKey(iconName: string): string {
  return `icon:${iconName}:${CACHE_VERSION}`;
}

// CACHE_VERSION bumped when icon format changes
const CACHE_VERSION = '1';
```

### Memory Cache (LRU)

```typescript
class LRUCache {
  private cache = new Map();
  private maxSize = 1000;  // Max 1000 icons in memory
  private maxAge = 24 * 60 * 60 * 1000;  // 24 hours
  
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check expiry
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }
}
```

### Native Disk Cache

Based on expo-image's battle-tested cache infrastructure analysis, we use the same caching libraries:

#### iOS Implementation (SDWebImage v5.21.0)

**Architecture:**
```swift
import SDWebImage
import ExpoModulesCore

public class TurboCacheModule: Module {
  private static let cacheKeyPrefix = "turbo-cache:"
  private let cache = SDImageCache.shared

  // Expo Modules API async functions
  AsyncFunction("get") { (key: String) -> String? in
    return try await self.getCacheValue(for: key)
  }

  AsyncFunction("set") { (key: String, value: String, ttl: Int?) in
    try await self.setCacheValue(value, for: key, ttl: ttl)
  }
}
```

**Cache Operations:**
```swift
// Get from cache
private func getCacheValue(for key: String) async throws -> String? {
  let cacheKey = createCacheKey(key)

  return try await withCheckedThrowingContinuation { continuation in
    cache.queryCacheOperation(
      forKey: cacheKey,
      cacheType: .disk  // Disk-only (memory not needed for JSON)
    ) { (_, data, cacheType) in
      guard let data = data else {
        continuation.resume(returning: nil)
        return
      }

      if let value = String(data: data, encoding: .utf8) {
        continuation.resume(returning: value)
      } else {
        continuation.resume(throwing: CacheDecodingError())
      }
    }
  }
}

// Set to cache with TTL metadata wrapper
private func setCacheValue(_ value: String, for key: String, ttl: Int?) async throws {
  let cacheKey = createCacheKey(key)

  // Wrap with expiration metadata since SDWebImage doesn't support per-key TTL
  let cacheData = CacheData(
    value: value,
    expiresAt: ttl != nil ? Date().timeIntervalSince1970 + Double(ttl!) / 1000.0 : nil
  )

  let jsonData = try JSONEncoder().encode(cacheData)

  return try await withCheckedThrowingContinuation { continuation in
    cache.storeImageData(
      toDisk: jsonData,
      forKey: cacheKey
    ) {
      continuation.resume()
    }
  }
}

// TTL metadata wrapper
private struct CacheData: Codable {
  let value: String
  let expiresAt: Double?

  var isExpired: Bool {
    guard let expiresAt = expiresAt else { return false }
    return Date().timeIntervalSince1970 > expiresAt
  }
}
```

**Key Features:**
- **Cache Engine**: SDImageCache.shared (same as expo-image)
- **Cache Policy**: Disk-only caching (memory cache not needed for JSON strings)
- **Cache Key Prefix**: `turbo-cache:` to avoid collision with image cache
- **TTL Support**: JSON metadata wrapper with expiration timestamp
- **Thread Safety**: Built-in via SDWebImage's async operations
- **Automatic LRU**: SDWebImage handles eviction automatically

**Dependencies** (via TurboCache.podspec):
```ruby
s.dependency 'ExpoModulesCore'
s.dependency 'SDWebImage', '~> 5.21.0'  # Same as expo-image
```

**SVG Support**: Transparent via SDWebImageSVGCoder (already included in expo-image)

#### Android Implementation (Glide v4.16.0)

**Architecture:**
```kotlin
package com.reactnativeiconify.turbocache

import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.cache.DiskCache
import expo.modules.kotlin.modules.Module
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

class TurboCacheModule : Module() {
  companion object {
    private const val CACHE_KEY_PREFIX = "turbo-cache:"
  }

  private val diskCache: DiskCache
    get() = Glide.get(context).diskCache

  override fun definition() = ModuleDefinition {
    Name("TurboCache")

    AsyncFunction("get") { key: String -> getCacheValue(key) }
    AsyncFunction("set") { key: String, value: String, ttl: Int? ->
      setCacheValue(key, value, ttl)
    }
  }
}
```

**Cache Operations:**
```kotlin
// Get from cache
private suspend fun getCacheValue(key: String): String? = withContext(Dispatchers.IO) {
  val cacheKey = createCacheKey(key)
  val file = diskCache.get(cacheKey) ?: return@withContext null

  val jsonString = file.readText()
  val cacheData = Json.decodeFromString<CacheData>(jsonString)

  // Check expiration
  if (cacheData.isExpired()) {
    diskCache.delete(cacheKey)
    return@withContext null
  }

  cacheData.value
}

// Set to cache with TTL metadata
private suspend fun setCacheValue(
  key: String,
  value: String,
  ttl: Int?
) = withContext(Dispatchers.IO) {
  val cacheKey = createCacheKey(key)

  // Wrap with expiration metadata
  val cacheData = if (ttl != null) {
    CacheData(value, System.currentTimeMillis() + ttl)
  } else {
    CacheData(value, null)
  }

  val jsonString = Json.encodeToString(cacheData)

  diskCache.put(cacheKey, object : DiskCache.Writer {
    override fun write(file: File): Boolean {
      return try {
        file.writeBytes(jsonString.toByteArray())
        true
      } catch (e: Exception) {
        false
      }
    }
  })
}

// Custom cache key for Glide
private fun createCacheKey(key: String): DiskCache.Key {
  return object : DiskCache.Key {
    override fun updateDiskCacheKey(messageDigest: MessageDigest) {
      messageDigest.update((CACHE_KEY_PREFIX + key).toByteArray())
    }
  }
}

// TTL metadata wrapper
@Serializable
private data class CacheData(
  val value: String,
  val expiresAt: Long? = null
) {
  fun isExpired(): Boolean {
    val expiresAt = expiresAt ?: return false
    return System.currentTimeMillis() > expiresAt
  }
}
```

**Key Features:**
- **Cache Engine**: Glide DiskCache (same infrastructure as expo-image)
- **Cache Key Interface**: Custom DiskCache.Key with MessageDigest hashing
- **Cache Key Prefix**: `turbo-cache:` to avoid collision with image cache
- **TTL Support**: Kotlinx Serialization data class with expiration
- **Thread Safety**: Kotlin coroutines with Dispatchers.IO
- **Automatic LRU**: Glide handles eviction automatically

**Dependencies** (via build.gradle):
```gradle
implementation 'com.github.bumptech.glide:glide:4.16.0'  // Same as expo-image
implementation 'org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0'
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3'
```

**SVG Support**:
Transparent via Glide's SVG module (already registered in expo-image):
- `SVGDecoder`: InputStream → SVG (using androidsvg library)
- `SVGDrawableTranscoder`: SVG → Drawable (renders to Picture)

#### Cache Strategy Comparison

| Feature | iOS (SDWebImage) | Android (Glide) |
|---------|------------------|-----------------|
| Memory Cache | ✅ LRU (auto) | ✅ LRU (auto) |
| Disk Cache | ✅ File-based | ✅ File-based |
| SVG Support | ✅ SDWebImageSVGCoder | ✅ Custom decoder/transcoder |
| Cache Key | ✅ String-based | ✅ MessageDigest-based |
| TTL | ✅ JSON wrapper | ✅ Data class wrapper |
| Thread Safety | ✅ async/await | ✅ Coroutines |
| Auto Eviction | ✅ LRU | ✅ LRU |
| Shared with expo-image | ✅ Same SDImageCache | ✅ Same Glide instance |

#### Why Reuse expo-image Infrastructure?

1. **Battle-tested**: Used in production by thousands of apps
2. **Automatic LRU**: No need to implement custom eviction
3. **Thread-safe**: Built-in concurrency handling
4. **SVG Support**: Already configured for vector graphics
5. **Cache Key Separation**: Prefix prevents collision
6. **Zero Extra Dependencies**: Reuses existing libraries

#### Implementation Reference

See detailed analysis: `packages/turbo-cache/EXPO_IMAGE_CACHE_ANALYSIS.md`

## Error Handling & Recovery

### Scenarios

```typescript
// Scenario 1: API unreachable, cache available
→ Return cached data (if not expired)

// Scenario 2: API unreachable, cache expired
→ Return stale cache + show warning

// Scenario 3: API unreachable, no cache
→ Show fallback icon + error message

// Scenario 4: Invalid icon name
→ Show error immediately

// Scenario 5: Network timeout
→ Retry with exponential backoff
```

### Error Recovery

```typescript
interface ErrorRecovery {
  retry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}
```

## Performance Considerations

### Benchmarks

```
Operation                  Target      Measured
─────────────────────────────────────────────────
Memory cache hit           < 1ms       ✓
Disk cache hit            < 10ms      ✓
Network fetch             < 500ms     ✓
Component render          < 50ms      ✓
LRU eviction              < 5ms       ✓
```

### Optimization Strategies

1. **Batch loading:** `useIcons(['mdi:home', 'mdi:settings'])`
2. **Preloading:** Preload critical icons
3. **Lazy loading:** Load on-demand
4. **Cache warming:** Pre-populate cache

## Migration Path

### From Static to API

```typescript
// Before (static generation)
import { Iconify } from '@react-native-iconify/native';
<Iconify name="lucide:home" />  // Must be pre-generated

// After (dynamic API)
import { IconifyIcon } from '@react-native-iconify/api-integration';
<IconifyIcon name="mdi:home" />  // Any icon from Iconify
```

### Hybrid Mode

```typescript
// Critical icons: static (fast, guaranteed)
import { Iconify } from '@react-native-iconify/native';

// Dynamic icons: API (flexible, offline-safe with cache)
import { IconifyIcon } from '@react-native-iconify/api-integration';

function MyApp() {
  return (
    <>
      {/* Critical path */}
      <Iconify name="lucide:home" />
      
      {/* Dynamic icons */}
      <IconifyIcon name="mdi:settings" />
    </>
  );
}
```

## CLI Integration

### New Commands

```bash
# Icon search
yarn iconify search "home" --limit 10

# Cache management
yarn iconify cache:clear
yarn iconify cache:size
yarn iconify cache:stats

# Icon preview
yarn iconify preview "mdi:home" --size 24

# API status
yarn iconify api:status
```

## Rollout Strategy

### Phase 1: Non-breaking
- ✅ Add new packages (no changes to existing)
- ✅ Opt-in API mode
- ✅ Static generation still works

### Phase 2: Deprecation
- ⚠️ Suggest API mode in docs
- ⚠️ Mark static as "legacy"

### Phase 3: Sunset (future)
- ❌ Static mode deprecated (future major version)

## Success Metrics

| Metric | Target | Validation |
|--------|--------|-----------|
| Test coverage | 100% | Coverage report |
| Load time (cached) | < 10ms | Benchmark test |
| Load time (API) | < 500ms | Network test |
| Cache hit rate | > 95% | Cache stats test |
| Offline support | 100% | Offline test |
| API redundancy | Working | Failover test |
| Bundle size | < 150KB | Build output check |
| CLI commands | All working | Integration test |

