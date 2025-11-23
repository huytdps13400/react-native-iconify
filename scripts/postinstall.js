#!/usr/bin/env node
/**
 * Post-install Script
 *
 * Automatically configures user's project after installing react-native-iconify:
 * 1. Adds .gitignore entries for cache and generated files
 * 2. Creates initial empty bundle (optional)
 * 3. Shows welcome message with usage instructions
 */

const fs = require('fs');
const path = require('path');

const GITIGNORE_ENTRIES = `
# Iconify Icon Library
.iconify-cache/              # Local icon fetch cache
src/bundled-icons.generated.ts  # Auto-generated icon bundle
`;

/**
 * Add entries to .gitignore
 */
function setupGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');

  try {
    let content = '';

    // Read existing .gitignore
    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf-8');

      // Check if already configured
      if (content.includes('.iconify-cache')) {
        return false; // Already configured
      }
    }

    // Append entries
    content += GITIGNORE_ENTRIES;
    fs.writeFileSync(gitignorePath, content);

    return true;
  } catch (err) {
    console.warn('[Iconify] Warning: Could not update .gitignore');
    return false;
  }
}

/**
 * Show welcome message
 */
function showWelcome() {
  console.log('');
  console.log('🎨 Thanks for installing @huymobile/react-native-iconify!');
  console.log('');
  console.log('📚 Quick Start:');
  console.log('  import { IconifyIcon } from \'@huymobile/react-native-iconify\';');
  console.log('  <IconifyIcon name="mdi:home" size={24} />');
  console.log('');
  console.log('⚡ Auto-bundling: Icons are automatically bundled during');
  console.log('   production builds (APK/IPA) - zero configuration needed!');
  console.log('');
  console.log('🔍 Icon Search: https://icon-sets.iconify.design/');
  console.log('');
}

/**
 * Main postinstall function
 */
function postinstall() {
  // Skip if installing in library's own directory
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    if (packageJson.name === '@huymobile/react-native-iconify') {
      // Installing in library itself, skip postinstall
      return;
    }
  }

  // Setup .gitignore
  const gitignoreUpdated = setupGitignore();

  if (gitignoreUpdated) {
    console.log('✅ [Iconify] Added entries to .gitignore');
  }

  // Show welcome message
  showWelcome();
}

// Run postinstall
try {
  postinstall();
} catch (err) {
  console.error('[Iconify] Postinstall error:', err.message);
  // Don't fail installation
}
