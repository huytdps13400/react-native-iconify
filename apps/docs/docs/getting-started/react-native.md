---
title: React Native CLI
---

## Cài đặt

```bash
yarn add @react-native-iconify/native @react-native-svg/react-native-svg
yarn add -D @react-native-iconify/loader @react-native-iconify/metro
```

## Cấu hình Metro

Tạo hoặc cập nhật `metro.config.js`:

```ts
const { getDefaultConfig } = require('metro-config');
const { withIconify } = require('@react-native-iconify/metro');

const config = withIconify(getDefaultConfig(__dirname), {
  icons: ['lucide:activity', 'mdi:home'],
  customCollections: {
    'app': './assets/icons/app-icons.json'
  }
});

module.exports = config;
```

## Sinh icon

Tạo `iconify.config.json`:

```json
{
  "icons": ["lucide:activity"]
}
```

Chạy generator:

```bash
yarn iconify:generate
```

## Sử dụng

```tsx
import { Iconify } from '@react-native-iconify/native';

export const Example = () => (
  <Iconify name="lucide:activity" size={28} color="#3a6ee8" />
);
```

