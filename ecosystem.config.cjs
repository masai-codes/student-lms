const path = require('path')
const dotenv = require('dotenv')

const { parsed: dotEnv = {} } = dotenv.config({
  path: path.join(__dirname, '.env'),
})

const sharedEnv = {
  ...dotEnv,
  NODE_ENV: 'production',
}

// Single build/app serves both Masai and iHub. The origin is detected from the
// request host at runtime (see `src/utils/appOrigin.ts`), so there's no
// per-origin build or env any more — point both domains at this app in nginx.
module.exports = {
  apps: [
    {
      name: 'student-lms',
      cwd: __dirname,
      script: '.output/server/index.mjs',
      env: {
        ...sharedEnv,
        PORT: 7090,
      },
    },
  ],
}
