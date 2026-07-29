import { defineConfig } from 'vitest/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'

/**
 * Vitest config for the agenthand (Puppeteer) e2e suite. Kept separate from
 * `vitest.config.ts` (unit tests) so `npm run test` never launches a browser or
 * needs a running dev server. Run with `npm run test:e2e` — requires the dev
 * server up on :3002 and `npm run seed:all` already applied.
 */
export default defineConfig({
  plugins: [viteTsConfigPaths({ projects: ['./tsconfig.json'] })],
  test: {
    include: ['e2e/**/*.e2e.ts'],
    globalSetup: ['e2e/global-setup.ts'],
    // Real browser against one dev server — run files sequentially to avoid
    // hammering the single-process dev server and to keep output readable.
    fileParallelism: false,
    // Interactive flows (video seek + profile photo upload) need headroom.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // The project's day-boundary / IST wall-clock rendering assumes IST.
    env: { TZ: 'Asia/Kolkata' },
    reporters: ['default'],
  },
})
