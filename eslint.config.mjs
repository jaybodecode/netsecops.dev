// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  files: ['scripts/content-generation/**/*.{ts,js,mjs}'],
  rules: {
    'no-console': 'off', // Allow console.log in CLI scripts
  },
})
