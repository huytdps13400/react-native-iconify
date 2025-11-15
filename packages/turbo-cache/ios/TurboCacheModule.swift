// Copyright 2025-present React Native Iconify. All rights reserved.

import SDWebImage
import ExpoModulesCore

/**
 * TurboCacheModule provides native disk caching using SDWebImage's SDImageCache.
 *
 * This module uses SDImageCache.shared for persistent caching with automatic LRU eviction.
 * Cache keys are prefixed with "turbo-cache:" to avoid collision with image cache.
 *
 * Based on expo-image's ImageLoader implementation.
 */
public class TurboCacheModule: Module {
  // MARK: - Constants

  private static let cacheKeyPrefix = "turbo-cache:"
  private let cache = SDImageCache.shared

  // MARK: - Module Definition

  public func definition() -> ModuleDefinition {
    Name("TurboCache")

    // Get value from cache
    AsyncFunction("get") { (key: String) -> String? in
      return try await self.getCacheValue(for: key)
    }

    // Set value to cache with optional TTL
    AsyncFunction("set") { (key: String, value: String, ttl: Int?) in
      try await self.setCacheValue(value, for: key, ttl: ttl)
    }

    // Remove value from cache
    AsyncFunction("remove") { (key: String) in
      try await self.removeCacheValue(for: key)
    }

    // Clear all cache
    AsyncFunction("clear") {
      try await self.clearAllCache()
    }

    // Get cache size in bytes
    AsyncFunction("getSize") { () -> Int in
      return try await self.getCacheSize()
    }

    // Clear memory cache (matching expo-image pattern)
    AsyncFunction("clearMemoryCache") { () -> Bool in
      self.cache.clearMemory()
      return true
    }

    // Clear disk cache (matching expo-image pattern)
    AsyncFunction("clearDiskCache") { () -> Bool in
      return try await self.clearDiskCache()
    }
  }

  // MARK: - Private Methods

  /**
   * Creates a cache key with prefix to avoid collision with image cache.
   */
  private func createCacheKey(_ key: String) -> String {
    return Self.cacheKeyPrefix + key
  }

  /**
   * Get value from cache.
   * Returns nil if key doesn't exist or data is corrupted.
   */
  private func getCacheValue(for key: String) async throws -> String? {
    let cacheKey = createCacheKey(key)

    return try await withCheckedThrowingContinuation { continuation in
      // Query cache for data (disk only, memory cache not needed for string data)
      cache.queryCacheOperation(
        forKey: cacheKey,
        context: nil,
        cacheType: .disk
      ) { (_, data, cacheType) in
        guard let data = data else {
          continuation.resume(returning: nil)
          return
        }

        // Convert data to string
        if let value = String(data: data, encoding: .utf8) {
          continuation.resume(returning: value)
        } else {
          continuation.resume(
            throwing: CacheDecodingError(message: "Failed to decode cached data for key: \(key)")
          )
        }
      }
    }
  }

  /**
   * Set value to cache with optional TTL.
   * Note: SDWebImage doesn't support per-key TTL, only global maxDiskAge.
   * For TTL support, we store expiration metadata in the value itself.
   */
  private func setCacheValue(_ value: String, for key: String, ttl: Int?) async throws {
    let cacheKey = createCacheKey(key)

    // Wrap value with expiration timestamp if TTL is provided
    let cacheData: CacheData
    if let ttl = ttl {
      let expiresAt = Date().timeIntervalSince1970 + Double(ttl) / 1000.0
      cacheData = CacheData(value: value, expiresAt: expiresAt)
    } else {
      cacheData = CacheData(value: value, expiresAt: nil)
    }

    // Encode to JSON
    guard let jsonData = try? JSONEncoder().encode(cacheData),
          let jsonString = String(data: jsonData, encoding: .utf8),
          let data = jsonString.data(using: .utf8) else {
      throw CacheEncodingError(message: "Failed to encode value for key: \(key)")
    }

    return try await withCheckedThrowingContinuation { continuation in
      // Store to disk cache only
      cache.store(
        nil,
        imageData: data,
        forKey: cacheKey,
        cacheType: .disk
      ) {
        continuation.resume()
      }
    }
  }

  /**
   * Remove value from cache.
   */
  private func removeCacheValue(for key: String) async throws {
    let cacheKey = createCacheKey(key)

    return try await withCheckedThrowingContinuation { continuation in
      cache.removeImage(
        forKey: cacheKey,
        cacheType: .disk
      ) {
        continuation.resume()
      }
    }
  }

  /**
   * Clear all cache entries with our prefix.
   * Note: This clears ALL disk cache, not just turbo-cache entries.
   * For selective clearing, we'd need to track keys separately.
   */
  private func clearAllCache() async throws {
    return try await withCheckedThrowingContinuation { continuation in
      // Clear disk cache only (memory cache not used)
      cache.clearDisk {
        continuation.resume()
      }
    }
  }

  /**
   * Get total cache size in bytes.
   */
  private func getCacheSize() async throws -> Int {
    return try await withCheckedThrowingContinuation { continuation in
      cache.calculateSize { (fileCount, totalSize) in
        continuation.resume(returning: Int(totalSize))
      }
    }
  }

  /**
   * Clear disk cache (matching expo-image pattern).
   */
  private func clearDiskCache() async throws -> Bool {
    return try await withCheckedThrowingContinuation { continuation in
      cache.clearDisk {
        continuation.resume(returning: true)
      }
    }
  }
}

// MARK: - Helper Types

/**
 * Wrapper for cached data with expiration support.
 */
private struct CacheData: Codable {
  let value: String
  let expiresAt: Double?

  var isExpired: Bool {
    guard let expiresAt = expiresAt else {
      return false
    }
    return Date().timeIntervalSince1970 > expiresAt
  }
}

// MARK: - Errors

private class CacheEncodingError: Exception {
  let message: String

  init(message: String) {
    self.message = message
    super.init()
  }

  override var reason: String {
    return message
  }
}

private class CacheDecodingError: Exception {
  let message: String

  init(message: String) {
    self.message = message
    super.init()
  }

  override var reason: String {
    return message
  }
}
