/**
 * Minimal user-agent summariser for the Account Activity list.
 *
 * The old LMS ran the `useragent` package server-side to build a
 * `"{family} {major}.{minor} ({os})"` label and separately sniffed the raw UA on
 * the client to pick a device icon. This does both in one pass, with no
 * dependency, because the only consumer is a human-readable device label.
 */

export type DeviceKind = 'laptop' | 'tablet' | 'phone'

/** Ordered most-specific-first: Edge/Opera masquerade as Chrome, Chrome as Safari. */
const BROWSERS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/(\d+)/ },
  { name: 'Opera', pattern: /(?:OPR|Opera)\/(\d+)/ },
  { name: 'Samsung Internet', pattern: /SamsungBrowser\/(\d+)/ },
  { name: 'Firefox', pattern: /(?:Firefox|FxiOS)\/(\d+)/ },
  { name: 'Chrome', pattern: /(?:Chrome|CriOS)\/(\d+)/ },
  { name: 'Safari', pattern: /Version\/(\d+).*Safari/ },
]

const OPERATING_SYSTEMS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: 'Windows', pattern: /Windows NT/ },
  { name: 'Android', pattern: /Android/ },
  { name: 'iPadOS', pattern: /iPad/ },
  { name: 'iOS', pattern: /iPhone|iPod/ },
  { name: 'macOS', pattern: /Mac OS X|Macintosh/ },
  { name: 'Linux', pattern: /Linux/ },
]

/** Tablets must be tested before phones — an iPad UA also matches "Mobile". */
export function resolveDeviceKind(userAgent: string): DeviceKind {
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return 'tablet'
  if (/Android(?!.*Mobile)/.test(userAgent)) return 'tablet'
  if (/iPhone|iPod|Android|Mobile|Windows Phone/i.test(userAgent))
    return 'phone'
  return 'laptop'
}

/** A short, humane device label. Falls back to "Unknown device" on junk input. */
export function describeUserAgent(userAgent: string | null): string {
  const ua = userAgent?.trim()
  if (!ua) return 'Unknown device'

  const browser = BROWSERS.find((candidate) => candidate.pattern.test(ua))
  const os = OPERATING_SYSTEMS.find((candidate) => candidate.pattern.test(ua))

  const browserLabel = browser
    ? `${browser.name} ${browser.pattern.exec(ua)?.[1] ?? ''}`.trim()
    : null

  if (browserLabel && os) return `${browserLabel} on ${os.name}`
  if (browserLabel) return browserLabel
  if (os) return os.name
  return 'Unknown device'
}
