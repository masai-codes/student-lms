import { resolve } from 'node:path'

import dotenv from 'dotenv'

/**
 * Shared e2e configuration. Loads env the same way the seed runner does
 * (`.env` base, `.env.local` overrides) so `SECRET_LOGIN_TOKEN` is available
 * when the suite runs standalone (outside the dev server process).
 */
const root = process.cwd()
dotenv.config({ path: resolve(root, '.env') })
dotenv.config({ path: resolve(root, '.env.local'), override: true })

/** Base URL of the running dev server (`npm run dev`, port 3002). */
export const BASE_URL = (
  process.env.E2E_BASE_URL ?? 'http://localhost:3002'
).replace(/\/$/, '')

/**
 * Dev-only backdoor token used to establish a session without a password.
 * Treated as a secret — never logged. Read from `.env.local`.
 */
export const SECRET_LOGIN_TOKEN = process.env.SECRET_LOGIN_TOKEN ?? ''

/** Run with a visible browser window via `E2E_HEADFUL=1` when debugging. */
export const HEADFUL = process.env.E2E_HEADFUL === '1'

/** Slow each interaction down (ms) when debugging via `E2E_SLOWMO`. */
export const SLOWMO = Number(process.env.E2E_SLOWMO ?? '0')

/** Per-navigation / per-selector timeout (ms). */
export const DEFAULT_TIMEOUT = Number(process.env.E2E_TIMEOUT ?? '30000')

/** Default desktop viewport. Several dashboard hooks are desktop-gated. */
export const DESKTOP_VIEWPORT = { width: 1280, height: 900 } as const
export const MOBILE_VIEWPORT = { width: 375, height: 812 } as const
