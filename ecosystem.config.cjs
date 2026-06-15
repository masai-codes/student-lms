// Load secrets written by AfterInstall.sh from Secrets Manager into the env
// block at config-read time. This avoids PM2's known bug where env_file is not
// re-processed on `pm2 reload --update-env`, causing DATABASE_URL and other
// runtime secrets to be missing on re-deployments.
//
// dotenv is not available on the server (node_modules is not deployed), so we
// parse the file manually using Node's built-in fs module.
const fs = require('fs')

function parseEnvFile(filePath) {
  try {
    return fs
      .readFileSync(filePath, 'utf8')
      .split('\n')
      .reduce((acc, line) => {
        // Skip blank lines and comments
        if (!line.trim() || line.trimStart().startsWith('#')) return acc
        const eq = line.indexOf('=')
        if (eq === -1) return acc
        const key = line.slice(0, eq).trim()
        const val = line.slice(eq + 1).trim()
        if (key) acc[key] = val
        return acc
      }, {})
  } catch (_) {
    // File doesn't exist yet (e.g. local dev) — continue without it.
    return {}
  }
}

const staticEnv = parseEnvFile('/home/ubuntu/app/.env.production')
const runtimeEnv = parseEnvFile('/home/ubuntu/app/.env.production.local')

// Merge env-file values (secrets in .env.production.local take precedence on
// any overlap). NODE_ENV from the files decides the default port: development
// listens on 7090, everything else on 3000. An explicit PORT in the env files
// still wins over this default.
const fileEnv = { ...staticEnv, ...runtimeEnv }
const nodeEnv = fileEnv.NODE_ENV || 'production'
const defaultPort = nodeEnv === 'development' ? '7090' : '3000'

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
      // Environment — static vars from .env.production first, then secrets
      // from .env.production.local (so secrets take precedence on any overlap).
      // Inlining here (instead of using PM2's env_file option) ensures the vars
      // are present on both fresh starts and zero-downtime reloads.
      env: {
        NODE_ENV: 'production',
        PORT: defaultPort,
        ...fileEnv,
      },
    },
  ],
}
