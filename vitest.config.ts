import { defineConfig } from 'vitest/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    setupFiles: ['./vitest.setup.ts'],
    // Pin the timezone so time-of-day / day-boundary assertions are
    // deterministic across machines. Our dev boxes + EC2 run in IST, but CI
    // containers (CodeBuild) default to UTC, which shifts every IST wall-clock
    // rendering by 5h30m. Tests that assert "(IST)" labels or day-countdowns
    // depend on this. See computeDeadlineCountdown / LmsSupportPanel specs.
    env: {
      TZ: 'Asia/Kolkata',
    },
    dir: 'src',
  },
})
