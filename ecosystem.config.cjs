const path = require('path')
const dotenv = require('dotenv')

const { parsed: dotEnv = {} } = dotenv.config({
  path: path.join(__dirname, '.env'),
})

const sharedEnv = {
  ...dotEnv,
  NODE_ENV: 'production',
}

module.exports = {
  apps: [
    {
      name: 'student-lms-masai',
      cwd: __dirname,
      script: '.output-masai/server/index.mjs',
      env: {
        ...sharedEnv,
        PORT: 7090,
        VITE_APP_ORIGIN: 'masai',
      },
    },
    {
      name: 'student-lms-ihub',
      cwd: __dirname,
      script: '.output-ihub/server/index.mjs',
      env: {
        ...sharedEnv,
        PORT: 7091,
        VITE_APP_ORIGIN: 'ihub',
      },
    },
  ],
}
