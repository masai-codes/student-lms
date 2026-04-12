/** Aligns with legacy `REACT_APP_BUG_REPORT_FORM` (profile menu → Report a Bug). */
export function getBugReportFormUrl(): string {
  const fromEnv = (import.meta.env.VITE_BUG_REPORT_FORM as string | undefined)?.trim()
  if (fromEnv) return fromEnv
  return 'https://forms.gle/ZMRLA8rQ85CtSkWf8'
}
