/** True when the value is a non-empty http(s) URL — used to validate LINK submissions. */
export function isValidSubmissionUrl(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed === '') return false
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
