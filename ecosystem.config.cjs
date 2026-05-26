const path = require('path')
const dotenv = require('dotenv')
const origins = require('./origins.config.cjs')

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
        ...origins.masai,
      },
    },
    {
      name: 'student-lms-ihub',
      cwd: __dirname,
      script: '.output-ihub/server/index.mjs',
      env: {
        ...sharedEnv,
        PORT: 7091,
        ...origins.ihub,
      },
    },
  ],
}
