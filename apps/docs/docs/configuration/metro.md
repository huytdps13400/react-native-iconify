---
title: Metro Plugin
---

`@react-native-iconify/metro` mở rộng cấu hình Metro để sinh icon trước mỗi lần bundle và ánh xạ alias tới các file đã sinh.

## API

```ts
withIconify(config, {
  icons?: string[];
  collections?: string[];
  customCollections?: Record<string, string>;
  outputDir?: string;
  cwd?: string;
});
```

- `icons`: danh sách icon cụ thể dạng `prefix:name`.
- `collections`: nạp toàn bộ bộ icon (hãy dùng tiết kiệm).
- `customCollections`: ánh xạ prefix tới file JSON Iconify hoặc thư mục SVG đã chuẩn hoá.
- `outputDir`: thư mục sinh file (mặc định `.iconify`).

## Chạy đồng bộ/async

Metro plugin cung cấp cả `withIconify` (đồng bộ) và `withIconifyAsync` khi bạn muốn chạy loader bất đồng bộ.

```ts
module.exports = async () => withIconifyAsync(await getDefaultConfig(__dirname), {
  icons: ['lucide:activity']
});
```

## Alias và watch folders

Plugin tự động:

- Thêm watch folder tới thư mục `.iconify`.
- Tạo alias `@react-native-iconify/icons` (registry) và `@react-native-iconify/icons/components` (component SVG đã sinh).
- Xác thực `manifest.json` để đảm bảo icon đã được tạo.

