---
title: Tối ưu bundle size
---

## Chiến lược chính

1. **Chỉ chọn icon cần thiết** trong `iconify.config.json`.
2. **Tránh import nguyên bộ sưu tập** trừ khi thực sự cần.
3. **Bật Babel plugin** để import tĩnh `iconOverride`.

## Phân tích bundle

Sử dụng `react-native-bundle-visualizer` hoặc `source-map-explorer` với output JS:

```bash
react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios.bundle
source-map-explorer ios.bundle ios.bundle.map
```

Đảm bảo các module `@react-native-iconify/icons` chỉ chứa icon đã khai báo.

## Tree-shaking

- Metro chưa tree-shake đầy đủ, vì vậy loader + Babel transform là tuyến phòng thủ chính.
- Nếu build web với webpack/Vite, tree-shaking sẽ loại bỏ icon không import.

## Bộ nhớ cache

Thư mục `.iconify` được sinh lại khi:

- Thay đổi `iconify.config.json`.
- Bổ sung icon mới trong Metro plugin.

Sử dụng `yarn iconify:check` trong CI để phát hiện thay đổi chưa commit.

