import type { AppOrigin } from '@/utils/appOrigin'

type OriginUrls = {
  /** Legacy student app base URL (historically `VITE_OLD_STUDENT_UI_URL`). */
  oldStudentUi: string
  /** This (v2) student app's canonical base URL for the origin. */
  newStudentUi: string
}

/**
 * Read an env var from runtime `process.env` (PM2 / SSR) first, then the
 * build-time `import.meta.env` baked into the client bundle. Same resolution
 * order as `viteEnv.ts` — values are static for the life of the process.
 */
function readEnv(key: string): string | undefined {
  const fromProcess =
    typeof process !== 'undefined' ? process.env[key] : undefined
  if (fromProcess != null && fromProcess.trim() !== '') {
    return fromProcess.trim()
  }
  const fromImport = import.meta.env[key] as string | undefined
  return fromImport != null && fromImport.trim() !== ''
    ? fromImport.trim()
    : undefined
}

/**
 * Per-origin env var names + hardcoded fallbacks. We ship ONE build for both
 * portals and detect the origin from the request host at runtime (see
 * `getAppOrigin`), so every origin's URLs must be present in the env — baked in
 * for the client (`VITE_*`) and/or available at runtime for the server. `masai`
 * is the default origin and reuses the legacy unprefixed vars for backward
 * compatibility; other origins use an `_<ORIGIN>` suffix. Fallbacks mirror the
 * production URLs (see `.env.production`) and are only used when the env var is
 * unset — keep them in sync when a portal's domain changes.
 */
const ORIGIN_ENV: Record<
  AppOrigin,
  { oldStudentUiKey: string; newStudentUiKey: string; fallback: OriginUrls }
> = {
  masai: {
    oldStudentUiKey: 'VITE_OLD_STUDENT_UI_URL',
    newStudentUiKey: 'VITE_NEW_STUDENT_UI_URL',
    fallback: {
      oldStudentUi: 'https://students.masaischool.com',
      newStudentUi: 'https://learn.masaischool.com',
    },
  },
  ihub: {
    oldStudentUiKey: 'VITE_OLD_STUDENT_UI_URL_IHUB',
    newStudentUiKey: 'VITE_NEW_STUDENT_UI_URL_IHUB',
    fallback: {
      oldStudentUi: 'https://courses.ihubiitrcourses.org',
      newStudentUi: 'https://learn.ihubiitrcourses.org',
    },
  },
  iitj: {
    oldStudentUiKey: 'VITE_OLD_STUDENT_UI_URL_IITJ',
    newStudentUiKey: 'VITE_NEW_STUDENT_UI_URL_IITJ',
    fallback: {
      oldStudentUi: 'https://iitj-students.masaischool.com',
      newStudentUi: 'https://iitj-learn.masaischool.com',
    },
  },
}

function resolveOriginUrls({
  oldStudentUiKey,
  newStudentUiKey,
  fallback,
}: (typeof ORIGIN_ENV)[AppOrigin]): OriginUrls {
  return {
    oldStudentUi: readEnv(oldStudentUiKey) ?? fallback.oldStudentUi,
    newStudentUi: readEnv(newStudentUiKey) ?? fallback.newStudentUi,
  }
}

/**
 * Per-origin URLs, resolved from the env (see `ORIGIN_ENV`). Single source of
 * truth now that we ship ONE build and detect the origin from the request host
 * at runtime. Override via env vars; the hardcoded fallbacks ship as a safety net.
 */
export const ORIGIN_URLS: Record<AppOrigin, OriginUrls> = {
  masai: resolveOriginUrls(ORIGIN_ENV.masai),
  ihub: resolveOriginUrls(ORIGIN_ENV.ihub),
  iitj: resolveOriginUrls(ORIGIN_ENV.iitj),
}
