---
title: Khắc phục sự cố
---

## Lỗi không tìm thấy icon

Thông báo:

```
[react-native-iconify] Icon "lucide:activity" is not available.
```

- Kiểm tra `iconify.config.json` đã chứa icon.
- Chạy `yarn iconify:generate`.
- Đảm bảo alias Metro hoạt động (xoá cache bằng `yarn start --reset-cache`).

## Bundle quá lớn

- Xác nhận Babel plugin đang hoạt động (xem JS output, iconOverride đã xuất hiện).
- Giảm số lượng icon trong `collections`.
- Dùng `yarn iconify:check` để đảm bảo `.iconify/icons.ts` chỉ liệt kê icon cần thiết.

## Expo Web không hiển thị

- Đảm bảo `react-native-svg` đã cài (Expo managed project cài sẵn).
- Chạy `expo prebuild` nếu dùng bare workflow.

## Git diff thay đổi manifest mỗi lần build

- Kiểm tra múi giờ/đồng hồ hệ thống. Manifest tái sử dụng timestamp khi danh sách icon không đổi.
- Đảm bảo build không xoá thủ công `.iconify/manifest.json`.

