module.exports = {
  extends: ['expo', 'prettier'],
  plugins: [],
  rules: {
    // Prevent using theme variables in StyleSheet without importing them
    // This catches the pattern where COLORS, SPACING, etc. are used in StyleSheet.create()
    // but not imported from '@/constants/theme'
    'no-undef': 'error',

    // Ensure imports are properly ordered
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'never',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
  overrides: [
    {
      // TypeScript files
      files: ['*.ts', '*.tsx'],
      rules: {
        // Ensure all variables are defined before use
        '@typescript-eslint/no-use-before-define': ['error', {
          functions: false,
          classes: true,
          variables: true
        }],
      },
    },
  ],
};
