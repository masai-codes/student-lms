const PLAYLIST_FETCH_TIMEOUT_MS = 5_000

async function fetchPlaylistText(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) return null
    const text = await response.text()
    return text.trim() ? text : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function resolvePlaylistUrl(baseUrl: string, reference: string): string {
  const trimmed = reference.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  try {
    return new URL(trimmed, baseUrl).toString()
  } catch {
    return trimmed
  }
}

function pickMediaPlaylistUrl(masterUrl: string, playlistText: string): string | null {
  const lines = playlistText.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? ''
    if (!line.startsWith('#EXT-X-STREAM-INF')) continue

    for (let next = index + 1; next < lines.length; next += 1) {
      const candidate = lines[next]?.trim() ?? ''
      if (!candidate || candidate.startsWith('#')) continue
      return resolvePlaylistUrl(masterUrl, candidate)
    }
  }

  return null
}

function parseExtinfDurationSeconds(playlistText: string): number | null {
  let total = 0
  let found = false

  for (const rawLine of playlistText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line.startsWith('#EXTINF:')) continue

    const match = /^#EXTINF:([\d.]+)/.exec(line)
    if (match == null) continue

    const seconds = Number(match[1])
    if (!Number.isFinite(seconds) || seconds <= 0) continue

    total += seconds
    found = true
  }

  if (!found || total <= 0) return null
  return Math.round(total)
}

/** Sum `#EXTINF` durations from an HLS media playlist (follows master when needed). */
export async function resolveHlsDurationSeconds(hlsUrl: string): Promise<number | null> {
  const trimmed = hlsUrl.trim()
  if (!trimmed) return null

  const masterText = await fetchPlaylistText(trimmed)
  if (masterText == null) return null

  const directDuration = parseExtinfDurationSeconds(masterText)
  if (directDuration != null) return directDuration

  const mediaPlaylistUrl = pickMediaPlaylistUrl(trimmed, masterText)
  if (mediaPlaylistUrl == null || mediaPlaylistUrl === trimmed) return null

  const mediaText = await fetchPlaylistText(mediaPlaylistUrl)
  if (mediaText == null) return null

  return parseExtinfDurationSeconds(mediaText)
}
