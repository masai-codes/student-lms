function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readGumletHlsUrl(vimeoDownloadLinks: unknown): string | null {
  if (!isRecord(vimeoDownloadLinks)) return null
  const gumlet = vimeoDownloadLinks.gumlet
  if (!isRecord(gumlet)) return null
  const hlsUrl = gumlet.hls_url
  return typeof hlsUrl === 'string' && hlsUrl.trim() !== '' ? hlsUrl.trim() : null
}

function readVideosUrl(videos: unknown): string | null {
  if (typeof videos === 'string' && videos.trim() !== '') {
    return videos.trim()
  }
  if (Array.isArray(videos)) {
    const first = videos[0]
    if (typeof first === 'string' && first.trim() !== '') {
      return first.trim()
    }
  }
  return null
}

export function resolveLectureVideoUrl(input: {
  videos: unknown
  vimeoDownloadLinks: unknown
  vimeoPlayerEmbedUrl: string | null
}): string | null {
  return (
    readGumletHlsUrl(input.vimeoDownloadLinks) ??
    readVideosUrl(input.videos) ??
    (input.vimeoPlayerEmbedUrl?.trim() ? input.vimeoPlayerEmbedUrl.trim() : null)
  )
}
