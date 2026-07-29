/** @type {import('lint-staged').Configuration} */
const config = {
  // Prettier handles every staged file it recognises; --ignore-unknown skips
  // the rest (images, fonts, .env files) instead of failing the commit.
  // Files listed in .prettierignore are left alone.
  '*': 'prettier --write --ignore-unknown',
}

export default config
