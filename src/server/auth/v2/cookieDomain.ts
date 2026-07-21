export function getCookieDomain(request: Request): string | undefined {
  const origin = request.headers.get('origin') ?? ''
  const host = request.headers.get('host') ?? ''

  let hostname = ''
  if (origin) {
    try {
      hostname = new URL(origin).hostname
    } catch {
      // fall through
    }
  }
  if (!hostname && host) {
    hostname = host.split(':')[0]
  }

  if (
    !hostname ||
    hostname === 'localhost' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    return undefined
  }

  const parts = hostname.split('.')
  if (parts.length < 2) return undefined

  return '.' + parts.slice(-2).join('.')
}
