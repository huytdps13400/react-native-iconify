# React Native Iconify

[![CI](https://img.shields.io/badge/CI-github--actions-blue)](./.github/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-docusaurus-3a6ee8)](apps/docs)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Giới thiệu

React Native Iconify mang trải nghiệm Iconify tới iOS, Android và Web với trọng tâm là Metro bundler, kích thước bundle nhỏ và hỗ trợ TypeScript toàn diện. Dự án lấy cảm hứng từ kiến trúc Monicon ([repo tham khảo](https://github.com/oktaysenkan/monicon)) nhưng tối ưu cho React Native 2025.

## Các package chính

- `@react-native-iconify/native` – Component `<Iconify />` dùng chung cho mọi nền tảng.
- `@react-native-iconify/metro` – Tích hợp Metro, tự động sinh icon và alias module.
- `@react-native-iconify/loader` – CLI/Node API để ingest Iconify JSON hoặc bộ icon tuỳ chỉnh.
- `@react-native-iconify/babel-plugin` – Transform tuỳ chọn để import icon tĩnh (`iconOverride`).
- `@react-native-iconify/shared` – Kiểu dữ liệu & hàm trợ giúp dùng chung.

## Yêu cầu phiên bản

- React Native ≥ 0.76
- Expo SDK ≥ 52
- `react-native-svg` 15.x (native) & `react-native-svg-web` ≥ 1.0 (web)
- React Native Web ≥ 0.19

## Cấu trúc repo

- `apps/docs` – Trang tài liệu Docusaurus.
- `packages/*` – Các package sẵn sàng publish qua npm (hiện ở version thử nghiệm).
- `.iconify/` – Artefact sinh tự động từ loader (icon registry, manifest, component SVG).
- `.github/` – CI, issue template, PR template.

## Bắt đầu nhanh

```bash
yarn install
yarn iconify:generate
yarn lint
```

## Sinh icon

- Cấu hình icon trong `iconify.config.json`.
- Chạy `yarn iconify:generate` (sử dụng `@react-native-iconify/loader`).
- Commit mọi thay đổi trong `.iconify/` – CI dùng `yarn iconify:check` để bảo đảm đồng bộ.

## Docusaurus Docs

- Toàn bộ hướng dẫn chi tiết nằm ở `apps/docs` (tiếng Anh & có ví dụ code).
- Khởi chạy docs local:

  ```bash
  yarn workspace @react-native-iconify/docs start
  ```

## Example Apps

- `apps/example-expo` – Expo/React Native Web demo (chạy `yarn workspace @react-native-iconify/example-expo dev`).
- `apps/example-rncli` – React Native CLI demo (chạy `yarn workspace @react-native-iconify/example-rncli start` + `ios/android`).
- Mỗi app có `iconify` script nội bộ để sinh icon dựa trên `iconify.config.json`.

## Phát hành (dự kiến)

- Sử dụng Changesets (`yarn changeset`) để tạo ghi chú phát hành.
- Workflow publish sẽ phát hành các package `@react-native-iconify/*` theo SemVer.

## Đóng góp

- Đọc [CONTRIBUTING.md](CONTRIBUTING.md).
- Mở issue với template tương ứng (`bug_report` hoặc `feature_request`).
- Luôn chạy `yarn lint` và `yarn iconify:check` trước khi tạo PR.

## License

MIT © React Native Iconify contributors.

