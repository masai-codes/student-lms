type ViteEnvKey =
  | 'VITE_OLD_STUDENT_UI_URL'
  | 'VITE_NEW_STUDENT_UI_URL'
  | 'VITE_ENABLE_LEGACY_STUDENT_REDIRECT'

/** PM2/runtime `process.env` first, then Vite build `import.meta.env`. */
export function readViteEnv(key: ViteEnvKey): string | undefined {
  const fromProcess =
    typeof process !== 'undefined' ? process.env[key] : undefined
  if (fromProcess != null && fromProcess.trim() !== '') {
    return fromProcess
  }
  const fromImport = import.meta.env[key] as string | undefined
  return fromImport?.trim() ? fromImport : undefined
}

export function isLegacyStudentRedirectEnabled(): boolean {
  return readViteEnv('VITE_ENABLE_LEGACY_STUDENT_REDIRECT')?.toLowerCase() === 'true'
}

export function getNewStudentUiUrl(): string | undefined {
  return readViteEnv('VITE_NEW_STUDENT_UI_URL')
}

export function getOldStudentUiUrlFromEnv(): string | undefined {
  return readViteEnv('VITE_OLD_STUDENT_UI_URL')
}
