// @ts-nocheck
/**
 * IconifyIcon Component
 *
 * Dynamic icon loading from Iconify API with automatic caching
 * Based on Iconify web component architecture
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { loadIcon } from '../api';
import { createCache, TurboCache } from '../cache';
import type { IconifyIconProps, IconState } from './types';
import type { IconData } from '../api/types';

// Import bundled icons (generated at build time for production)
let BUNDLED_ICONS: Record<string, IconData> = {};
try {
  // Try to import generated bundle (exists in production builds)
  const bundled = require('../bundled-icons.generated');
  BUNDLED_ICONS = bundled.BUNDLED_ICONS || {};
  if (__DEV__ && Object.keys(BUNDLED_ICONS).length > 0) {
    console.log(`[Iconify] Loaded ${Object.keys(BUNDLED_ICONS).length} bundled icons`);
  }
} catch (err) {
  // Bundle not generated (development mode or first build)
  // Icons will be fetched from API
}

// Lazy cache initialization to avoid Hermes freezing during module loading
// The cache is created on first use, not at module load time
let cache: TurboCache<IconData> | null = null;

function getCache(): TurboCache<IconData> {
  if (!cache) {
    cache = createCache<IconData>({
      maxSize: 1000,
      defaultTTL: 24 * 60 * 60 * 1000 // 24 hours
    });
  }
  return cache;
}

/**
 * Generate cache key for icon
 */
function getCacheKey(iconName: string): string {
  return `icon:${iconName}`;
}

/**
 * Build SVG XML string from icon data
 * Same approach as native package and Iconify web
 */
function buildSvgXml(icon: IconData): string {
  const DEFAULT_SIZE = 16;
  const viewBoxWidth = icon.width ?? DEFAULT_SIZE;
  const viewBoxHeight = icon.height ?? DEFAULT_SIZE;
  const left = icon.left ?? 0;
  const top = icon.top ?? 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${viewBoxWidth} ${viewBoxHeight}">${icon.body}</svg>`;
}

/**
 * Merge styles helper (from native package)
 */
function mergeStyles(
  base: StyleProp<ViewStyle> | undefined,
  extra: ViewStyle | undefined
): StyleProp<ViewStyle> | undefined {
  if (!extra) {
    return base;
  }

  if (!base) {
    return extra;
  }

  if (Array.isArray(base)) {
    return [...base, extra];
  }

  return [base, extra];
}

type Transform = { scaleX?: number; scaleY?: number; rotate?: string };

/**
 * IconifyIcon Component
 *
 * Renders dynamic icons from Iconify API with automatic caching
 *
 * @example
 * <IconifyIcon
 *   name="mdi:home"
 *   size={24}
 *   color="blue"
 *   rotate={90}
 *   flip="horizontal"
 *   onLoad={() => console.log('loaded')}
 * />
 */
export function IconifyIcon({
  name,
  size = 24,
  color,
  rotate = 0,
  flip,
  style,
  onLoad,
  onError,
  fallback,
  testID
}: IconifyIconProps) {
  // Check bundled icons SYNCHRONOUSLY for instant rendering
  // This avoids the loading spinner flash for bundled icons
  const bundledIcon = BUNDLED_ICONS[name];

  // Use separate state variables instead of object to avoid Hermes freezing
  // If icon is bundled, start with loading=false and iconData set
  const [loading, setLoading] = useState(!bundledIcon);
  const [error, setError] = useState<Error | null>(null);
  const [iconData, setIconData] = useState<IconData | null>(bundledIcon || null);

  // Load icon data (only for non-bundled icons)
  useEffect(() => {
    // Skip if already have bundled icon
    if (bundledIcon) {
      if (__DEV__) {
        console.log(`[IconifyIcon] ⚡ BUNDLED HIT for "${name}" (0ms)`);
      }
      onLoad?.();
      return;
    }

    let cancelled = false;

    async function loadIconData() {
      try {
        setLoading(true);
        setError(null);
        setIconData(null);

        const startTime = Date.now();
        const cacheKey = getCacheKey(name);

        // Priority 1: Try native cache (SDWebImage/Glide handles memory → disk)
        const cached = await getCache().get(cacheKey);
        if (cached && !cancelled) {
          const loadTime = Date.now() - startTime;
          console.log(`[IconifyIcon] ✅ Native cache HIT for "${name}" (${loadTime}ms)`);
          setLoading(false);
          setIconData(cached);
          onLoad?.();
          return;
        }

        // Priority 2: Fetch from API
        console.log(`[IconifyIcon] 📡 Fetching "${name}" from API...`);
        const fetchedIconData: IconData = await loadIcon(name);
        const fetchTime = Date.now() - startTime;
        console.log(`[IconifyIcon] ✅ Fetched "${name}" from API (${fetchTime}ms)`);

        // Save to native cache
        await getCache().set(cacheKey, fetchedIconData);
        console.log(`[IconifyIcon] 💾 Cached "${name}" to native storage`);

        if (!cancelled) {
          setLoading(false);
          setIconData(fetchedIconData);
          onLoad?.();
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Failed to load icon');
          console.log(`[IconifyIcon] ❌ Error loading "${name}":`, error.message);
          setLoading(false);
          setError(error);
          onError?.(error);
        }
      }
    }

    loadIconData();

    return () => {
      cancelled = true;
    };
  }, [name, bundledIcon, onLoad, onError]);

  // Build SVG XML when icon data is loaded
  const xml = useMemo(() => {
    if (!iconData) return null;
    return buildSvgXml(iconData);
  }, [iconData]);

  // Calculate transform style (same as native package)
  const transformStyle = useMemo(() => {
    const transforms: Transform[] = [];

    if (flip === 'horizontal' || flip === 'both') {
      transforms.push({ scaleX: -1 });
    }

    if (flip === 'vertical' || flip === 'both') {
      transforms.push({ scaleY: -1 });
    }

    if (typeof rotate === 'number' && rotate !== 0) {
      transforms.push({ rotate: `${rotate}deg` });
    }

    return transforms.length ? { transform: transforms as any } : undefined;
  }, [flip, rotate]);

  const mergedStyle = mergeStyles(style, transformStyle);

  // Show fallback during loading
  if (loading && fallback) {
    return <>{fallback}</>;
  }

  // Show default loading indicator
  if (loading) {
    return (
      <View
        style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}
        testID={testID ? `${testID}-loading` : undefined}
      >
        <ActivityIndicator size="small" color={color || '#999'} />
      </View>
    );
  }

  // Show fallback on error
  if (error && fallback) {
    return <>{fallback}</>;
  }

  // Show error state
  if (error) {
    return (
      <View
        style={[{ width: size, height: size }, style]}
        testID={testID ? `${testID}-error` : undefined}
      />
    );
  }

  // No icon data
  if (!xml) {
    return null;
  }

  // Render with SvgXml (same as native package)
  // Only pass color prop if it's a valid React Native color (not 'currentColor')
  const svgProps: any = {
    xml,
    width: size,
    height: size,
  };

  if (color && color !== 'currentColor') {
    svgProps.color = color;
  }

  return (
    <View style={[{ width: size, height: size }, mergedStyle]} testID={testID}>
      <SvgXml {...svgProps} />
    </View>
  );
}
