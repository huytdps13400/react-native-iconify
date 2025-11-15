# Changesets

Thư mục này chứa cấu hình Changesets. Để tạo bản ghi phát hành:

```bash
yarn changeset
```

Sau khi PR được merge:

```bash
yarn changeset:version
yarn install --mode=update-lockfile
yarn changeset:publish
```

