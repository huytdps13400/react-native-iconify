# Autolinking Support

## ✅ Library đã support đầy đủ Autolinking!

**react-native-iconify** được cấu hình đầy đủ cho autolinking, hỗ trợ cả:
- ✅ React Native CLI (0.60+)
- ✅ Expo (SDK 46+)
- ✅ Old Architecture
- ✅ New Architecture (TurboModules)

## Cấu hình Autolinking

### 1. iOS - CocoaPods

**File:** `Iconify.podspec`

```ruby
Pod::Spec.new do |s|
  s.name         = "Iconify"
  s.version      = package["version"]
  s.source_files = "ios/**/*.{h,m,mm,swift}"

  # Support cả new và old architecture
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.compiler_flags = "-DRCT_NEW_ARCH_ENABLED=1"
    # TurboModules enabled
  end

  s.dependency "React-Core"
  s.dependency "SDWebImage", "~> 5.21.0"
end
```

**Modules:**
- `TurboCacheModule` - Native caching với SDWebImage
- Support Swift 5.0+

### 2. Android - Gradle

**File:** `android/build.gradle`

```gradle
apply plugin: "com.android.library"
apply plugin: "kotlin-android"
apply plugin: "com.facebook.react"  // ← Enable autolinking

dependencies {
  implementation "com.facebook.react:react-android"
  implementation "org.jetbrains.kotlin:kotlin-stdlib"
}
```

**Modules:**
- `IconifyModule` - Main module (placeholder)
- `TurboCacheModule` - Native caching với file system

### 3. Configuration

**File:** `react-native.config.js`

```js
module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: 'Iconify.podspec',
      },
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.iconify.IconifyPackage;',
      },
    },
  },
};
```

## Installation

### React Native CLI

```bash
# 1. Install package
npm install react-native-iconify
# hoặc
yarn add react-native-iconify

# 2. iOS - Install pods (AUTOMATIC)
cd ios && pod install && cd ..

# 3. Android - Autolinking automatic!

# 4. Run
npx react-native run-ios
npx react-native run-android
```

**KHÔNG CẦN** `react-native link` - Tất cả tự động! 🎉

### Expo

```bash
# 1. Install package
npx expo install react-native-iconify

# 2. Prebuild (tạo native folders)
npx expo prebuild

# 3. Run
npx expo run:ios
npx expo run:android
```

**Expo Go:** ❌ Không support (vì cần native modules)
**Development Build:** ✅ Hoạt động hoàn hảo

## Kiểm tra Autolinking

### iOS
```bash
# Check podspec
cat ios/Podfile | grep -A 5 "Iconify"

# Should show:
# pod 'Iconify', :path => '../node_modules/react-native-iconify'
```

### Android
```bash
# Check settings.gradle
cat android/settings.gradle | grep -i iconify

# Should show:
# include ':react-native-iconify'
# project(':react-native-iconify').projectDir = ...
```

### Verify trong code
```typescript
import { IconifyIcon } from 'react-native-iconify';

// Nếu import thành công → Autolinking works! ✅
```

## Architecture Support

### Old Architecture (Default)
```bash
# React Native CLI
npx react-native run-ios
npx react-native run-android

# Expo
npx expo run:ios
npx expo run:android
```

✅ Modules:
- `IconifyModule` - ReactContextBaseJavaModule
- `TurboCacheModule` - Standard native module

### New Architecture (TurboModules)
```bash
# React Native CLI
RCT_NEW_ARCH_ENABLED=1 npx react-native run-ios
ORG_GRADLE_PROJECT_newArchEnabled=true npx react-native run-android

# Expo
npx expo run:ios --configuration Release
npx expo run:android --variant release
```

✅ Modules:
- `TurboCacheModule` - TurboModule với Codegen spec

**Spec file:** `src/specs/NativeTurboCacheModule.ts`

## Native Modules

### iOS

**TurboCacheModule.swift:**
- Sử dụng SDWebImage (memory + disk cache)
- Support cả sync và async
- TTL (time-to-live) support
- Thread-safe với `async/await`

**Methods:**
```swift
@objc func get(_ key: String, resolver: @escaping RCTPromiseResolveBlock)
@objc func set(_ key: String, value: String, ttl: NSNumber?)
@objc func remove(_ key: String)
@objc func clear()
@objc func getSize() -> Double
@objc func clearMemoryCache() -> Bool
@objc func clearDiskCache() -> Bool
```

### Android

**TurboCacheModule.kt:**
- File-based caching trong `cache/iconify_cache/`
- JSON serialization với TTL
- Kotlin coroutines ready

**Methods:**
```kotlin
@ReactMethod fun get(key: String, promise: Promise)
@ReactMethod fun set(key: String, value: String, ttl: Double?)
@ReactMethod fun remove(key: String, promise: Promise)
@ReactMethod fun clear(promise: Promise)
@ReactMethod fun getSize(promise: Promise)
@ReactMethod fun clearMemoryCache(promise: Promise)
@ReactMethod fun clearDiskCache(promise: Promise)
```

## Troubleshooting

### iOS: Module not found

```bash
# Clean build
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..

# Rebuild
npx react-native run-ios
```

### Android: Module not found

```bash
# Clean build
cd android
./gradlew clean
cd ..

# Rebuild
npx react-native run-android
```

### Expo: Native module not found

```bash
# Make sure using development build
npx expo prebuild --clean
npx expo run:ios
npx expo run:android

# NOT Expo Go (Expo Go không support native modules!)
```

## Package.json Config

```json
{
  "name": "react-native-iconify",
  "main": "src/index.tsx",
  "react-native": "src/index.tsx",
  "files": [
    "src",
    "ios",
    "android",
    "scripts",
    "*.podspec",
    "react-native.config.js"
  ],
  "codegenConfig": {
    "name": "IconifySpec",
    "type": "modules",
    "jsSrcsDir": "src"
  }
}
```

## Summary

✅ **Full Autolinking Support**
- React Native CLI (0.60+)
- Expo (with dev build)
- iOS CocoaPods
- Android Gradle
- Old Architecture
- New Architecture (TurboModules)

❌ **Not Supported**
- Expo Go (cần native modules)
- React Native < 0.60 (cần manual linking)

🎉 **Zero Configuration Required!**

Chỉ cần `npm install` và autolinking làm mọi thứ tự động!
