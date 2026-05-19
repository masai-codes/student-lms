const path = require('path')
const dotenv = require('dotenv')

const { parsed: dotEnv = {} } = dotenv.config({
  path: path.join(__dirname, '.env'),
})

const sharedEnv = {
  ...dotEnv,
  NODE_ENV: 'production',
  /** Keep v2 as the main app; set `true` only to send all protected routes to legacy LMS. */
  VITE_ENABLE_LEGACY_STUDENT_REDIRECT: 'false',
}

/** Per-origin URLs (PM2 runtime; used by server + optional client via SSR). */
const ihubEnv = {
  VITE_OLD_STUDENT_UI_URL: 'https://ihubiitrcourses.iasam.dev',
  VITE_NEW_STUDENT_UI_URL: 'https://students-demo-v2.ihubiitrcourses.org',
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
        ...ihubEnv,
      },
    },
  ],
}
