const path = require('node:path')

/** @see https://pm2.keymetrics.io/docs/usage/application-declaration/ */
module.exports = {
  apps: [
    {
      name: 'student-lms',
      cwd: path.join(__dirname),
      script: '.output/server/index.mjs',
      interpreter: 'node',
      // Load ~/lms/.env at runtime (PM2 5.3+); dotenv preload is a fallback.
      env_file: '.env',
      node_args: '-r dotenv/config',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
