// Load secrets written by AfterInstall.sh from Secrets Manager into the env
// block at config-read time. This avoids PM2's known bug where env_file is not
// re-processed on `pm2 reload --update-env`, causing DATABASE_URL and other
// runtime secrets to be missing on re-deployments.
const { configDotenv } = require('dotenv')

const { parsed: runtimeEnv = {} } = configDotenv({
  path: '/home/ubuntu/app/.env.production.local',
})

module.exports = {
  apps: [
    {
      name: 'student-lms',
      script: '/home/ubuntu/app/.output/server/index.mjs',
      cwd: '/home/ubuntu/app',
      instances: 'MAX',
      exec_mode: 'cluster',
      // Restart policy
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      // Graceful shutdown — give in-flight requests 15s to complete
      kill_timeout: 15000,
      // Logging
      out_file: '/home/ubuntu/logs/app-out.log',
      error_file: '/home/ubuntu/logs/app-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Environment — static vars first, then secrets from .env.production.local.
      // Inlining here (instead of using PM2's env_file option) ensures the vars
      // are present on both fresh starts and zero-downtime reloads.
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        ...runtimeEnv,
      },
    },
  ],
}
