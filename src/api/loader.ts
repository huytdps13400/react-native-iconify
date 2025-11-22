import type { IconData, IconifyAPIResponse } from './types';
import { IconifyAPIError } from './types';
import { fetchIconData } from './fetch';

/**
 * Parse and validate icon data from API response
 * @param raw - Raw icon data
 * @param iconName - Full icon name for error messages
 * @returns Validated icon data
 */
export function parseIconData(raw: unknown, iconName?: string): IconData {
  // Type guard
  if (!raw || typeof raw !== 'object') {
    throw new IconifyAPIError(
      `Invalid icon data type${iconName ? ` for ${iconName}` : ''}: expected object, got ${typeof raw}`,
      'PARSE_ERROR'
    );
  }

  const data = raw as Record<string, unknown>;

  // Validate required fields
  if (typeof data.body !== 'string' || !data.body) {
    throw new IconifyAPIError(
      `Missing or invalid "body" field${iconName ? ` for ${iconName}` : ''}`,
      'PARSE_ERROR'
    );
  }

  if (typeof data.width !== 'number' || data.width <= 0) {
    throw new IconifyAPIError(
      `Missing or invalid "width" field${iconName ? ` for ${iconName}` : ''}`,
      'PARSE_ERROR'
    );
  }

  if (typeof data.height !== 'number' || data.height <= 0) {
    throw new IconifyAPIError(
      `Missing or invalid "height" field${iconName ? ` for ${iconName}` : ''}`,
      'PARSE_ERROR'
    );
  }

  // Build icon data with defaults
  const iconData: IconData = {
    name: typeof data.name === 'string' ? data.name : iconName || 'unknown',
    body: data.body,
    width: data.width,
    height: data.height
  };

  // Optional fields
  if (typeof data.left === 'number') {
    iconData.left = data.left;
  }
  if (typeof data.top === 'number') {
    iconData.top = data.top;
  }
  if (typeof data.rotate === 'number') {
    iconData.rotate = data.rotate;
  }
  if (typeof data.hFlip === 'boolean') {
    iconData.hFlip = data.hFlip;
  }
  if (typeof data.vFlip === 'boolean') {
    iconData.vFlip = data.vFlip;
  }

  return iconData;
}

/**
 * Extract icon from API response
 * @param response - Iconify API response
 * @param iconName - Full icon name (e.g., "mdi:home")
 * @returns Icon data
 */
function extractIconFromResponse(
  response: IconifyAPIResponse,
  iconName: string
): IconData {
  const parts = iconName.split(':');
  if (parts.length !== 2) {
    throw new IconifyAPIError(
      `Invalid icon name format: ${iconName}`,
      'PARSE_ERROR'
    );
  }

  const [prefix, name] = parts;

  // Resolve alias if exists
  let resolvedName = name;
  if (response.aliases && response.aliases[name]) {
    const alias = response.aliases[name];
    if (typeof alias === 'object' && alias.parent) {
      resolvedName = alias.parent;
    }
  }

  // Check if icon exists in response
  if (!response.icons || !response.icons[resolvedName]) {
    throw new IconifyAPIError(
      `Icon "${name}" not found in prefix "${prefix}"`,
      'NOT_FOUND'
    );
  }

  const rawIcon = response.icons[resolvedName];

  // Merge with default values from response
  const iconData = {
    name: iconName,
    body: rawIcon.body || '',
    width: rawIcon.width ?? response.width ?? 0,
    height: rawIcon.height ?? response.height ?? 0,
    left: rawIcon.left ?? response.left,
    top: rawIcon.top ?? response.top,
    rotate: rawIcon.rotate ?? response.rotate,
    hFlip: rawIcon.hFlip ?? response.hFlip,
    vFlip: rawIcon.vFlip ?? response.vFlip
  };

  // Validate the merged data
  return parseIconData(iconData, iconName);
}

/**
 * Load a single icon from Iconify API
 * @param iconName - Full icon name (e.g., "mdi:home")
 * @returns Icon data
 */
export async function loadIcon(iconName: string): Promise<IconData> {
  try {
    const response = await fetchIconData(iconName);
    return extractIconFromResponse(response, iconName);
  } catch (error) {
    if (error instanceof IconifyAPIError) {
      throw error;
    }
    throw new IconifyAPIError(
      `Failed to load icon "${iconName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR',
      error
    );
  }
}

/**
 * Load multiple icons from Iconify API
 * @param iconNames - Array of icon names
 * @returns Array of icon data (in same order as input)
 */
export async function loadIcons(iconNames: string[]): Promise<IconData[]> {
  // Group icons by prefix for efficient fetching
  const byPrefix = new Map<string, string[]>();

  for (const name of iconNames) {
    const parts = name.split(':');
    if (parts.length !== 2) {
      throw new IconifyAPIError(
        `Invalid icon name format: ${name}`,
        'PARSE_ERROR'
      );
    }

    const [prefix, iconName] = parts;
    if (!byPrefix.has(prefix)) {
      byPrefix.set(prefix, []);
    }
    byPrefix.get(prefix)!.push(name);
  }

  // Fetch all prefixes in parallel
  const prefixPromises = Array.from(byPrefix.keys()).map(async (prefix) => {
    const response = await fetchIconData(`${prefix}:_`); // Fetch prefix metadata
    return { prefix, response };
  });

  const responses = await Promise.all(prefixPromises);
  const responseMap = new Map(
    responses.map(({ prefix, response }) => [prefix, response])
  );

  // Extract icons in original order
  return iconNames.map((name) => {
    const [prefix] = name.split(':');
    const response = responseMap.get(prefix);

    if (!response) {
      throw new IconifyAPIError(
        `Failed to fetch prefix: ${prefix}`,
        'NETWORK_ERROR'
      );
    }

    return extractIconFromResponse(response, name);
  });
}
