# @react-native-iconify/turbo-cache

Native disk/memory caching via Turbo module for React Native Iconify.

## Features

- ✅ LRU memory cache (fast, in-memory)
- ✅ Native disk cache (persistent storage)
- ✅ Combined cache with fallback logic
- ✅ TTL (Time-To-Live) support
- ✅ TypeScript support
- ✅ 100% test coverage
- ✅ Automatic eviction on size limits

## Requirements

**IMPORTANT**: This package requires native modules and does **NOT** support Expo Go.

Supported environments:
- ✅ Expo Development Build (`npx expo prebuild && npx expo run:ios/android`)
- ✅ Bare React Native CLI projects
- ❌ Expo Go (not supported)

For Expo Go compatibility, use [@react-native-iconify/native](https://www.npmjs.com/package/@react-native-iconify/native) with static bundling instead.

## Installation

```bash
npm install @react-native-iconify/turbo-cache
# or
yarn add @react-native-iconify/turbo-cache
```

## Usage

### TurboCache (Combined Memory + Disk)

```typescript
import { TurboCache } from '@react-native-iconify/turbo-cache';

// Create cache instance
const cache = new TurboCache({
  maxSize: 1000,      // Max items in memory
  defaultTTL: 86400000 // 24 hours
});

// Set value (saves to both memory and disk)
await cache.set('icon:mdi:home', iconData);

// Get value (memory → disk fallback)
const data = await cache.get('icon:mdi:home');

// Remove value
await cache.remove('icon:mdi:home');

// Clear all
await cache.clear();

// Get statistics
const stats = cache.getStats();
console.log(stats.hitRate); // Cache hit rate %
```

### Memory Cache Only

```typescript
import { MemoryCache } from '@react-native-iconify/turbo-cache';

const memCache = new MemoryCache({
  maxSize: 500,
  defaultTTL: 3600000 // 1 hour
});

memCache.set('key', 'value');
const value = memCache.get('key'); // Synchronous!
```

### Native Disk Cache

```typescript
import { NativeDiskCache } from '@react-native-iconify/turbo-cache';

const diskCache = new NativeDiskCache();

await diskCache.set('key', data, 86400000); // 24h TTL
const data = await diskCache.get('key');
```

## API

### `TurboCache<T>`

Combined cache with memory and disk layers.

#### Methods

- `get(key: string): Promise<T | null>` - Get from cache (memory → disk)
- `set(key: string, data: T, ttl?: number): Promise<void>` - Set in cache
- `remove(key: string): Promise<void>` - Remove from cache
- `clear(): Promise<void>` - Clear all entries
- `getStats(): CacheStats` - Get cache statistics
- `getDiskSize(): Promise<number>` - Get disk cache size in bytes
- `hasInMemory(key: string): boolean` - Check if in memory
- `getMemorySize(): number` - Get memory cache size

### `MemoryCache<T>`

LRU in-memory cache.

#### Methods

- `get(key: string): T | null` - Get from memory (synchronous)
- `set(key: string, data: T, ttl?: number): void` - Set in memory
- `remove(key: string): boolean` - Remove entry
- `clear(): void` - Clear all
- `size(): number` - Get cache size
- `has(key: string): boolean` - Check if key exists
- `keys(): string[]` - Get all keys
- `getStats(): CacheStats` - Get statistics

### `NativeDiskCache<T>`

Native disk cache wrapper.

#### Methods

- `get(key: string): Promise<T | null>` - Get from disk
- `set(key: string, data: T, ttl?: number): Promise<void>` - Set to disk
- `remove(key: string): Promise<void>` - Remove from disk
- `clear(): Promise<void>` - Clear disk cache
- `getSize(): Promise<number>` - Get cache size in bytes

## Types

```typescript
interface CacheOptions {
  maxSize?: number;      // Max items (default: 1000)
  defaultTTL?: number;   // Default TTL in ms
  debug?: boolean;       // Enable debug logging
}

interface CacheStats {
  hits: number;          // Cache hits
  misses: number;        // Cache misses
  size: number;          // Current size
  hitRate: number;       // Hit rate %
}
```

## Cache Strategy

```
User Request
     ↓
Memory Cache (fast, temporary)
     ↓ (miss)
Disk Cache (slower, persistent)
     ↓ (miss)
Fetch from source
     ↓
Save to both caches
```

## LRU Eviction

When cache reaches `maxSize`, the **Least Recently Used** item is evicted:

```typescript
const cache = new MemoryCache({ maxSize: 3 });

cache.set('a', 1); // [a]
cache.set('b', 2); // [a, b]
cache.set('c', 3); // [a, b, c]
cache.get('a');    // Access 'a' → [b, c, a]
cache.set('d', 4); // Evicts 'b' → [c, a, d]
```

## TTL (Time-To-Live)

Entries automatically expire after TTL:

```typescript
// Set with 5 second TTL
cache.set('key', 'value', 5000);

// After 5 seconds, returns null
setTimeout(() => {
  cache.get('key'); // null (expired)
}, 6000);
```

## Error Handling

All errors are instances of `CacheError`:

```typescript
try {
  await cache.get('key');
} catch (error) {
  if (error instanceof CacheError) {
    console.log(error.code); // 'NATIVE_ERROR' | 'SERIALIZATION_ERROR' | etc
    console.log(error.details); // Original error
  }
}
```

## Native Module Implementation

This package includes **native modules** for iOS and Android that use the same battle-tested cache infrastructure as expo-image.

### Architecture

```
JavaScript Layer (TurboCache)
         ↓
TypeScript Wrapper (NativeDiskCache)
         ↓
Native Module (TurboCacheModule)
         ↓
iOS: SDWebImage         Android: Glide
```

### iOS Implementation

**File**: `ios/TurboCacheModule.swift`

- **Cache Engine**: SDWebImage v5.21.0 (same as expo-image)
- **Cache Storage**: `SDImageCache.shared` with automatic LRU eviction
- **Cache Key**: Prefixed with `turbo-cache:` to avoid collision
- **TTL Support**: Stores expiration metadata in cached value
- **Thread Safety**: Built-in via SDWebImage

**Dependencies** (via `TurboCache.podspec`):
```ruby
s.dependency 'ExpoModulesCore'
s.dependency 'SDWebImage', '~> 5.21.0'
```

**Key Features**:
- Async/await Swift API
- Disk-only caching (memory cache not needed for JSON strings)
- JSON encoding for expiration metadata
- Automatic cache size calculation

### Android Implementation

**File**: `android/src/main/java/com/reactnativeiconify/turbocache/TurboCacheModule.kt`

- **Cache Engine**: Glide v4.16.0 (same as expo-image)
- **Cache Storage**: `Glide.get(context).diskCache` with LRU eviction
- **Cache Key**: Prefixed with `turbo-cache:` to avoid collision
- **TTL Support**: Stores expiration metadata using Kotlin Serialization
- **Thread Safety**: Built-in via Glide + Kotlin Coroutines

**Dependencies** (via `android/build.gradle`):
```gradle
implementation 'com.github.bumptech.glide:glide:4.16.0'
implementation 'org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0'
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3'
```

**Key Features**:
- Kotlin coroutines for async operations
- Kotlinx Serialization for JSON encoding
- DiskCache.Key interface for custom cache keys
- Automatic cache size tracking

### Installation

The native modules are automatically linked when you install the package in a React Native project:

```bash
yarn add @react-native-iconify/turbo-cache

# iOS: Install pods
cd ios && pod install

# Android: Gradle sync happens automatically
```

### Cache Key Prefixing

Both iOS and Android implementations prefix cache keys with `turbo-cache:` to prevent collision with image cache:

```typescript
// Your key: "icon:mdi:home"
// Actual cache key: "turbo-cache:icon:mdi:home"
```

This allows sharing the same cache infrastructure (SDWebImage/Glide) between image caching and data caching without conflicts.

### TTL Implementation

Since SDWebImage and Glide don't support per-key TTL natively, we wrap cached values with expiration metadata:

```json
{
  "value": "your cached data",
  "expiresAt": 1704067200000
}
```

The native modules check expiration on `get()` and automatically remove expired entries.

## Development

```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Build
yarn build

# Lint
yarn lint
```

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Memory get | < 1ms | Synchronous, very fast |
| Memory set | < 1ms | Synchronous |
| Disk get | < 10ms | Async, native |
| Disk set | < 20ms | Async, native |
| LRU eviction | < 5ms | Automatic |

## License

MIT
