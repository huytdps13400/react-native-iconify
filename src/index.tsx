/**
 * react-native-iconify
 * Load Iconify icons dynamically with native caching
 */

// Main component
export { IconifyIcon } from './components/IconifyIcon';
export type { IconifyIconProps } from './components/types';

// API utilities
export {
  fetchIconData,
  getCacheKey,
  parseIconData,
  loadIcon,
  loadIcons
} from './api';
export type {
  IconData,
  FetchOptions,
  IconifyConfig,
  IconifyAPIResponse
} from './api/types';
export { IconifyAPIError } from './api/types';

// Cache utilities
export { TurboCache, createCache, NativeDiskCache } from './cache';
export type { CacheOptions, NativeCacheModule } from './cache/types';
export { CacheError } from './cache/types';
