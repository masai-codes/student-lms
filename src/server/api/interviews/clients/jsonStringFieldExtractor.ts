export type JsonStringFieldEvent =
  | { type: 'delta'; text: string }
  | { type: 'end' }
  | { type: 'null' }

/**
 * Incrementally extracts one top-level JSON string field's value as raw text
 * chunks of the (still-generating) document arrive — lets callers start
 * showing/speaking `nextQuestion` while the model is still streaming the
 * rest of the JSON object (e.g. `transcript`) afterwards. The full document
 * is still parsed with `JSON.parse` once the stream ends; this is only a
 * best-effort preview, so unrecognized escapes degrade gracefully rather
 * than throwing. Pure/stateful-but-isolated so it's unit-testable against
 * hand-fed chunk sequences instead of a live stream.
 */
export function createIncrementalJsonStringExtractor(fieldName: string) {
  const marker = `"${fieldName}"`
  let raw = ''
  let cursor = 0
  let phase: 'seeking-key' | 'after-key' | 'in-string' | 'done' = 'seeking-key'

  function push(chunk: string): Array<JsonStringFieldEvent> {
    raw += chunk
    const events: Array<JsonStringFieldEvent> = []

    if (phase === 'seeking-key') {
      const keyIndex = raw.indexOf(marker, cursor)
      if (keyIndex === -1) {
        // Keep a small unscanned tail in case the marker is split across chunks.
        cursor = Math.max(cursor, raw.length - marker.length)
        return events
      }
      cursor = keyIndex + marker.length
      phase = 'after-key'
    }

    if (phase === 'after-key') {
      while (cursor < raw.length && /[\s:]/.test(raw[cursor])) cursor++
      if (cursor >= raw.length) return events // wait for more data

      if (raw[cursor] === '"') {
        cursor++
        phase = 'in-string'
      } else if (raw.slice(cursor, cursor + 4) === 'null') {
        cursor += 4
        phase = 'done'
        events.push({ type: 'null' })
        return events
      } else {
        phase = 'done' // unexpected shape — nothing more to extract
        return events
      }
    }

    if (phase === 'in-string') {
      let decoded = ''
      while (cursor < raw.length) {
        const ch = raw[cursor]
        if (ch === '\\') {
          if (cursor + 1 >= raw.length) break // wait for the escaped char
          decoded += unescapeJsonChar(raw[cursor + 1])
          cursor += 2
          continue
        }
        if (ch === '"') {
          cursor++
          phase = 'done'
          break
        }
        decoded += ch
        cursor++
      }
      if (decoded) events.push({ type: 'delta', text: decoded })
      if (phase === 'done') events.push({ type: 'end' })
    }

    return events
  }

  return { push }
}

function unescapeJsonChar(escapeChar: string): string {
  switch (escapeChar) {
    case 'n':
      return '\n'
    case 't':
      return '\t'
    case 'r':
      return '\r'
    case '"':
      return '"'
    case '\\':
      return '\\'
    case '/':
      return '/'
    default:
      // `\uXXXX` and anything else uncommon in interview-question text is
      // left as-is — this preview self-heals once the final JSON.parse runs.
      return escapeChar
  }
}
