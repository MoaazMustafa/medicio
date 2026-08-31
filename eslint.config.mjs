import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import js from '@eslint/js';
import globals from 'globals';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import nextPlugin from '@next/eslint-plugin-next';

const eslintConfig = [
  // Base configurations
  js.configs.recommended,
  nextPlugin.configs.recommended,
  nextPlugin.configs['core-web-vitals'],

  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'coverage/**',
      '*.config.js',
      '*.config.mjs',
      'next-env.d.ts',
      'public/**',
    ],
  },

  // TypeScript and React configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react: fixupPluginRules(react),
      'react-hooks': fixupPluginRules(reactHooks),
      'jsx-a11y': fixupPluginRules(jsxA11y),
      import: fixupPluginRules(importPlugin),
      'unused-imports': unusedImports,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: true,
      },
    },
    rules: {
      // TypeScript rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off', // Handled by unused-imports
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'error',

      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-imports': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Prettier configuration (must be last)
  prettierConfig,
];

export default eslintConfig;
