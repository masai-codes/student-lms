/**
 * Trigger a browser download for text held in memory.
 *
 * A transient blob URL behind a synthetic anchor click is the only
 * cross-browser way to hand the user a *named* file without a server
 * round-trip. No-ops on the server and wherever blob URLs are unavailable, so
 * callers can invoke it unguarded.
 */
export function downloadTextFile(
  fileName: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8',
): void {
  if (typeof document === 'undefined') return
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return
  }

  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Safari needs the URL to outlive the click tick before it is revoked.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
