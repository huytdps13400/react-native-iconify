module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: ['dist/', 'lib/', '.iconify/'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: undefined
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
};

