module.exports = {
  apps: [
    {
      name: 'student-lms',
      script: '/home/ubuntu/app/.output/server/index.mjs',
      cwd: '/home/ubuntu/app',
      instances: 'MAX',
      exec_mode: 'cluster',
      env_file: '/home/ubuntu/app/.env.production.local',
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
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
}
