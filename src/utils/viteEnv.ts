import { getAppOrigin } from '@/utils/appOrigin'
import { ORIGIN_URLS } from '@/utils/originUrls'

/** PM2/runtime `process.env` first, then Vite build `import.meta.env`. */
function readViteEnv(
  key: 'VITE_ENABLE_LEGACY_STUDENT_REDIRECT',
): string | undefined {
  const fromProcess =
    typeof process !== 'undefined' ? process.env[key] : undefined
  if (fromProcess != null && fromProcess.trim() !== '') {
    return fromProcess
  }
  const fromImport = import.meta.env[key] as string | undefined
  return fromImport?.trim() ? fromImport : undefined
}

export function isLegacyStudentRedirectEnabled(): boolean {
  return (
    readViteEnv('VITE_ENABLE_LEGACY_STUDENT_REDIRECT')?.toLowerCase() === 'true'
  )
}

/**
 * This (v2) app's canonical base URL. On the client it's simply the current
 * origin; on the server it's resolved per request origin (see `getAppOrigin`).
 */
export function getNewStudentUiUrl(): string | undefined {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ORIGIN_URLS[getAppOrigin()].newStudentUi
}

/** Legacy student app base URL for the current request origin. */
export function getOldStudentUiUrlFromEnv(): string | undefined {
  return ORIGIN_URLS[getAppOrigin()].oldStudentUi
}
