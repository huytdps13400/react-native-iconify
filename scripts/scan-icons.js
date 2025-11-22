#!/usr/bin/env node
/**
 * Icon Scanner
 *
 * Scans codebase for IconifyIcon usage and extracts all icon names.
 * Used during production builds to determine which icons to bundle.
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // Directories to scan (relative to project root)
  scanDirs: [
    'src',
    'app',
    'screens',
    'components',
    'pages',
  ],

  // File extensions to scan
  extensions: ['.tsx', '.ts', '.jsx', '.js'],

  // Patterns to ignore
  ignore: [
    'node_modules',
    '.expo',
    '.git',
    'dist',
    'build',
    '__tests__',
    '.test.',
    '.spec.',
  ],
};

/**
 * Check if path should be ignored
 */
function shouldIgnore(filePath) {
  return CONFIG.ignore.some(pattern => filePath.includes(pattern));
}

/**
 * Recursively get all files in directory
 */
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir) || shouldIgnore(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);

    if (shouldIgnore(filePath)) {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (CONFIG.extensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract icon names from file content
 *
 * Matches patterns like:
 * - JSX props: name="mdi:home", name='mdi:home', name={"mdi:home"}, name={'mdi:home'}, name={`mdi:home`}
 * - Object properties: name: "mdi:home", name: 'mdi:home'
 * - Array/object values: ["mdi:home"], ['mdi:home']
 */
function extractIconNames(content) {
  const iconNames = new Set();

  // Pattern for icon names (prefix:name format)
  const patterns = [
    // JSX prop patterns
    /name=["']([a-z0-9-]+:[a-z0-9-]+)["']/gi,
    /name=\{["']([a-z0-9-]+:[a-z0-9-]+)["']\}/gi,
    /name=\{`([a-z0-9-]+:[a-z0-9-]+)`\}/gi,
    // Object property patterns (name: "icon-name")
    /name:\s*["']([a-z0-9-]+:[a-z0-9-]+)["']/gi,
    // Generic string patterns (catch any iconify format in strings)
    /["']([a-z0-9-]+:[a-z0-9-]+)["']/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      iconNames.add(match[1]);
    }
  });

  return Array.from(iconNames);
}

/**
 * Scan project and return all icon names
 */
function scanProject(projectRoot = process.cwd()) {
  const allIcons = new Set();
  let filesScanned = 0;
  let filesWithIcons = 0;

  console.log('🔍 [Iconify] Scanning for icon usage...\n');

  // Helper to scan a file
  const scanFile = (file) => {
    filesScanned++;
    const content = fs.readFileSync(file, 'utf-8');
    const icons = extractIconNames(content);

    if (icons.length > 0) {
      filesWithIcons++;
      icons.forEach(icon => allIcons.add(icon));
    }
  };

  // First, scan root-level files
  try {
    const rootFiles = fs.readdirSync(projectRoot);
    rootFiles.forEach(file => {
      const filePath = path.join(projectRoot, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile() && CONFIG.extensions.some(ext => file.endsWith(ext))) {
        if (!shouldIgnore(filePath)) {
          scanFile(filePath);
        }
      }
    });
  } catch (err) {
    // Ignore errors reading root directory
  }

  // Then scan each configured directory
  CONFIG.scanDirs.forEach(dir => {
    const dirPath = path.resolve(projectRoot, dir);

    if (!fs.existsSync(dirPath)) {
      return; // Skip non-existent directories
    }

    const files = getAllFiles(dirPath);
    files.forEach(scanFile);
  });

  // Group by prefix for summary
  const byPrefix = {};
  Array.from(allIcons).forEach(icon => {
    const [prefix] = icon.split(':');
    if (!byPrefix[prefix]) {
      byPrefix[prefix] = [];
    }
    byPrefix[prefix].push(icon);
  });

  // Log summary
  console.log(`   Scanned ${filesScanned} files`);
  console.log(`   Found icons in ${filesWithIcons} files`);
  console.log(`   Total unique icons: ${allIcons.size}\n`);

  if (allIcons.size > 0) {
    console.log('   Icons by prefix:');
    Object.keys(byPrefix).sort().forEach(prefix => {
      console.log(`   - ${prefix}: ${byPrefix[prefix].length} icons`);
    });
    console.log('');
  }

  return {
    icons: Array.from(allIcons).sort(),
    byPrefix,
    stats: {
      filesScanned,
      filesWithIcons,
      totalIcons: allIcons.size,
    },
  };
}

// Export for use in other scripts
module.exports = {
  scanProject,
  extractIconNames,
};

// CLI usage
if (require.main === module) {
  const result = scanProject();

  if (result.icons.length === 0) {
    console.log('⚠️  No icons found in codebase');
    console.log('   Make sure you are using IconifyIcon components with name prop\n');
  } else {
    console.log('✅ Scan complete!\n');
  }

  process.exit(0);
}
