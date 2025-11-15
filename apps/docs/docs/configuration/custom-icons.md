---
title: Icon tuỳ chỉnh
---

Bạn có thể bổ sung icon ngoài Iconify thông qua `customCollections`.

## JSON Iconify

Sinh JSON bằng [Iconify Tools](https://docs.iconify.design/tools/node/):

```bash
iconify-merge --prefix app ./svg/*.svg > app-icons.json
```

Sau đó cấu hình:

```ts
withIconify(config, {
  customCollections: {
    app: './iconify/app-icons.json'
  },
  icons: ['app:logo']
});
```

## SVG thuần

Khi dùng SVG thô, đảm bảo đã chạy qua SVGO để tối ưu. Loader sẽ convert sang component React Native bằng SVGR.

```json
{
  "customCollections": {
    "marketing": "./assets/icons/marketing.json"
  }
}
```

## TypeScript

Các icon tuỳ chỉnh được thêm vào type union `IconName`, vì vậy IDE vẫn autocomplete đầy đủ.

