// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  {
    files: ['**/*.ts', '**/*.vue', '**/*.js', '**/*.mjs'],
    rules: {
      // Vue.js best practices
      'vue/html-self-closing': ['error', {
        html: {
          void: 'always',
          normal: 'always',
          component: 'always'
        },
        svg: 'always',
        math: 'always'
      }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/multi-word-component-names': 'off', // Disabled for page components
      'vue/no-multiple-template-root': 'off', // Vue 3 allows multiple roots
      
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      
      // General JavaScript/TypeScript rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Import/export rules
      'import/no-unresolved': 'off', // Handled by TypeScript
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index'
        ],
        'newlines-between': 'never'
      }],
      
      // Nuxt specific
      'nuxt/prefer-import-meta': 'error'
    }
  },
  {
    files: ['pages/**/*.vue'],
    rules: {
      // Page components don't need multi-word names
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    files: ['layouts/**/*.vue'],
    rules: {
      // Layout components don't need multi-word names
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    files: ['**/*.config.{js,ts,mjs}', '**/nuxt.config.{js,ts}'],
    rules: {
      // Config files can use console.log
      'no-console': 'off'
    }
  },
  {
    files: ['scripts/content-generation/**/*.{ts,js,mjs}'],
    rules: {
      // CLI scripts can use console.log
      'no-console': 'off'
    }
  }
)