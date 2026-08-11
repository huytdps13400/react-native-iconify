import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, transformWithOxc } from 'vite';

const fixtureDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(fixtureDirectory, '../../..');

export default defineConfig({
  root: fixtureDirectory,
  plugins: [
    {
      name: 'transform-compiled-package-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (id.startsWith(path.resolve(repositoryRoot, 'lib')) && id.endsWith('.js')) {
          return transformWithOxc(code, id, {
            lang: 'jsx',
            jsx: {
              runtime: 'automatic'
            }
          });
        }
      }
    }
  ],
  define: {
    __DEV__: 'false',
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  resolve: {
    mainFields: ['react-native', 'browser', 'module', 'jsnext:main', 'jsnext'],
    alias: [
      {
        find: '@react-native/assets-registry/registry',
        replacement: path.resolve(
          repositoryRoot,
          'node_modules/react-native-web/dist/modules/AssetRegistry/index.js'
        )
      },
      {
        find: '@huymobile/react-native-iconify',
        replacement: path.resolve(repositoryRoot, 'lib/index.js')
      },
      {
        find: /^react-native-svg$/,
        replacement: path.resolve(
          repositoryRoot,
          'node_modules/react-native-svg/src/index.ts'
        )
      },
      {
        find: /^react-native$/,
        replacement: path.resolve(
          repositoryRoot,
          'node_modules/react-native-web/dist/index.js'
        )
      }
    ],
    extensions: [
      '.web.mjs',
      '.web.js',
      '.web.mts',
      '.web.ts',
      '.web.jsx',
      '.web.tsx',
      '.mjs',
      '.js',
      '.mts',
      '.ts',
      '.jsx',
      '.tsx',
      '.json'
    ]
  },
  optimizeDeps: {
    noDiscovery: true,
    exclude: [
      '@huymobile/react-native-iconify',
      'react-native',
      'react-native-svg',
      'react-native-web'
    ]
  },
  build: {
    outDir: path.resolve(fixtureDirectory, 'dist'),
    emptyOutDir: true
  }
});
