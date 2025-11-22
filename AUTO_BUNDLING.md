# Auto-bundling Icons cho Production Builds

## Tổng quan

Hệ thống auto-bundling tự động scan code, fetch icons từ Iconify API, và bundle vào APK/AAB khi build production. **Hoàn toàn tự động, không cần config gì thêm!**

## Cách hoạt động

### Development Mode
```
User viết code → IconifyIcon fetch từ API → Cache natively → Render
```
- ✅ Linh hoạt: Dùng icon gì cũng được
- ✅ Hot reload friendly
- ⚠️ Loading lần đầu (chấp nhận được trong dev)

### Production Build (APK/AAB)
```
Gradle/Xcode detect Release build → Auto scan code → Fetch & bundle icons → Build APK/AAB
```
- ✅ Icons có sẵn trong APK/AAB
- ✅ Render ngay lập tức (0ms)
- ✅ Không cần network
- ✅ UX hoàn hảo

## Setup (Zero Config!)

### 1. Cài đặt library
```bash
npm install react-native-iconify
# hoặc
yarn add react-native-iconify
```

### 2. Build production
```bash
# Expo
npx expo run:android --variant release
npx expo run:ios --configuration Release

# hoặc EAS Build
npx eas build --platform android
npx eas build --platform ios

# React Native CLI
npx react-native run-android --variant=release
npx react-native run-ios --configuration Release
```

**Hệ thống tự động:**
1. ✅ Gradle/Xcode detect Release build
2. ✅ Chạy bundling script trước khi compile
3. ✅ Scan toàn bộ code tìm IconifyIcon usage
4. ✅ Fetch icon data từ Iconify API (với caching)
5. ✅ Generate `bundled-icons.generated.ts`
6. ✅ Bundle vào APK/AAB

## Build Hooks

### Android (Gradle)
- Hook: `bundleIconifyIcons` task chạy trước `preBuild`
- Chỉ chạy cho: `assembleRelease`, `bundleRelease`
- Location: `android/build.gradle`

### iOS (Xcode)
- Hook: Script phase "Bundle Iconify Icons" chạy trước compile
- Chỉ chạy cho: `CONFIGURATION == "Release"`
- Location: `Iconify.podspec`

## Kiểm tra Auto-bundling

### Test thủ công
```bash
# Test bundling script
node node_modules/react-native-iconify/scripts/bundle-production.js
```

### Verify bundle
```bash
# Check bundle file đã được tạo
ls -lh node_modules/react-native-iconify/src/bundled-icons.generated.ts

# Xem nội dung
cat node_modules/react-native-iconify/src/bundled-icons.generated.ts
```

## Scripts có sẵn (Optional)

Nếu muốn chạy manual:

```bash
# Scan code để xem dùng icon nào
node node_modules/react-native-iconify/scripts/scan-icons.js

# Generate bundle
node node_modules/react-native-iconify/scripts/bundle-production.js
```

## Cơ chế Loading Icons

IconifyIcon component có 3-tier priority:

```typescript
// Priority 1: Check bundle (production builds)
if (BUNDLED_ICONS[name]) {
  return bundledIcon; // 0ms ⚡
}

// Priority 2: Check native cache (SDWebImage/Glide)
const cached = await nativeCache.get(name);
if (cached) {
  return cachedIcon; // ~5ms
}

// Priority 3: Fetch từ API
const icon = await fetchFromAPI(name);
cache(icon);
return icon; // ~100-500ms
```

## Files được tạo ra

```
project/
├── .iconify-cache/              # Local cache (gitignored)
│   ├── manifest.json
│   ├── mdi-home.json
│   └── fa-github.json
│
└── node_modules/
    └── react-native-iconify/
        └── src/
            └── bundled-icons.generated.ts  # Bundle (gitignored)
```

**Tất cả đều auto-gitignored bởi postinstall script!**

## Production Build Size

Ví dụ từ example-expo:
- **13 icons** = **5.82 KB**
- Average: ~450 bytes per icon
- Với 50 icons: ~22 KB
- Với 100 icons: ~45 KB

**Rất nhỏ gọn!** 🎉

## Troubleshooting

### Bundle không được tạo ra
```bash
# Kiểm tra build logs, nên thấy:
# 🎨 [Iconify] Bundling icons for production build...
# ✅ [Iconify] Icon bundling complete!

# Nếu không thấy, có thể script không tìm được
# Verify script exists:
ls node_modules/react-native-iconify/scripts/bundle-production.js
```

### Icons không load từ bundle
```bash
# Verify bundle file exists
ls node_modules/react-native-iconify/src/bundled-icons.generated.ts

# Check console logs (dev mode)
# Nên thấy: "[Iconify] Loaded X bundled icons"
```

### Rebuild cache
```bash
# Clear icon cache
rm -rf .iconify-cache

# Regenerate bundle
node node_modules/react-native-iconify/scripts/bundle-production.js
```

## Workflow Complete

```
📝 Write code with IconifyIcon
     ↓
📦 Install react-native-iconify (zero config needed!)
     ↓
💻 Dev mode: Icons fetch từ API (có loading)
     ↓
🚀 Build Release: Gradle/Xcode auto-bundle icons
     ↓
📱 APK/AAB chứa tất cả icons needed
     ↓
🎉 Perfect UX!
```

## So sánh với approaches khác

| Approach | Setup | Icons Available | Bundle Size | First Load |
|----------|-------|-----------------|-------------|------------|
| **react-native-iconify** | Zero config | 200k+ | ~450B/icon | 0ms ⚡ |
| @expo/vector-icons | Easy | ~3000 | 2-3MB | 0ms |
| react-native-vector-icons | Complex | ~8000 | Full pack | 0ms |
| SVG manual import | Manual | Custom | Varies | 0ms |

**Advantage:** 200k+ icons với bundle size nhỏ nhất và zero config! 🏆
