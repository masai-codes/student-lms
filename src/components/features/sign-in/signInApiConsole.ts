/** Dev-only: log bodies we would POST to auth endpoints until APIs are wired. */
export function logSignInApiPayload(label: string, body: Record<string, unknown>): void {
  if (!import.meta.env.DEV) {
    return
  }
  console.log('[sign-in API payload]', label, body)
}
