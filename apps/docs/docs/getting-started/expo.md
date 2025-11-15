---
title: Expo & React Native Web
---

## Chuẩn bị dự án

```bash
expo install react-native-svg
yarn add @react-native-iconify/native
yarn add -D @react-native-iconify/loader @react-native-iconify/metro
```

## Cấu hình Expo

Trong `metro.config.js` của Expo:

```ts
const { getDefaultConfig } = require('expo/metro-config');
const { withIconify } = require('@react-native-iconify/metro');

const config = withIconify(getDefaultConfig(__dirname), {
  icons: ['lucide:activity'],
  collections: ['mdi']
});

module.exports = config;
```

## Web bundler

Expo Web sử dụng Metro nên không cần webpack plugin riêng. Đảm bảo `expo start --web` được chạy sau khi sinh icon.

## CLI

Thêm script tiện dụng:

```json title="package.json"
"scripts": {
  "iconify": "yarn iconify:generate && expo start -c"
}
```

## Sử dụng

```tsx
import { Iconify } from '@react-native-iconify/native';

export const HeaderIcon = () => (
  <Iconify name="mdi:home" size={24} />
);
```

