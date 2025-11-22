import type { FetchOptions, IconifyAPIResponse, IconifyConfig } from './types';
import { IconifyAPIError } from './types';

/**
 * Default Iconify API configuration
 */
const DEFAULT_CONFIG: IconifyConfig = {
  hosts: [
    'https://api.iconify.design',
    'https://api.simplesvg.com',
    'https://api.unisvg.com'
  ],
  timeout: 5000,
  maxRetries: 3
};

/**
 * Cache version for key generation
 */
const CACHE_VERSION = '1';

/**
 * Generate consistent cache key for an icon
 * @param iconName - Full icon name (e.g., "mdi:home")
 * @returns Cache key string
 */
export function getCacheKey(iconName: string): string {
  return `icon:${iconName}:${CACHE_VERSION}`;
}

/**
 * Parse icon name into prefix and name parts
 * @param iconName - Full icon name (e.g., "mdi:home")
 * @returns Object with prefix and name
 */
function parseIconName(iconName: string): { prefix: string; name: string } {
  const parts = iconName.split(':');
  if (parts.length !== 2) {
    throw new IconifyAPIError(
      `Invalid icon name format: ${iconName}. Expected format: "prefix:name"`,
      'PARSE_ERROR'
    );
  }
  return { prefix: parts[0], name: parts[1] };
}

/**
 * Fetch with timeout support
 * @param url - URL to fetch
 * @param timeout - Timeout in milliseconds
 * @param signal - Optional abort signal
 * @returns Response promise
 */
async function fetchWithTimeout(
  url: string,
  timeout: number,
  signal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: signal || controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new IconifyAPIError('Request timeout', 'TIMEOUT', error);
    }
    throw error;
  }
}

/**
 * Fetch icon data from a single host
 * @param host - API host URL
 * @param prefix - Icon prefix
 * @param iconName - Icon name (without prefix)
 * @param timeout - Request timeout
 * @param signal - Optional abort signal
 * @returns Icon API response
 */
async function fetchFromHost(
  host: string,
  prefix: string,
  iconName: string,
  timeout: number,
  signal?: AbortSignal
): Promise<IconifyAPIResponse> {
  const url = `${host}/${prefix}.json?icons=${iconName}`;

  try {
    const response = await fetchWithTimeout(url, timeout, signal);

    if (!response.ok) {
      if (response.status === 404) {
        throw new IconifyAPIError(
          `Icon prefix not found: ${prefix}`,
          'NOT_FOUND'
        );
      }
      throw new IconifyAPIError(
        `HTTP error ${response.status}: ${response.statusText}`,
        'NETWORK_ERROR'
      );
    }

    const data = await response.json();
    return data as IconifyAPIResponse;
  } catch (error) {
    if (error instanceof IconifyAPIError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new IconifyAPIError(
        'Invalid JSON response from API',
        'INVALID_RESPONSE',
        error
      );
    }
    throw new IconifyAPIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR',
      error
    );
  }
}

/**
 * Fetch icon data from Iconify API with redundancy support
 * @param iconName - Full icon name (e.g., "mdi:home")
 * @param options - Fetch options
 * @returns Icon API response
 */
export async function fetchIconData(
  iconName: string,
  options: FetchOptions = {}
): Promise<IconifyAPIResponse> {
  const { prefix, name } = parseIconName(iconName);

  const config = {
    hosts: options.hosts || DEFAULT_CONFIG.hosts,
    timeout: options.timeout || DEFAULT_CONFIG.timeout,
    maxRetries: options.maxRetries || DEFAULT_CONFIG.maxRetries
  };

  const errors: Error[] = [];

  // Try each host
  for (const host of config.hosts) {
    let retries = 0;

    // Retry logic for current host
    while (retries < config.maxRetries) {
      try {
        const data = await fetchFromHost(
          host,
          prefix,
          name,
          config.timeout,
          options.signal
        );
        return data;
      } catch (error) {
        errors.push(error as Error);

        // Don't retry on certain errors
        if (error instanceof IconifyAPIError) {
          if (error.code === 'NOT_FOUND' || error.code === 'PARSE_ERROR') {
            throw error;
          }
        }

        retries++;

        // Exponential backoff for retries
        if (retries < config.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retries - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  // All hosts and retries failed
  throw new IconifyAPIError(
    `All API hosts unreachable after ${config.maxRetries} retries. Errors: ${errors.map(e => e.message).join('; ')}`,
    'NETWORK_ERROR',
    errors
  );
}
