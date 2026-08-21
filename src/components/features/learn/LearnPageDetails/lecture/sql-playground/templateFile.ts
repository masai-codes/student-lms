/** Binary SQLite database files start with the bytes "SQLite format 3\0". */
export function isBinarySqliteFile(bytes: Uint8Array): boolean {
  const header = 'SQLite format 3'
  if (bytes.length < header.length) return false
  for (let i = 0; i < header.length; i++) {
    if (bytes[i] !== header.charCodeAt(i)) return false
  }
  return true
}

/** Fetch the lecture's seed `.sql` template (or binary SQLite file) as bytes. */
export async function fetchTemplateBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load the SQL template file (HTTP ${res.status})`)
  }
  return new Uint8Array(await res.arrayBuffer())
}
