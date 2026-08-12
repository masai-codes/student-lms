import { defineConfig } from 'vitest/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'

// Pin the timezone so time-of-day / day-boundary assertions are deterministic
// across machines. Our dev boxes + EC2 run in IST, but CI containers
// (CodeBuild) default to UTC, which shifts every IST wall-clock rendering by
// 5h30m. This must run here, in Vitest's main process, and as a plain
// assignment — Node only re-reads the system timezone when `process.env.TZ`
// is written via its proxy trap, and only in the thread that writes it.
// `pool: 'threads'` workers are `worker_threads`, which snapshot env at
// creation but do NOT re-run that invalidation for writes made later inside
// the worker (confirmed empirically) — so setting this in `test.env` or in
// `vitest.setup.ts` (which runs *inside* each worker) is a silent no-op.
// Setting it here, before Tinypool spawns any worker, makes every worker
// inherit the already-correct value at creation time, which does work.
process.env.TZ = 'Asia/Kolkata'

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
          // `forks` (not `threads`): these specs mutate `process.env.TZ` at
          // runtime (inside a test) to simulate a non-IST viewer. That only
          // works in a real OS process — a `worker_threads` worker (the
          // `threads` pool) doesn't re-run Node's tz-cache invalidation for
          // writes made from inside the worker (see the top-of-file note),
          // so `Date`/`Intl` would keep formatting in whatever TZ the worker
          // started with. `forks` gives each file a full child process,
          // where the runtime mutation behaves like the main thread.
          pool: 'forks',
        },
      },
    ],
  },
})
