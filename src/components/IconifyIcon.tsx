// @ts-nocheck
/**
 * IconifyIcon Component
 *
 * Dynamic icon loading from Iconify API with automatic caching
 * Based on Iconify web component architecture
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
} from "react-native";
// Lazy-load SvgXml to avoid Bridgeless mode initialization issues
// import { SvgXml } from "react-native-svg";
import { loadIcon } from "../api";
import { createCache, TurboCache } from "../cache";
import type { IconifyIconProps, IconState } from "./types";
import type { IconData } from "../api/types";

// Lazy-loaded SvgXml component
let SvgXml: any = null;
function getSvgXml() {
  if (!SvgXml) {
    SvgXml = require("react-native-svg").SvgXml;
  }
  return SvgXml;
}

// Import bundled icons (generated at build time for production)
// Try multiple paths for compatibility with different build systems
let BUNDLED_ICONS: Record<string, IconData> = {};
function loadBundledIcons() {
  const possiblePaths = [
    // Path when running from source (development)
    "../bundled-icons.generated",
    // Path after tsc compilation (production, npm package in node_modules)
    "../bundled-icons.generated.js",
  ];

  for (const modulePath of possiblePaths) {
    try {
      const bundled = require(modulePath);
      const icons = bundled.BUNDLED_ICONS || bundled.default?.BUNDLED_ICONS;
      if (icons && Object.keys(icons).length > 0) {
        if (__DEV__) {
          console.log(
            `[Iconify] Loaded ${
              Object.keys(icons).length
            } bundled icons from ${modulePath}`
          );
        }
        return icons;
      }
    } catch (err) {
      // Try next path
    }
  }

  // Bundle not found (development or first build)
  // Icons will be fetched from API
  return {};
}

BUNDLED_ICONS = loadBundledIcons();

// Lazy cache initialization to avoid Hermes freezing during module loading
// The cache is created on first use, not at module load time
let cache: TurboCache<IconData> | null = null;

function getCache(): TurboCache<IconData> {
  if (!cache) {
    cache = createCache<IconData>({
      maxSize: 1000,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
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
  testID,
}: IconifyIconProps) {
  // Check bundled icons SYNCHRONOUSLY for instant rendering
  // This avoids the loading spinner flash for bundled icons
  const bundledIcon = BUNDLED_ICONS[name];

  // Use separate state variables instead of object to avoid Hermes freezing
  // Start with loading=false to avoid flash - we only show loading on cache MISS
  // For bundled icons, we have data immediately
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [iconData, setIconData] = useState<IconData | null>(
    bundledIcon || null
  );
  // Track if we've checked cache yet (to show placeholder instead of nothing)
  const [cacheChecked, setCacheChecked] = useState(!!bundledIcon);

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
        // Don't set loading=true yet - check cache first to avoid flash
        setError(null);

        const startTime = Date.now();
        const cacheKey = getCacheKey(name);

        // Priority 1: Try native cache (SDWebImage/Glide handles memory → disk)
        // Check cache BEFORE showing loading indicator
        const cached = await getCache().get(cacheKey);

        // Mark cache as checked (for render logic)
        if (!cancelled) {
          setCacheChecked(true);
        }

        if (cached && !cancelled) {
          const loadTime = Date.now() - startTime;

          setLoading(false);
          setIconData(cached);
          onLoad?.();
          return;
        }

        // Cache miss - NOW show loading indicator
        if (!cancelled) {
          setLoading(true);
          setIconData(null);
        }

        // Priority 2: Fetch from API
        const fetchedIconData: IconData = await loadIcon(name);
        const fetchTime = Date.now() - startTime;

        // Save to native cache
        await getCache().set(cacheKey, fetchedIconData);

        if (!cancelled) {
          setLoading(false);
          setIconData(fetchedIconData);
          onLoad?.();
        }
      } catch (err) {
        if (!cancelled) {
          const error =
            err instanceof Error ? err : new Error("Failed to load icon");
          console.log(
            `[IconifyIcon] ❌ Error loading "${name}":`,
            error.message
          );
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

    if (flip === "horizontal" || flip === "both") {
      transforms.push({ scaleX: -1 });
    }

    if (flip === "vertical" || flip === "both") {
      transforms.push({ scaleY: -1 });
    }

    if (typeof rotate === "number" && rotate !== 0) {
      transforms.push({ rotate: `${rotate}deg` });
    }

    return transforms.length ? { transform: transforms as any } : undefined;
  }, [flip, rotate]);

  const mergedStyle = mergeStyles(style, transformStyle);

  // While checking cache (before cache result), show placeholder to avoid layout shift
  // This is different from loading - we only show ActivityIndicator on cache MISS
  if (!cacheChecked && !iconData) {
    if (fallback) {
      return <>{fallback}</>;
    }
    // Show empty placeholder with same dimensions (no spinner)
    return (
      <View
        style={[{ width: size, height: size }, style]}
        testID={testID ? `${testID}-checking` : undefined}
      />
    );
  }

  // Show fallback during loading (cache miss, fetching from API)
  if (loading && fallback) {
    return <>{fallback}</>;
  }

  // Show loading indicator only on cache MISS (fetching from API)
  if (loading) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            justifyContent: "center",
            alignItems: "center",
          },
          style,
        ]}
        testID={testID ? `${testID}-loading` : undefined}
      >
        <ActivityIndicator size="small" color={color || "#999"} />
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

  if (color && color !== "currentColor") {
    svgProps.color = color;
  }

  // Get SvgXml component lazily to avoid Bridgeless mode issues
  const SvgXmlComponent = getSvgXml();

  return (
    <View style={[{ width: size, height: size }, mergedStyle]} testID={testID}>
      <SvgXmlComponent {...svgProps} />
    </View>
  );
}
