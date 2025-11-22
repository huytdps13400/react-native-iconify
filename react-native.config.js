module.exports = {
  dependency: {
    platforms: {
      ios: {}, // Auto-detect Iconify.podspec at root
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.iconify.IconifyPackage;',
      },
    },
  },
};
