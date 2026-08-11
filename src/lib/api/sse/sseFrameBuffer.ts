/**
 * Pure buffer that reassembles SSE frames (delimited by a blank line) even when
 * a single frame is split across multiple network chunks. `push` returns the
 * `data:` payloads that became complete with this chunk. Kept side-effect free
 * so it can be unit-tested in isolation. Shared by every feature that streams
 * `text/event-stream` responses from this app's own API routes (ai-tutor
 * chat, interview turns, …).
 */
export function createSseFrameBuffer() {
  let buffer = ''

  return {
    push(chunk: string): Array<string> {
      buffer += chunk
      const payloads: Array<string> = []

      let separatorIndex = buffer.indexOf('\n\n')
      while (separatorIndex !== -1) {
        const rawFrame = buffer.slice(0, separatorIndex)
        buffer = buffer.slice(separatorIndex + 2)
        const payload = extractDataPayload(rawFrame)
        if (payload !== null) payloads.push(payload)
        separatorIndex = buffer.indexOf('\n\n')
      }

      return payloads
    },
  }
}

/** Join the `data:` lines of one SSE frame (the spec allows several per event). */
function extractDataPayload(rawFrame: string): string | null {
  const dataLines = rawFrame
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).replace(/^ /, ''))

  if (dataLines.length === 0) return null
  return dataLines.join('\n')
}
