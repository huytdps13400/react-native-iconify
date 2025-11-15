# Expo-Image Cache Mechanism Analysis

## Overview

This document analyzes expo-image's native cache implementation on both iOS (SDWebImage) and Android (Glide), with special attention to SVG format support.

## iOS Implementation (SDWebImage)

### Dependencies (from ExpoImage.podspec)

```ruby
s.dependency 'SDWebImage', '~> 5.21.0'
s.dependency 'SDWebImageSVGCoder', '~> 1.7.0'
s.dependency 'SDWebImageWebPCoder', '~> 0.14.6'
s.dependency 'SDWebImageAVIFCoder', '~> 0.11.0'
```

### Cache Architecture

**File**: `expo-image/ios/ImageLoader.swift`

```swift
lazy var imageManager = SDWebImageManager(
  cache: SDImageCache.shared,
  loader: SDImageLoadersManager.shared
)
```

#### Key Features:

1. **Shared Cache**: Uses `SDImageCache.shared` for automatic disk + memory caching
2. **Async Loading**: Swift async/await pattern with `loadImage(with:context:progress:)`
3. **Cache Policy**: Defaults to `.disk` policy for persistent caching
4. **Context-Based Configuration**: Uses `SDWebImageContext` for per-request settings

### Cache Policy Mapping

**File**: `expo-image/ios/ImageCachePolicy.swift`

```swift
enum ImageCachePolicy: String, Enumerable {
  case none = "none"              // → SDImageCacheType.none
  case disk = "disk"              // → SDImageCacheType.disk
  case memory = "memory"          // → SDImageCacheType.memory
  case memoryAndDisk = "memory-disk" // → SDImageCacheType.all
}
```

### Context Creation

**File**: `expo-image/ios/ImageUtils.swift:161-202`

Important context options:
- `queryCacheType`: Where to query cache (none/disk/memory/all)
- `storeCacheType`: Where to store cache (none/disk/memory/all)
- `cacheKeyFilter`: Custom cache key function
- `imageScaleFactor`: Asset scale for bundled images
- `downloadRequestModifier`: Add custom headers
- `animatedImageClass`: Custom animated image class

### SVG Support

**Dependency**: `SDWebImageSVGCoder` v1.7.0

- Automatically registered with SDWebImage
- Handles `.svg` and `.svgz` files
- Returns `SDImageFormat.SVG` (line 50-51 in ImageUtils.swift)
- Cached like any other format (automatic)

### Format Detection

**File**: `expo-image/ios/ImageUtils.swift:30-59`

```swift
func imageFormatToMediaType(_ format: SDImageFormat) -> String? {
  switch format {
    case .SVG:
      return "image/svg+xml"
    case .webP:
      return "image/webp"
    // ... other formats
  }
}
```

## Android Implementation (Glide)

### Main Glide Module

**File**: `expo-image/android/src/main/java/expo/modules/image/ExpoImageAppGlideModule.kt`

```kotlin
@GlideModule
class ExpoImageAppGlideModule : AppGlideModule() {
  override fun applyOptions(context: Context, builder: GlideBuilder) {
    super.applyOptions(context, builder)
    builder.setLogLevel(Log.ERROR) // or Log.VERBOSE for debug
  }
}
```

### Cache Architecture

Glide provides automatic caching with two layers:
1. **Memory Cache**: LRU cache in RAM (fast, temporary)
2. **Disk Cache**: Persistent storage (slower, survives app restarts)

#### Cache Policy

**File**: `expo-image/android/src/main/java/expo/modules/image/records/CachePolicy.kt`

```kotlin
enum class CachePolicy(val value: String) : Enumerable {
  NONE("none"),                    // No caching
  DISK("disk"),                    // Disk only
  MEMORY("memory"),                // Memory only
  MEMORY_AND_DISK("memory-disk")   // Both layers
}
```

### SVG Support Implementation

**File**: `expo-image/android/src/main/java/expo/modules/image/svg/SVGModule.kt`

```kotlin
@GlideModule
class SVGModule : LibraryGlideModule() {
  override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
    registry
      .append(InputStream::class.java, SVG::class.java, SVGDecoder())
      .register(SVG::class.java, Drawable::class.java, SVGDrawableTranscoder(context))
  }
}
```

#### SVG Pipeline:

```
InputStream → SVGDecoder → SVG → SVGDrawableTranscoder → Drawable
```

### SVGDecoder

**File**: `expo-image/android/src/main/java/expo/modules/image/svg/SVGDecoder.kt`

**Purpose**: Decode InputStream to SVG object

```kotlin
class SVGDecoder : ResourceDecoder<InputStream, SVG> {
  override fun decode(source: InputStream, width: Int, height: Int, options: Options): Resource<SVG>? {
    val svg: SVG = SVG.getFromInputStream(source)

    // Set viewBox if not defined
    if (svg.documentViewBox == null) {
      val documentWidth = svg.documentWidth
      val documentHeight = svg.documentHeight
      if (documentWidth != -1f && documentHeight != -1f) {
        svg.setDocumentViewBox(0f, 0f, documentWidth, documentHeight)
      }
    }

    // Override dimensions
    svg.documentWidth = width.toFloat()
    svg.documentHeight = height.toFloat()

    return SimpleResource(svg)
  }
}
```

**Key Features**:
- Uses `com.caverock.androidsvg.SVG` library
- Auto-sets viewBox from document dimensions
- Scales SVG to target dimensions

### SVGDrawableTranscoder

**File**: `expo-image/android/src/main/java/expo/modules/image/svg/SVGDrawableTranscoder.kt`

**Purpose**: Convert SVG to Android Drawable

```kotlin
class SVGDrawableTranscoder(val context: Context) : ResourceTranscoder<SVG?, Drawable> {
  override fun transcode(toTranscode: Resource<SVG?>, options: Options): Resource<Drawable> {
    val svgData = toTranscode.get()

    // Default to 512x512 if no viewBox
    val intrinsicWidth = svgData.documentViewBox?.width()?.toInt() ?: 512
    val intrinsicHeight = svgData.documentViewBox?.height()?.toInt() ?: 512

    // Apply tint color if specified
    val tintColor = options.get(CustomOptions.tintColor)
    if (tintColor != null) {
      applyTintColor(svgData, tintColor)
    }

    // Render to Picture (vector graphics)
    val picture = SVGPictureDrawable(
      svgData.renderToPicture(),
      intrinsicWidth,
      intrinsicHeight
    )

    return SimpleResource(picture)
  }
}
```

**Key Features**:
- Renders SVG to `Picture` (vector format, not raster)
- Preserves intrinsic dimensions for proper sizing
- Supports tint color customization
- Custom `SVGPictureDrawable` wraps Picture with size metadata

## Cache Key Management

### iOS

**File**: `expo-image/ios/ImageUtils.swift:149-156`

```swift
func createCacheKeyFilter(_ cacheKey: String?) -> SDWebImageCacheKeyFilter? {
  guard let cacheKey = cacheKey else {
    return nil
  }
  return SDWebImageCacheKeyFilter { _ in
    return cacheKey  // Custom cache key
  }
}
```

- Allows custom cache keys for better cache control
- Defaults to source URI if not specified

### Android

Glide uses URL as cache key by default. Custom keys can be set via `signature()` method.

## How Caching Works

### iOS (SDWebImage)

1. **Request**: `imageManager.loadImage(with: url, context: context)`
2. **Memory Check**: Query memory cache first (if enabled)
3. **Disk Check**: Query disk cache if memory miss (if enabled)
4. **Network**: Download if both cache layers miss
5. **Store**: Save to memory and/or disk based on `storeCacheType`
6. **Return**: Deliver image via completion handler

### Android (Glide)

1. **Request**: `Glide.with(context).load(url).into(target)`
2. **Active Resources**: Check currently displayed images
3. **Memory Cache**: Check LRU memory cache
4. **Disk Cache**: Check disk cache
5. **Network**: Download from source
6. **Decode**: Use registered decoders (including SVGDecoder)
7. **Transform**: Apply transformations
8. **Transcode**: Use transcoders (including SVGDrawableTranscoder)
9. **Cache**: Store in memory and disk
10. **Display**: Deliver to target

## Key Takeaways for TurboCacheModule

### iOS Implementation Requirements

1. **Use SDImageCache**: `SDImageCache.shared` for automatic caching
2. **Cache Operations**:
   ```swift
   // Get from cache
   SDImageCache.shared.queryCacheOperation(forKey: key, done: { (image, data, cacheType) in
     // Handle result
   })

   // Store to cache
   SDImageCache.shared.store(image, imageData: data, forKey: key, cacheType: .all)

   // Remove from cache
   SDImageCache.shared.removeImage(forKey: key, cacheType: .all)

   // Clear all cache
   SDImageCache.shared.clearDisk()
   SDImageCache.shared.clearMemory()

   // Get cache size
   SDImageCache.shared.calculateSize { (fileCount, totalSize) in
     // Handle size
   }
   ```

3. **SVG Support**: Automatically supported via `SDWebImageSVGCoder` dependency
4. **TTL Support**: Use `SDImageCacheConfig.shared.maxDiskAge` (in seconds)

### Android Implementation Requirements

1. **Use Glide Cache**: Access via `Glide.get(context).diskCache`
2. **Cache Operations**:
   ```kotlin
   val diskCache = Glide.get(context).diskCache

   // Get from cache
   val file = diskCache.get(key)
   val data = file?.let { it.readBytes() }

   // Store to cache (via Glide request)
   Glide.with(context).downloadOnly().load(url).submit()

   // Remove from cache
   diskCache.delete(key)

   // Clear cache
   diskCache.clear()

   // Get size
   val size = diskCache.currentSizeBytes
   ```

3. **SVG Support**: Register SVGModule (already done in expo-image)
4. **TTL Support**: Use `DiskCacheStrategy` with custom `DataSource.Factory`

## Cache Strategy Comparison

| Feature | iOS (SDWebImage) | Android (Glide) |
|---------|------------------|-----------------|
| Memory Cache | ✅ LRU | ✅ LRU |
| Disk Cache | ✅ File-based | ✅ File-based |
| SVG Support | ✅ Via SDWebImageSVGCoder | ✅ Via custom decoder/transcoder |
| Custom Cache Key | ✅ Via filter | ✅ Via signature |
| TTL | ✅ maxDiskAge | ✅ Custom implementation |
| Cache Size Limit | ✅ maxMemoryCost/maxDiskSize | ✅ maxSizeBytes |
| Automatic Eviction | ✅ LRU | ✅ LRU |
| Thread Safety | ✅ Built-in | ✅ Built-in |

## Implementation Plan for TurboCacheModule

### Option 1: Direct Cache Access (Recommended)

Use SDImageCache (iOS) and Glide DiskCache (Android) directly for storing/retrieving serialized JSON strings.

**Pros**:
- Reuses proven cache infrastructure
- Automatic LRU eviction
- Thread-safe
- Disk + memory layers

**Cons**:
- Limited TTL support (global, not per-key)
- Cache key collision risk with image cache

### Option 2: Separate Cache Implementation

Implement custom disk cache separate from image cache.

**Pros**:
- Per-key TTL support
- No cache key collision
- Full control over cache behavior

**Cons**:
- More code to maintain
- Duplicate cache infrastructure
- Need to implement LRU manually

### Recommended Approach: Option 1 with Prefixed Keys

Use SDImageCache/Glide with key prefix `turbo-cache:` to avoid collisions:

```
turbo-cache:icon:mdi:home
turbo-cache:api:user:123
```

This leverages expo-image's battle-tested cache infrastructure while keeping our cache namespace separate.
