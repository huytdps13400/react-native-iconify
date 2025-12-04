#!/usr/bin/env node
/**
 * Copy Bundled Icons Post-Build Script
 *
 * After TypeScript compilation, copy bundled-icons.generated.ts to lib/
 * This ensures bundled icons are available in both development and production builds.
 *
 * Why:
 * - tsconfig.json cannot compile bundled-icons.generated.ts directly (type mismatch)
 * - We need the file in lib/ for npm package distribution
 * - This script converts .ts to .js for Node.js compatibility
 */

const fs = require('fs');
const path = require('path');

function copyBundledIcons() {
  const srcPath = path.join(__dirname, '..', 'src', 'bundled-icons.generated.ts');
  const destPath = path.join(__dirname, '..', 'lib', 'bundled-icons.generated.js');

  // Check if source exists
  if (!fs.existsSync(srcPath)) {
    console.log('[Iconify] No bundled icons found (development mode)');
    // Create empty bundle placeholder
    const emptyBundle = `exports.BUNDLED_ICONS = {};

exports.isBundled = function(name) {
  return name in exports.BUNDLED_ICONS;
};

exports.getBundledIcon = function(name) {
  return exports.BUNDLED_ICONS[name];
};
`;
    fs.writeFileSync(destPath, emptyBundle);
    console.log('[Iconify] Created empty bundled icons placeholder');
    return;
  }

  try {
    // Read source file
    let content = fs.readFileSync(srcPath, 'utf-8');

    // Step 1: Remove auto-generated header comments (everything before export)
    const headerEnd = content.indexOf('export const BUNDLED_ICONS');
    if (headerEnd > 0) {
      content = content.substring(headerEnd);
    }

    // Step 2: Remove import statements
    content = content.replace(/import\s+type\s+\{[\s\S]*?\}\s+from\s+['"][\s\S]*?['"];?\n*/g, '');

    // Step 3: Remove TypeScript type annotations (e.g., ": Record<string, IconData>" or ": boolean")
    content = content.replace(/:\s*(?:Record<[^>]+>|boolean|\([^)]*\)\s*=>\s*[^{]+\{[^}]*\})\s*=/g, ' =');

    // Step 4: Convert exports to CommonJS
    content = content
      .replace(/export const (\w+)\s*=/g, 'exports.$1 =');

    // Write to lib/ as .js file
    fs.writeFileSync(destPath, content);
    console.log('[Iconify] ✅ Copied bundled icons to lib/bundled-icons.generated.js');
  } catch (err) {
    console.warn(
      '[Iconify] Warning: Could not copy bundled icons:',
      err.message
    );
  }
}

// Run copy
copyBundledIcons();

