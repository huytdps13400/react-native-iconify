#!/usr/bin/env node
/**
 * Icon Scanner
 *
 * Scans codebase for IconifyIcon component usage and extracts icon names from the `name` prop.
 * Only scans files that import IconifyIcon to ensure accuracy.
 */

const fs = require("fs");
const path = require("path");

const CONFIG = {
  scanDirs: [
    "src",
    "app",
    "screens",
    "components",
    "pages",
    "views",
    "modules",
    "features",
    "navigation",
    "layouts",
    "containers",
    "ui",
    "common",
    "shared",
    "lib",
    "constants",
    "config",
    "tabs",
    "modals",
    "overlays",
    "widgets",
    "atoms",
    "molecules",
    "organisms",
    "templates",
    "elements",
    "core",
    "design-system",
    "packages",
  ],
  extensions: [".tsx", ".ts", ".jsx", ".js"],
  ignore: [
    "node_modules",
    ".expo",
    ".git",
    "dist",
    "build",
    "__tests__",
    "__mocks__",
    ".test.",
    ".spec.",
    "coverage",
    ".storybook",
    "storybook",
    "android",
    "ios",
    ".next",
    "out",
    "bundled-icons.generated",
  ],
  componentNames: ["IconifyIcon"],
  importSources: [
    "@huymobile/react-native-iconify",
    "react-native-iconify",
    "../components/IconifyIcon",
    "./IconifyIcon",
  ],
};

function shouldIgnore(filePath) {
  return CONFIG.ignore.some((pattern) => filePath.includes(pattern));
}

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir) || shouldIgnore(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    if (shouldIgnore(filePath)) {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (CONFIG.extensions.some((ext) => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function hasIconifyImport(content) {
  const importPatterns = [
    /import\s+.*IconifyIcon.*from\s+["']@huymobile\/react-native-iconify["']/,
    /import\s+.*IconifyIcon.*from\s+["']react-native-iconify["']/,
    /import\s+\{\s*IconifyIcon\s*\}\s*from/,
    /require\s*\(\s*["']@huymobile\/react-native-iconify["']\s*\)/,
    /require\s*\(\s*["']react-native-iconify["']\s*\)/,
  ];

  return importPatterns.some((pattern) => pattern.test(content));
}

function extractIconNamesFromComponent(content) {
  const iconNames = new Set();

  const componentPatterns = [
    /<IconifyIcon[^>]*\sname\s*=\s*["']([^"']+)["'][^>]*\/?>/g,
    /<IconifyIcon[^>]*\sname\s*=\s*\{["']([^"']+)["']\}[^>]*\/?>/g,
    /<IconifyIcon[^>]*\sname\s*=\s*\{`([^`]+)`\}[^>]*\/?>/g,
  ];

  componentPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const iconName = match[1].trim();
      if (iconName && iconName.includes(":") && !iconName.includes("${")) {
        iconNames.add(iconName.toLowerCase());
      }
    }
  });

  const spreadPatterns = [
    /IconifyIcon[^}]*name\s*:\s*["']([^"']+)["']/g,
    /\{\s*name\s*:\s*["']([a-z0-9-]+:[a-z0-9-]+)["'][^}]*\}[^<]*<IconifyIcon/gi,
  ];

  spreadPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const iconName = match[1].trim();
      if (iconName && iconName.includes(":") && !iconName.includes("${")) {
        iconNames.add(iconName.toLowerCase());
      }
    }
  });

  const arrayPatterns = [
    /const\s+\w*[Ii]cons?\w*\s*=\s*\[([^\]]+)\]/g,
    /\w*[Ii]cons?\w*\s*:\s*\[([^\]]+)\]/g,
  ];

  arrayPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const arrayContent = match[1];
      const stringPattern = /["']([a-z0-9-]+:[a-z0-9-]+)["']/gi;
      let stringMatch;
      while ((stringMatch = stringPattern.exec(arrayContent)) !== null) {
        const iconName = stringMatch[1].trim();
        if (iconName && iconName.includes(":")) {
          iconNames.add(iconName.toLowerCase());
        }
      }
    }
  });

  return Array.from(iconNames);
}

function extractIconNames(content) {
  if (!hasIconifyImport(content)) {
    return [];
  }
  return extractIconNamesFromComponent(content);
}

function scanProject(projectRoot = process.cwd()) {
  const allIcons = new Set();
  let filesScanned = 0;
  let filesWithIcons = 0;
  let filesWithImport = 0;

  console.log("🔍 [Iconify] Scanning for IconifyIcon component usage...\n");

  const scanFile = (file) => {
    filesScanned++;
    const content = fs.readFileSync(file, "utf-8");

    if (!hasIconifyImport(content)) {
      return;
    }

    filesWithImport++;
    const icons = extractIconNamesFromComponent(content);

    if (icons.length > 0) {
      filesWithIcons++;
      icons.forEach((icon) => allIcons.add(icon));

      const relativePath = path.relative(projectRoot, file);
      console.log(`   📄 ${relativePath}: ${icons.length} icon(s)`);
      icons.forEach((icon) => console.log(`      - ${icon}`));
    }
  };

  try {
    const rootFiles = fs.readdirSync(projectRoot);
    rootFiles.forEach((file) => {
      const filePath = path.join(projectRoot, file);
      const stat = fs.statSync(filePath);

      if (
        stat.isFile() &&
        CONFIG.extensions.some((ext) => file.endsWith(ext))
      ) {
        if (!shouldIgnore(filePath)) {
          scanFile(filePath);
        }
      }
    });
  } catch (err) {
    // Ignore errors reading root directory
  }

  CONFIG.scanDirs.forEach((dir) => {
    const dirPath = path.resolve(projectRoot, dir);

    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = getAllFiles(dirPath);
    files.forEach(scanFile);
  });

  const byPrefix = {};
  Array.from(allIcons).forEach((icon) => {
    const [prefix] = icon.split(":");
    if (!byPrefix[prefix]) {
      byPrefix[prefix] = [];
    }
    byPrefix[prefix].push(icon);
  });

  console.log(`\n   📊 Summary:`);
  console.log(`   - Files scanned: ${filesScanned}`);
  console.log(`   - Files with IconifyIcon import: ${filesWithImport}`);
  console.log(`   - Files with icons: ${filesWithIcons}`);
  console.log(`   - Total unique icons: ${allIcons.size}\n`);

  if (allIcons.size > 0) {
    console.log("   Icons by prefix:");
    Object.keys(byPrefix)
      .sort()
      .forEach((prefix) => {
        console.log(`   - ${prefix}: ${byPrefix[prefix].length} icons`);
      });
    console.log("");
  }

  return {
    icons: Array.from(allIcons).sort(),
    byPrefix,
    stats: {
      filesScanned,
      filesWithImport,
      filesWithIcons,
      totalIcons: allIcons.size,
    },
  };
}

module.exports = {
  scanProject,
  extractIconNames,
  extractIconNamesFromComponent,
  hasIconifyImport,
};

if (require.main === module) {
  const result = scanProject();

  if (result.icons.length === 0) {
    console.log("⚠️  No IconifyIcon components found in codebase\n");
    console.log("   Make sure you:");
    console.log(
      '   1. Import IconifyIcon from "@huymobile/react-native-iconify"'
    );
    console.log('   2. Use <IconifyIcon name="prefix:icon-name" /> in JSX\n');
    console.log("   Example:");
    console.log(
      '     import { IconifyIcon } from "@huymobile/react-native-iconify";'
    );
    console.log('     <IconifyIcon name="mdi:home" size={24} />\n');
  } else {
    console.log("✅ Scan complete!\n");
  }

  process.exit(0);
}
