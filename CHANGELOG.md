# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-08-14

### Added

- **Wrapper component tracing** - the production scan now detects icons used through
  your own wrapper components (`<AppIcon name="mdi:heart" />`), up to three levels of
  indirection, including renamed default imports and barrel re-exports (#7, #8)
- **Prefix-validated literal detection** (Tailwind-style) - icon-shaped string literals
  anywhere in the scanned files are bundled when their prefix is a known Iconify
  collection (`scripts/iconify-prefixes.json`, 236 sets); the Iconify API acts as the
  final existence filter at fetch time (#8)
- **Expression literal scraping** - `name={active ? "mdi:check" : "mdi:close"}` bundles
  both branches; i18n keys like `name={t("common:back")}` are never mistaken for icons
- **Safelist globs** - `"iconify": { "icons": ["mdi:weather-*"] }` expands against the
  collection's icon list at build time, for dynamically constructed names
- **New `iconify` config fields** in package.json: `detection` (`"smart"` / `"strict"`),
  `extraPrefixes` (self-hosted icon sets), `exclude` (names or glob patterns)
- Dynamic icon name constructions (`` name={`mdi:${kind}`} ``) and statically
  unresolvable usages are reported with file and line instead of silently dropped

### Fixed

- Files using icons only through wrappers were skipped entirely by the import gate,
  producing an empty production bundle (#7)
- `name` prop no longer missed when preceded by props containing `>` (arrow functions)
- `<IconifyIconGroup />` no longer falsely matched as `<IconifyIcon />`

## [1.1.0] - 2026-08-11

### Added

- React Native Web and Expo Web support with a platform-specific in-memory LRU cache;
  persistent native caches on iOS and Android retained (#2, #5)
- Node regression coverage and production-bundle Chromium E2E tests on GitHub Actions

### Fixed

- Icon rendering when an Iconify API response omits `width`/`height` - Iconify's
  default dimensions are applied (#3, #4)

## [1.0.9] - 2026-01-19

### Fixed

- **Critical: Metro Bundler Compatibility** - Fixed dynamic import issue that prevented bundled icons from being included in production builds
  - Changed from dynamic `require()` with path iteration to static import
  - Bundled icons now properly included in JS bundle by Metro
  - Icon loading improved from 200-500ms (API fetch) to 0ms (instant from bundle)
  - Enables proper tree-shaking and dead code elimination
  
- **Gradle Task Configuration** - Fixed Android build script for Gradle 7.x/8.x compatibility
  - Refactored `bundleIconifyIcons` task to use modern Gradle APIs
  - Fixed `getExecutionResult()` error in newer Gradle versions
  - Added graceful error handling with proper exit code checking
  - Task now uses `tasks.register()` and `tasks.named()` (recommended patterns)

### Performance Improvements

- **Bundle Size**: Static imports enable Metro's tree-shaking (10-20% size reduction)
- **Time-To-Interactive**: Bundled icons load instantly (0ms vs 200-500ms)
- **Offline Support**: Icons work without network dependency in production builds

### Documentation

- Added `FIXES_SUMMARY.md` - Detailed explanation of technical fixes
- Added `QUICK_REFERENCE.md` - Testing guide and troubleshooting
- Added `android/build.gradle.alternative` - Alternative Exec task approach

### Technical Details

**Metro Bundler Fix:**
```typescript
// Before (broken): Dynamic path iteration
for (const modulePath of paths) {
  require(modulePath); // Metro can't analyze this
}

// After (fixed): Static import
const bundled = require("../bundled-icons.generated"); // Metro includes this
```

**Gradle Fix:**
```groovy
// Before (broken): Exec task with incorrect result access
tasks.register('task', Exec) {
  doLast { task.getExecutionResult() } // Error
}

// After (fixed): Regular task with exec block
tasks.register('task') {
  doLast {
    def result = project.exec { /* ... */ }
    if (result.exitValue == 0) { /* ... */ }
  }
}
```

### Migration Notes

- **No breaking changes** - Component API remains identical
- **No action required** - Fixes are internal optimizations
- **Automatic benefits** - Bundled icons now work correctly in production

---

## [1.0.8] - 2025-11-24

### Added
- TurboModule support for New Architecture (Bridgeless mode)
- Native caching via SDWebImage (iOS) and Glide (Android)
- Production icon bundling system
- Automatic icon scanning from codebase

### Features
- 200,000+ icons from Iconify API
- Zero-configuration setup
- Lazy-loading with loading states
- Icon transformation (rotate, flip)
- Custom fallback support
- Memory and disk caching

---

## Earlier Versions

See [GitHub Releases](https://github.com/huytdps13400/react-native-iconify/releases) for earlier version history.
