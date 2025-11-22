/**
 * @react-native-iconify/api
 *
 * Iconify API integration with redundancy support for React Native.
 */

export { fetchIconData, getCacheKey } from './fetch';
export { parseIconData, loadIcon, loadIcons } from './loader';
export type {
  IconData,
  FetchOptions,
  IconifyConfig,
  IconifyAPIResponse
} from './types';
export { IconifyAPIError } from './types';
