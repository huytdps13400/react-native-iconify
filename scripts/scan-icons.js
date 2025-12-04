#!/usr/bin/env node
/**
 * Icon Scanner
 *
 * Scans codebase for IconifyIcon usage and extracts all icon names.
 * Used during production builds to determine which icons to bundle.
 */

const fs = require("fs");
const path = require("path");

const VALID_ICONIFY_PREFIXES = [
  "mdi",
  "mdi-light",
  "ic",
  "ph",
  "ri",
  "carbon",
  "tabler",
  "lucide",
  "heroicons",
  "heroicons-outline",
  "heroicons-solid",
  "fa",
  "fa-solid",
  "fa-regular",
  "fa-brands",
  "fa6-solid",
  "fa6-regular",
  "fa6-brands",
  "bi",
  "bx",
  "bxs",
  "bxl",
  "feather",
  "ion",
  "octicon",
  "ant-design",
  "simple-icons",
  "logos",
  "fluent",
  "fluent-emoji",
  "fluent-emoji-flat",
  "fluent-emoji-high-contrast",
  "twemoji",
  "noto",
  "noto-v1",
  "emojione",
  "emojione-v1",
  "emojione-monotone",
  "openmoji",
  "fxemoji",
  "clarity",
  "akar-icons",
  "uil",
  "uiw",
  "majesticons",
  "zondicons",
  "bytesize",
  "ei",
  "eva",
  "prime",
  "teenyicons",
  "codicon",
  "pepicons",
  "pepicons-pop",
  "pepicons-print",
  "iconoir",
  "iconamoon",
  "basil",
  "circum",
  "pixelarticons",
  "system-uicons",
  "radix-icons",
  "mingcute",
  "solar",
  "hugeicons",
  "streamline",
  "streamline-emojis",
  "streamline-plump",
  "eos-icons",
  "material-symbols",
  "material-symbols-light",
  "ic-baseline",
  "ic-outline",
  "ic-round",
  "ic-sharp",
  "ic-twotone",
  "jam",
  "gridicons",
  "mi",
  "quill",
  "gala",
  "healthicons",
  "medical-icon",
  "covid",
  "la",
  "dashicons",
  "flat-color-icons",
  "entypo",
  "entypo-social",
  "foundation",
  "raphael",
  "icons8",
  "wpf",
  "iwwa",
  "typcn",
  "subway",
  "icomoon-free",
  "fontisto",
  "ps",
  "cil",
  "gg",
  "file-icons",
  "vscode-icons",
  "devicon",
  "devicon-plain",
  "skill-icons",
  "catppuccin",
  "line-md",
  "svg-spinners",
  "meteocons",
  "token",
  "token-branded",
  "cryptocurrency",
  "cryptocurrency-color",
  "flag",
  "flagpack",
  "circle-flags",
  "cif",
  "gis",
  "map",
  "geo",
  "game-icons",
  "fad",
  "academicons",
  "guidance",
];

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
  ],
};

/**
 * Check if path should be ignored
 */
function shouldIgnore(filePath) {
  return CONFIG.ignore.some((pattern) => filePath.includes(pattern));
}

/**
 * Recursively get all files in directory
 */
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

/**
 * Check if icon prefix is a valid Iconify prefix
 */
function isValidIconifyPrefix(prefix) {
  return VALID_ICONIFY_PREFIXES.includes(prefix.toLowerCase());
}

/**
 * Validate if a string is a valid Iconify icon name
 * Valid format: prefix:icon-name where prefix is a known Iconify prefix
 */
function isValidIconifyIcon(iconName) {
  if (!iconName || typeof iconName !== "string") {
    return false;
  }

  const parts = iconName.split(":");
  if (parts.length !== 2) {
    return false;
  }

  const [prefix, name] = parts;

  if (!prefix || !name) {
    return false;
  }

  if (!isValidIconifyPrefix(prefix)) {
    return false;
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(name)) {
    return false;
  }

  return true;
}

/**
 * Extract icon names from file content
 *
 * Matches patterns like:
 * - JSX props: name="mdi:home", name='mdi:home', name={"mdi:home"}, name={'mdi:home'}, name={`mdi:home`}
 * - Object properties: name: "mdi:home", name: 'mdi:home'
 * - Array/object values: ["mdi:home"], ['mdi:home']
 *
 * Only returns VALID Iconify icons (known prefixes)
 */
function extractIconNames(content) {
  const iconNames = new Set();

  const patterns = [
    /name=["']([a-z0-9-]+:[a-z0-9-]+)["']/gi,
    /name=\{["']([a-z0-9-]+:[a-z0-9-]+)["']\}/gi,
    /name=\{`([a-z0-9-]+:[a-z0-9-]+)`\}/gi,
    /name:\s*["']([a-z0-9-]+:[a-z0-9-]+)["']/gi,
    /["']([a-z0-9-]+:[a-z0-9-]+)["']/gi,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const iconName = match[1].toLowerCase();
      if (isValidIconifyIcon(iconName)) {
        iconNames.add(iconName);
      }
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

  console.log("🔍 [Iconify] Scanning for icon usage...\n");

  const scanFile = (file) => {
    filesScanned++;
    const content = fs.readFileSync(file, "utf-8");
    const icons = extractIconNames(content);

    if (icons.length > 0) {
      filesWithIcons++;
      icons.forEach((icon) => allIcons.add(icon));
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

  console.log(`   Scanned ${filesScanned} files`);
  console.log(`   Found icons in ${filesWithIcons} files`);
  console.log(`   Total unique icons: ${allIcons.size}\n`);

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
      filesWithIcons,
      totalIcons: allIcons.size,
    },
  };
}

module.exports = {
  scanProject,
  extractIconNames,
  isValidIconifyIcon,
  isValidIconifyPrefix,
  VALID_ICONIFY_PREFIXES,
};

if (require.main === module) {
  const result = scanProject();

  if (result.icons.length === 0) {
    console.log("⚠️  No icons found in codebase");
    console.log(
      "   Make sure you are using IconifyIcon components with valid Iconify icon names\n"
    );
    console.log(
      "   Valid format: prefix:icon-name (e.g., mdi:home, fa:github)"
    );
    console.log(
      `   Supported prefixes: ${VALID_ICONIFY_PREFIXES.slice(0, 10).join(
        ", "
      )}, ...\n`
    );
  } else {
    console.log("✅ Scan complete!\n");
  }

  process.exit(0);
}
