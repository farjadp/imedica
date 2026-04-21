const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');

const sharedConfig = require('./packages/config/eslint');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.turbo/**',
    ],
  },
  ...compat.config(sharedConfig),
  {
    files: ['apps/backend/src/**/*.ts', 'apps/backend/tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./apps/backend/tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ['apps/backend/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'import/no-unresolved': 'off',
      'import/order': 'off',
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./apps/web/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ['packages/shared/src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./packages/shared/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
  },
];
