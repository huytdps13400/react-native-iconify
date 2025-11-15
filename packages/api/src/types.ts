/**
 * Icon data structure from Iconify API
 */
export interface IconData {
  /** Icon name (e.g., "mdi:home") */
  name: string;
  /** SVG body content */
  body: string;
  /** Icon width */
  width: number;
  /** Icon height */
  height: number;
  /** Left offset */
  left?: number;
  /** Top offset */
  top?: number;
  /** Rotation in degrees */
  rotate?: number;
  /** Horizontal flip */
  hFlip?: boolean;
  /** Vertical flip */
  vFlip?: boolean;
}

/**
 * Options for fetching icon data
 */
export interface FetchOptions {
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Custom API hosts (overrides defaults) */
  hosts?: string[];
}

/**
 * Iconify API configuration
 */
export interface IconifyConfig {
  /** API hosts in priority order */
  hosts: string[];
  /** Default timeout for requests */
  timeout: number;
  /** Maximum retries on failure */
  maxRetries: number;
}

/**
 * Raw icon data from Iconify API response
 */
export interface IconifyAPIResponse {
  prefix: string;
  icons: Record<string, Partial<IconData>>;
  aliases?: Record<string, { parent: string } | string>;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
}

/**
 * Error types for API operations
 */
export class IconifyAPIError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'NOT_FOUND' | 'PARSE_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'IconifyAPIError';
  }
}
