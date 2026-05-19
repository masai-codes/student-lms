const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const origins = require('../origins.config.cjs')

const origin = process.argv[2]
const originEnv = origins[origin]

if (!originEnv) {
  console.error(`Unknown origin "${origin}". Expected one of: ${Object.keys(origins).join(', ')}`)
  process.exit(1)
}

const root = path.join(__dirname, '..')

const build = spawnSync('npm', ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--max_old_space_size=6144',
    ...originEnv,
  },
})

if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

const outputDir = path.join(root, `.output-${origin}`)
fs.rmSync(outputDir, { recursive: true, force: true })
fs.cpSync(path.join(root, '.output'), outputDir, { recursive: true })

console.log(`Built ${origin} → ${outputDir}`)
