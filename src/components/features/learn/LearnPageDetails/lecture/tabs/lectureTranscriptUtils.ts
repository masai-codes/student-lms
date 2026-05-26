/** Format a transcript segment start (in seconds) as `m:ss` or `h:mm:ss`. */
export function formatTranscriptTimestamp(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = safe % 60

  const pad2 = (value: number) => String(value).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(secs)}`
  }
  return `${minutes}:${pad2(secs)}`
}
