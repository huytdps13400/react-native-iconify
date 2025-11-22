package com.iconify

import android.content.Context
import com.bumptech.glide.Glide
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import org.json.JSONObject
import java.io.File

/**
 * TurboCacheModule - Native disk cache using Glide's cache directory
 *
 * Provides consistent caching behavior with iOS:
 * - iOS: SDWebImage (memory + disk cache)
 * - Android: Glide-managed disk cache + memory management
 *
 * Compatible with both old and new React Native architecture.
 */
@ReactModule(name = TurboCacheModule.NAME)
class TurboCacheModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "TurboCacheModule"
    private const val CACHE_DIR_NAME = "iconify_cache"
  }

  override fun getName(): String = NAME

  private val glide by lazy { Glide.get(reactApplicationContext) }

  // Use Glide's cache directory for consistency with Expo Image
  private val cacheDir: File by lazy {
    val glideCache = File(reactApplicationContext.cacheDir, "image_manager_disk_cache")
    val iconifyCache = File(glideCache, CACHE_DIR_NAME)
    if (!iconifyCache.exists()) {
      iconifyCache.mkdirs()
    }
    iconifyCache
  }

  /**
   * Cache data structure with TTL support
   */
  private data class CacheData(
    val value: String,
    val expiresAt: Long?
  ) {
    fun isExpired(): Boolean {
      return expiresAt != null && System.currentTimeMillis() > expiresAt
    }
  }

  /**
   * Get value from cache
   */
  @ReactMethod
  fun getValue(key: String, promise: Promise) {
    try {
      val file = getCacheFile(key)

      if (!file.exists()) {
        promise.resolve(null)
        return
      }

      val content = file.readText()
      val cacheData = parseCacheData(content)

      // Check if expired
      if (cacheData.isExpired()) {
        file.delete()
        promise.resolve(null)
        return
      }

      promise.resolve(cacheData.value)
    } catch (e: Exception) {
      promise.reject("CACHE_ERROR", "Failed to get cache: ${e.message}", e)
    }
  }

  /**
   * Set value in cache
   */
  @ReactMethod
  fun setValue(key: String, value: String, ttl: Double?, promise: Promise) {
    try {
      val file = getCacheFile(key)

      val expiresAt = if (ttl != null && ttl > 0) {
        System.currentTimeMillis() + ttl.toLong()
      } else {
        null
      }

      val cacheData = CacheData(value, expiresAt)
      val json = serializeCacheData(cacheData)

      file.writeText(json)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("CACHE_ERROR", "Failed to set cache: ${e.message}", e)
    }
  }

  /**
   * Remove value from cache
   */
  @ReactMethod
  fun remove(key: String, promise: Promise) {
    try {
      val file = getCacheFile(key)
      if (file.exists()) {
        file.delete()
      }
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("CACHE_ERROR", "Failed to remove cache: ${e.message}", e)
    }
  }

  /**
   * Clear all cache entries
   */
  @ReactMethod
  fun clear(promise: Promise) {
    try {
      cacheDir.listFiles()?.forEach { it.delete() }
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("CACHE_ERROR", "Failed to clear cache: ${e.message}", e)
    }
  }

  /**
   * Get cache size in bytes
   */
  @ReactMethod
  fun getSize(promise: Promise) {
    try {
      val size = cacheDir.walkTopDown()
        .filter { it.isFile }
        .map { it.length() }
        .sum()
      promise.resolve(size.toDouble())
    } catch (e: Exception) {
      promise.reject("CACHE_ERROR", "Failed to get cache size: ${e.message}", e)
    }
  }

  /**
   * Clear Glide memory cache
   * (Clears all Glide memory, consistent with Expo Image)
   */
  @ReactMethod
  fun clearMemoryCache(promise: Promise) {
    try {
      glide.clearMemory()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("CACHE_ERROR", "Failed to clear memory cache: ${e.message}", e)
    }
  }

  /**
   * Clear Glide disk cache
   * (Must be called on background thread)
   */
  @ReactMethod
  fun clearDiskCache(promise: Promise) {
    try {
      Thread {
        try {
          // Clear Glide's disk cache
          glide.clearDiskCache()
          // Also clear our Iconify cache
          cacheDir.listFiles()?.forEach { it.delete() }
          promise.resolve(true)
        } catch (e: Exception) {
          promise.reject("CACHE_ERROR", "Failed to clear disk cache: ${e.message}", e)
        }
      }.start()
    } catch (e: Exception) {
      promise.reject("CACHE_ERROR", "Failed to clear disk cache: ${e.message}", e)
    }
  }

  /**
   * Helper: Get cache file for key
   */
  private fun getCacheFile(key: String): File {
    val sanitized = sanitizeKey(key)
    return File(cacheDir, sanitized)
  }

  /**
   * Helper: Sanitize cache key to safe filename
   */
  private fun sanitizeKey(key: String): String {
    return key.replace(Regex("[^a-zA-Z0-9-_.]"), "_")
  }

  /**
   * Helper: Serialize cache data to JSON
   */
  private fun serializeCacheData(data: CacheData): String {
    val json = JSONObject()
    json.put("value", data.value)
    json.put("expiresAt", data.expiresAt)
    return json.toString()
  }

  /**
   * Helper: Parse cache data from JSON
   */
  private fun parseCacheData(json: String): CacheData {
    val obj = JSONObject(json)
    val value = obj.getString("value")
    val expiresAt = if (obj.isNull("expiresAt")) null else obj.getLong("expiresAt")
    return CacheData(value, expiresAt)
  }
}
