// Self-contained PM2 config for running this app in-place from its own folder
// (e.g. ~/lms) on a host that runs several apps. Unlike ecosystem.config.cjs
// (which targets the prod CodeDeploy layout under /home/ubuntu/app), every
// path here is resolved relative to THIS file via __dirname, so the app runs
// wherever the folder happens to live — nothing points outside it.
const fs = require('fs')
const path = require('path')

function parseEnvFile(filePath) {
  try {
    return fs
      .readFileSync(filePath, 'utf8')
      .split('\n')
      .reduce((acc, line) => {
        if (!line.trim() || line.trimStart().startsWith('#')) return acc
        const eq = line.indexOf('=')
        if (eq === -1) return acc
        const key = line.slice(0, eq).trim()
        const val = line.slice(eq + 1).trim()
        if (key) acc[key] = val
        return acc
      }, {})
  } catch (_) {
    return {}
  }
}

// Read env from a single .env in this folder (DATABASE_URL, PORT, secrets, …).
// The prod config uses the .env.production* files; this local runner uses .env.
const fileEnv = parseEnvFile(path.join(__dirname, '.env'))

module.exports = {
  apps: [
    {
      name: 'student-lms',
      script: path.join(__dirname, '.output/server/index.mjs'),
      cwd: __dirname,
      // Shared host: a single process is enough (the prod config uses 'MAX'
      // because it owns the whole box). fork mode matches the other apps here.
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      kill_timeout: 15000,
      out_file: path.join(__dirname, 'logs/app-out.log'),
      error_file: path.join(__dirname, 'logs/app-error.log'),
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        // Default port; overridden by PORT in any of the env files if set.
        PORT: '7090',
        ...fileEnv,
      },
    },
  ],
}
