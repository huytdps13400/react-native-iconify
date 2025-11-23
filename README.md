# @huymobile/react-native-iconify

> 200,000+ icons for React Native with native caching and zero configuration

[![npm version](https://img.shields.io/npm/v/@huymobile/react-native-iconify)](https://www.npmjs.com/package/@huymobile/react-native-iconify)
[![npm downloads](https://img.shields.io/npm/dm/@huymobile/react-native-iconify)](https://www.npmjs.com/package/@huymobile/react-native-iconify)
[![license](https://img.shields.io/npm/l/@huymobile/react-native-iconify)](https://www.npmjs.com/package/@huymobile/react-native-iconify)

---

## Why react-native-iconify?

Traditional icon libraries require you to **bundle all icons** at build time, leading to:
- ❌ Large bundle sizes (even if you use only 10 icons)
- ❌ Manual imports for each icon
- ❌ Limited icon selection per library

**react-native-iconify** takes a different approach:
- ✅ **200,000+ icons** from 150+ icon sets (Material Design, Feather, Heroicons, Phosphor, Lucide, and more)
- ✅ **Load icons by name** - no imports needed
- ✅ **Zero bundle size impact** in development
- ✅ **Automatic bundling** for production builds
- ✅ **Native caching** with SDWebImage (iOS) and Glide (Android)

---

## Features

| Feature | Description |
|---------|-------------|
| 🎨 **200,000+ Icons** | Access to 150+ icon sets from [Iconify](https://iconify.design) |
| ⚡ **Zero Config** | Works out of the box - no manual bundling required |
| 📦 **Auto-Bundling** | Icons automatically bundled during production builds (APK/IPA) |
| 💾 **Native Caching** | SDWebImage (iOS) + Glide (Android) for persistent storage |
| 🏗️ **New Architecture** | Full support for React Native 0.68+ New Architecture |
| 📱 **Old Architecture** | Backward compatible with React Native 0.60+ |
| 🚀 **Expo Support** | Works with Expo development builds and EAS |
| 🔧 **React Native CLI** | Full support for bare React Native projects |

---

## Compatibility

| Platform | Minimum Version |
|----------|-----------------|
| React Native | 0.68.0+ |
| React Native (Old Arch) | 0.60.0+ |
| Expo SDK | 49+ |
| iOS | 13.0+ |
| Android | API 21+ (Android 5.0) |

---

## Installation

```bash
# Using npm
npm install @huymobile/react-native-iconify react-native-svg

# Using yarn
yarn add @huymobile/react-native-iconify react-native-svg

# Using pnpm
pnpm add @huymobile/react-native-iconify react-native-svg

# Using bun
bun add @huymobile/react-native-iconify react-native-svg
```

### iOS Setup

```bash
cd ios && pod install
```

### Expo Setup

```bash
npx expo install react-native-svg
npx expo prebuild
```

> **Note:** react-native-iconify requires a development build. It will not work with Expo Go.

---

## Quick Start

```tsx
import React from 'react';
import { View } from 'react-native';
import { IconifyIcon } from '@huymobile/react-native-iconify';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* Material Design Icons */}
      <IconifyIcon name="mdi:home" size={32} color="#333" />

      {/* Heroicons */}
      <IconifyIcon name="heroicons:user-solid" size={32} color="blue" />

      {/* Feather Icons */}
      <IconifyIcon name="feather:settings" size={32} color="green" />

      {/* Phosphor Icons */}
      <IconifyIcon name="ph:heart-fill" size={32} color="red" />
    </View>
  );
}
```

### Finding Icons

Browse and search icons at **[icon-sets.iconify.design](https://icon-sets.iconify.design/)**

Icon names follow the format: `{prefix}:{icon-name}`

Examples:
- `mdi:home` - Material Design Icons
- `heroicons:user` - Heroicons
- `feather:settings` - Feather Icons
- `lucide:camera` - Lucide Icons
- `ph:heart` - Phosphor Icons

---

## API

### IconifyIcon Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | Icon name in format `prefix:name` |
| `size` | `number` | `24` | Icon size (width & height) |
| `color` | `string` | `#000` | Icon color |
| `rotate` | `number` | `0` | Rotation in degrees |
| `flip` | `'horizontal' \| 'vertical' \| 'both'` | - | Flip the icon |
| `style` | `ViewStyle` | - | Additional styles |
| `onLoad` | `() => void` | - | Called when icon loads successfully |
| `onError` | `(error: Error) => void` | - | Called when icon fails to load |
| `fallback` | `ReactNode` | - | Fallback component while loading |
| `testID` | `string` | - | Test ID for testing |

### Examples

```tsx
// Basic usage
<IconifyIcon name="mdi:home" size={24} color="blue" />

// With rotation
<IconifyIcon name="mdi:arrow-right" size={24} rotate={90} />

// With flip
<IconifyIcon name="mdi:arrow-left" size={24} flip="horizontal" />

// With custom fallback
<IconifyIcon
  name="mdi:home"
  size={24}
  fallback={<ActivityIndicator size="small" />}
/>

// With callbacks
<IconifyIcon
  name="mdi:home"
  size={24}
  onLoad={() => console.log('Icon loaded!')}
  onError={(err) => console.error('Failed:', err)}
/>
```

---

## Icon Sets

react-native-iconify supports **150+ icon sets** with over **200,000 icons**.

### Popular Icon Sets

| Icon Set | Prefix | Icons | License |
|----------|--------|-------|---------|
| [Material Design Icons](https://icon-sets.iconify.design/mdi/) | `mdi` | 7,000+ | Apache 2.0 |
| [Heroicons](https://icon-sets.iconify.design/heroicons/) | `heroicons` | 290+ | MIT |
| [Feather Icons](https://icon-sets.iconify.design/feather/) | `feather` | 280+ | MIT |
| [Phosphor](https://icon-sets.iconify.design/ph/) | `ph` | 7,000+ | MIT |
| [Lucide](https://icon-sets.iconify.design/lucide/) | `lucide` | 1,400+ | ISC |
| [Tabler Icons](https://icon-sets.iconify.design/tabler/) | `tabler` | 4,400+ | MIT |
| [Bootstrap Icons](https://icon-sets.iconify.design/bi/) | `bi` | 1,900+ | MIT |
| [Font Awesome](https://icon-sets.iconify.design/fa6-solid/) | `fa6-solid` | 1,400+ | CC BY 4.0 |
| [Remix Icons](https://icon-sets.iconify.design/ri/) | `ri` | 2,700+ | Apache 2.0 |
| [Carbon](https://icon-sets.iconify.design/carbon/) | `carbon` | 2,000+ | Apache 2.0 |

Browse all icon sets at [icon-sets.iconify.design](https://icon-sets.iconify.design/)

---

## Architecture Support

### New Architecture (Fabric + TurboModules)

react-native-iconify fully supports React Native's New Architecture:

- ✅ TurboModules for native cache access
- ✅ Fabric-compatible rendering
- ✅ Concurrent features support

### Old Architecture (Bridge)

Backward compatible with the bridge-based architecture:

- ✅ Works with React Native 0.60+
- ✅ Standard Native Modules
- ✅ Full feature parity

---

## Expo Support

### Development Builds

```bash
# Install
npx expo install @huymobile/react-native-iconify react-native-svg

# Create development build
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

### EAS Build

```bash
# Build for production
eas build --platform all
```

### Expo Go

> ⚠️ **Not Supported**: react-native-iconify requires native modules and will not work with Expo Go. Use a development build instead.

---

## Performance

| Scenario | Load Time |
|----------|-----------|
| Bundled icon (production) | **0ms** |
| Native cache hit | **15-35ms** |
| API fetch (first load) | **200-500ms** |

---

## Troubleshooting

### Icons not loading

1. Check internet connection (for API fetches)
2. Verify icon name format: `prefix:icon-name`
3. Check if icon exists at [icon-sets.iconify.design](https://icon-sets.iconify.design/)

### iOS build errors

```bash
cd ios && pod install --repo-update
```

### Android build errors

```bash
cd android && ./gradlew clean
```

### Metro bundler issues

```bash
npx react-native start --reset-cache
```

---

## Credits

- [Iconify](https://iconify.design/) - The universal icon framework
- [react-native-svg](https://github.com/software-mansion/react-native-svg) - SVG rendering for React Native
- [SDWebImage](https://github.com/SDWebImage/SDWebImage) - iOS image caching
- [Glide](https://github.com/bumptech/glide) - Android image caching
