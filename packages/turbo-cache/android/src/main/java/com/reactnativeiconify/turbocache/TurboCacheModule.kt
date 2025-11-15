// Copyright 2025-present React Native Iconify. All rights reserved.

package com.reactnativeiconify.turbocache

import android.content.Context
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.cache.DiskCache
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

/**
 * TurboCacheModule provides native disk caching using Glide's DiskCache.
 *
 * This module uses Glide's disk cache for persistent caching with automatic LRU eviction.
 * Cache keys are prefixed with "turbo-cache:" to avoid collision with image cache.
 *
 * Based on expo-image's Glide implementation.
 */
class TurboCacheModule : Module() {
  companion object {
    private const val CACHE_KEY_PREFIX = "turbo-cache:"
  }

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is not available")

  private val diskCache: DiskCache
    get() = Glide.get(context).diskCache

  override fun definition() = ModuleDefinition {
    Name("TurboCache")

    // Get value from cache
    AsyncFunction("get") { key: String ->
      getCacheValue(key)
    }

    // Set value to cache with optional TTL
    AsyncFunction("set") { key: String, value: String, ttl: Int? ->
      setCacheValue(key, value, ttl)
    }

    // Remove value from cache
    AsyncFunction("remove") { key: String ->
      removeCacheValue(key)
    }

    // Clear all cache
    AsyncFunction("clear") {
      clearAllCache()
    }

    // Get cache size in bytes
    AsyncFunction("getSize") {
      getCacheSize()
    }

    // Clear memory cache (matching expo-image pattern)
    AsyncFunction("clearMemoryCache") {
      clearMemoryCache()
    }

    // Clear disk cache (matching expo-image pattern)
    AsyncFunction("clearDiskCache") {
      clearDiskCache()
    }
  }

  /**
   * Creates a cache key with prefix to avoid collision with image cache.
   */
  private fun createCacheKey(key: String): DiskCache.Key {
    return object : DiskCache.Key {
      override fun updateDiskCacheKey(messageDigest: java.security.MessageDigest) {
        messageDigest.update((CACHE_KEY_PREFIX + key).toByteArray())
      }
    }
  }

  /**
   * Get value from cache.
   * Returns null if key doesn't exist or data is corrupted/expired.
   */
  private suspend fun getCacheValue(key: String): String? = withContext(Dispatchers.IO) {
    try {
      val cacheKey = createCacheKey(key)
      val file = diskCache.get(cacheKey) ?: return@withContext null

      val jsonString = file.readText()
      val cacheData = Json.decodeFromString<CacheData>(jsonString)

      // Check if expired
      if (cacheData.isExpired()) {
        diskCache.delete(cacheKey)
        return@withContext null
      }

      cacheData.value
    } catch (e: Exception) {
      throw CacheException("Failed to get from cache: ${e.message}", e)
    }
  }

  /**
   * Set value to cache with optional TTL (in milliseconds).
   */
  private suspend fun setCacheValue(key: String, value: String, ttl: Int?) = withContext(Dispatchers.IO) {
    try {
      val cacheKey = createCacheKey(key)

      // Wrap value with expiration timestamp if TTL is provided
      val cacheData = if (ttl != null) {
        val expiresAt = System.currentTimeMillis() + ttl
        CacheData(value, expiresAt)
      } else {
        CacheData(value, null)
      }

      // Encode to JSON
      val jsonString = Json.encodeToString(cacheData)
      val bytes = jsonString.toByteArray()

      // Write to disk cache
      diskCache.put(cacheKey, object : DiskCache.Writer {
        override fun write(file: File): Boolean {
          return try {
            file.writeBytes(bytes)
            true
          } catch (e: Exception) {
            false
          }
        }
      })
    } catch (e: Exception) {
      throw CacheException("Failed to set to cache: ${e.message}", e)
    }
  }

  /**
   * Remove value from cache.
   */
  private suspend fun removeCacheValue(key: String) = withContext(Dispatchers.IO) {
    try {
      val cacheKey = createCacheKey(key)
      diskCache.delete(cacheKey)
    } catch (e: Exception) {
      throw CacheException("Failed to remove from cache: ${e.message}", e)
    }
  }

  /**
   * Clear all cache entries.
   * Note: This clears ALL disk cache, not just turbo-cache entries.
   */
  private suspend fun clearAllCache() = withContext(Dispatchers.IO) {
    try {
      diskCache.clear()
    } catch (e: Exception) {
      throw CacheException("Failed to clear cache: ${e.message}", e)
    }
  }

  /**
   * Get total cache size in bytes.
   */
  private suspend fun getCacheSize(): Long = withContext(Dispatchers.IO) {
    try {
      diskCache.currentSizeBytes
    } catch (e: Exception) {
      throw CacheException("Failed to get cache size: ${e.message}", e)
    }
  }

  /**
   * Clear memory cache (matching expo-image pattern).
   */
  private fun clearMemoryCache(): Boolean {
    try {
      Glide.get(context).clearMemory()
      return true
    } catch (e: Exception) {
      throw CacheException("Failed to clear memory cache: ${e.message}", e)
    }
  }

  /**
   * Clear disk cache (matching expo-image pattern).
   */
  private suspend fun clearDiskCache(): Boolean = withContext(Dispatchers.IO) {
    try {
      Glide.get(context).clearDiskCache()
      true
    } catch (e: Exception) {
      throw CacheException("Failed to clear disk cache: ${e.message}", e)
    }
  }
}

/**
 * Wrapper for cached data with expiration support.
 */
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

/**
 * Custom exception for cache operations.
 */
private class CacheException(message: String, cause: Throwable? = null) : Exception(message, cause)
