---
title: Tích hợp CI/CD
---

## Kiểm tra icon

Workflow mặc định (`.github/workflows/ci.yml`) chạy:

1. `yarn iconify:generate` sinh lại icon.
2. `scripts/iconify-check.mjs` đảm bảo `.iconify` không thay đổi.

Nếu bạn sử dụng CI riêng:

```yaml
- run: yarn iconify:generate
- run: node scripts/iconify-check.mjs
```

## Changesets

Sau khi hoàn thành tính năng:

```bash
yarn changeset
yarn changeset version
yarn changeset publish
```

Các package `@react-native-iconify/*` được phát hành đồng bộ theo SemVer.

## Docusaurus docs

`apps/docs` có thể build trong pipeline:

```bash
yarn workspace @react-native-iconify/docs build
```

Sau đó deploy lên static hosting mà bạn lựa chọn.

