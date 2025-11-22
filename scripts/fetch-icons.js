#!/usr/bin/env node
/**
 * Icon Fetcher with Caching
 *
 * Fetches icon data from Iconify API and caches locally.
 * Uses cache to speed up subsequent builds.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CACHE_DIR = path.join(process.cwd(), '.iconify-cache');
const CACHE_MANIFEST = path.join(CACHE_DIR, 'manifest.json');
const API_BASE = 'https://api.iconify.design';

// API hosts for redundancy
const API_HOSTS = [
  'https://api.iconify.design',
  'https://api.simplesvg.com',
  'https://api.unisvg.com',
];

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Load cache manifest
 */
function loadCacheManifest() {
  if (!fs.existsSync(CACHE_MANIFEST)) {
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      icons: {},
    };
  }

  try {
    return JSON.parse(fs.readFileSync(CACHE_MANIFEST, 'utf-8'));
  } catch (err) {
    console.warn('⚠️  [Iconify] Failed to load cache manifest, creating new one');
    return { version: '1.0', createdAt: new Date().toISOString(), icons: {} };
  }
}

/**
 * Save cache manifest
 */
function saveCacheManifest(manifest) {
  ensureCacheDir();
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(CACHE_MANIFEST, JSON.stringify(manifest, null, 2));
}

/**
 * Get cache file path for icon
 */
function getCacheFilePath(iconName) {
  const safeName = iconName.replace(':', '-');
  return path.join(CACHE_DIR, `${safeName}.json`);
}

/**
 * Get icon from cache
 */
function getFromCache(iconName) {
  const filePath = getCacheFilePath(iconName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.warn(`⚠️  [Iconify] Failed to read cache for ${iconName}`);
    return null;
  }
}

/**
 * Save icon to cache
 */
function saveToCache(iconName, iconData) {
  ensureCacheDir();
  const filePath = getCacheFilePath(iconName);
  fs.writeFileSync(filePath, JSON.stringify(iconData, null, 2));
}

/**
 * Fetch icon from Iconify API
 */
async function fetchFromAPI(iconName, hostIndex = 0) {
  const [prefix, name] = iconName.split(':');

  if (!prefix || !name) {
    throw new Error(`Invalid icon name: ${iconName}`);
  }

  const host = API_HOSTS[hostIndex] || API_HOSTS[0];
  const url = `${host}/${prefix}.json?icons=${name}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          let iconData = json.icons?.[name];

          // Handle aliases (e.g., mdi:settings -> mdi:cog)
          if (!iconData && json.aliases?.[name]) {
            const alias = json.aliases[name];
            const parentName = alias.parent;
            iconData = json.icons?.[parentName];

            if (iconData) {
              // Merge alias properties with parent icon
              iconData = {
                ...iconData,
                ...alias,
                body: iconData.body, // Always use parent's body
              };
            }
          }

          if (!iconData) {
            // Try next host if available
            if (hostIndex < API_HOSTS.length - 1) {
              console.log(`   Retrying ${iconName} on different host...`);
              fetchFromAPI(iconName, hostIndex + 1).then(resolve).catch(reject);
              return;
            }
            reject(new Error(`Icon "${iconName}" not found`));
            return;
          }

          resolve({
            body: iconData.body,
            width: iconData.width || json.width || 24,
            height: iconData.height || json.height || 24,
            left: iconData.left || 0,
            top: iconData.top || 0,
          });
        } catch (err) {
          reject(new Error(`Failed to parse response for ${iconName}: ${err.message}`));
        }
      });
    }).on('error', (err) => {
      // Try next host if available
      if (hostIndex < API_HOSTS.length - 1) {
        console.log(`   Retrying ${iconName} on different host...`);
        fetchFromAPI(iconName, hostIndex + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Fetch icons with caching
 */
async function fetchIcons(iconNames, options = {}) {
  const {
    useCache = true,
    onProgress = null,
  } = options;

  ensureCacheDir();

  const manifest = loadCacheManifest();
  const results = {};
  const toFetch = [];

  // Check cache first
  if (useCache) {
    iconNames.forEach(iconName => {
      const cached = getFromCache(iconName);
      if (cached) {
        results[iconName] = cached;
      } else {
        toFetch.push(iconName);
      }
    });

    if (toFetch.length < iconNames.length) {
      console.log(`   Cache hit: ${iconNames.length - toFetch.length}/${iconNames.length} icons`);
    }
  } else {
    toFetch.push(...iconNames);
  }

  // Fetch missing icons
  if (toFetch.length > 0) {
    console.log(`   Fetching ${toFetch.length} icons from API...`);

    let fetched = 0;
    let failed = 0;

    for (const iconName of toFetch) {
      try {
        if (onProgress) {
          onProgress({ current: fetched + failed + 1, total: toFetch.length, iconName });
        }

        // Small delay to avoid rate limiting
        if (fetched + failed > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const iconData = await fetchFromAPI(iconName);
        results[iconName] = iconData;

        // Save to cache
        saveToCache(iconName, iconData);
        manifest.icons[iconName] = {
          fetchedAt: new Date().toISOString(),
        };

        fetched++;
      } catch (err) {
        console.error(`   ❌ Failed to fetch ${iconName}: ${err.message}`);
        failed++;
      }
    }

    // Save manifest
    saveCacheManifest(manifest);

    console.log(`   ✅ Fetched ${fetched} icons successfully`);
    if (failed > 0) {
      console.log(`   ❌ Failed to fetch ${failed} icons`);
    }
  }

  return results;
}

/**
 * Clear cache
 */
function clearCache() {
  if (fs.existsSync(CACHE_DIR)) {
    fs.rmSync(CACHE_DIR, { recursive: true, force: true });
    console.log('✅ [Iconify] Cache cleared');
  }
}

// Export for use in other scripts
module.exports = {
  fetchIcons,
  fetchFromAPI,
  getFromCache,
  clearCache,
  CACHE_DIR,
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'clear') {
    clearCache();
  } else if (args.length > 0) {
    fetchIcons(args).then(() => {
      console.log('\n✅ Done!');
    }).catch(err => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
  } else {
    console.log('Usage:');
    console.log('  node fetch-icons.js <icon1> <icon2> ...');
    console.log('  node fetch-icons.js clear');
  }
}
