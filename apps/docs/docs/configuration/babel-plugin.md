---
title: Babel Transform
---

Plugin Babel `@react-native-iconify/babel-plugin` chuyển đổi `<Iconify name="..." />` thành import tĩnh của dữ liệu icon để bundle nhỏ gọn hơn.

## Cài đặt

```bash
yarn add -D @react-native-iconify/babel-plugin
```

Thêm vào `babel.config.js`:

```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['@react-native-iconify/babel-plugin', {
      importSource: '@react-native-iconify/native',
      iconModule: '@react-native-iconify/icons'
    }]
  ]
};
```

Các tuỳ chọn đều không bắt buộc:

- `importSource`: module chứa component `Iconify` (mặc định `@react-native-iconify/native`).
- `iconModule`: module export dữ liệu icon (mặc định `@react-native-iconify/icons`).
- `nameAttribute`: tên attribute chứa giá trị icon (mặc định `name`).

## Cách hoạt động

- Với `name="lucide:activity"` plugin sẽ thêm `import { lucideActivityIcon } from '@react-native-iconify/icons';`
- JSX được bổ sung `iconOverride={lucideActivityIcon}` giúp component Iconify sử dụng dữ liệu đã import sẵn.
- Nếu attribute `iconOverride` hoặc giá trị `name` không phải string literal, plugin bỏ qua để đảm bảo an toàn.

Kết quả: bundler chỉ giữ lại icon được import trực tiếp, giảm rủi ro đưa cả bộ sưu tập vào bundle cuối.

