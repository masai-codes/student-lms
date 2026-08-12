import { defineConfig } from 'vitest/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'

// Relative to `test.dir` ('src') below — do not prefix with 'src/'.
const TZ_MUTATING_TESTS = [
  'utils/timeZoneHandler/formatScheduleRange.test.ts',
  'components/features/dashboard/shared/scheduleMapping.test.ts',
  'components/features/dashboard/section-sidebar/LmsSupportPanel.test.tsx',
  'server/assignments/utils/__tests__/buildAssessSectionTiming.test.ts',
]

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
    // `threads` pool runs files concurrently in shared worker processes,
    // which is ~2x faster than the default `forks` pool (one process per
    // file) on this suite. That concurrency is only safe because the specs
    // below — which mutate `process.env.TZ` to simulate a non-IST viewer —
    // are carved out into their own project (see below) so they never run
    // in the same process as anything else reading that global.
    pool: 'threads',
    projects: [
      {
        extends: true,
        test: {
          name: 'default',
          exclude: ['**/node_modules/**', ...TZ_MUTATING_TESTS],
        },
      },
      {
        extends: true,
        test: {
          name: 'tz-mutating',
          include: TZ_MUTATING_TESTS,
          // `forks` (not `threads`): worker *threads* still share the one
          // Node process's `process.env`, even across separate projects, so
          // a `threads`-pool project here would still race with the
          // `default` project's concurrently running files. A `forks` pool
          // gives each file its own OS process, so the TZ mutation is truly
          // isolated. `fileParallelism: false` keeps the 4 files themselves
          // sequential too (they run one at a time either way; explicit for
          // clarity).
          pool: 'forks',
        },
      },
    ],
  },
})
