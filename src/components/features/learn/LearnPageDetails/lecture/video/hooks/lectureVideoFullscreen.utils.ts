/**
 * Cross-browser fullscreen helpers for the lecture player.
 *
 * iPhone Safari has NO element fullscreen API (no `requestFullscreen`, not
 * even prefixed) — the only fullscreen there is the native video player via
 * `video.webkitEnterFullscreen()`, which also gives smooth landscape rotation
 * (YouTube-style). iPad and older desktop Safari expose the prefixed
 * `webkitRequestFullscreen` variants instead of the standard API.
 */

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => void
}

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => void
}

type WebkitVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void
  webkitSupportsFullscreen?: boolean
}

/**
 * Spelled out rather than using the DOM lib's `OrientationLockType`: that name
 * is absent from some lib.dom.d.ts versions, so referencing it breaks the build
 * depending on which TypeScript is installed.
 */
type OrientationLock =
  | 'any'
  | 'landscape'
  | 'landscape-primary'
  | 'landscape-secondary'
  | 'natural'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'

type OrientationLockCapable = ScreenOrientation & {
  lock?: (orientation: OrientationLock) => Promise<void>
  unlock?: () => void
}

/** Both event names must be listened to — Safari only fires the webkit one. */
export const FULLSCREEN_CHANGE_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
] as const

export function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null
  return (
    document.fullscreenElement ??
    (document as WebkitDocument).webkitFullscreenElement ??
    null
  )
}

export function supportsElementFullscreen(element: HTMLElement): boolean {
  return (
    typeof element.requestFullscreen === 'function' ||
    typeof (element as WebkitFullscreenElement).webkitRequestFullscreen ===
      'function'
  )
}

/** iPhone/iPod/iPad (incl. iPadOS masquerading as macOS with touch). */
export function isIosLikeDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const iPadOsDesktopUa =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || iPadOsDesktopUa
}

/** Touch-first device (phone/tablet) — used to gate mobile-only behaviors. */
export function isCoarsePointerDevice(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  )
}

function getScreenOrientation(): OrientationLockCapable | null {
  if (typeof window === 'undefined') return null
  return window.screen?.orientation ?? null
}

/** Best-effort landscape lock (Android fullscreen); silently unsupported elsewhere. */
function lockLandscapeOrientation(): void {
  try {
    const orientation = getScreenOrientation()
    void orientation?.lock?.('landscape').catch(() => {})
  } catch {
    /* unsupported */
  }
}

function unlockOrientation(): void {
  try {
    getScreenOrientation()?.unlock?.()
  } catch {
    /* unsupported */
  }
}

/**
 * Enter fullscreen on the player container. Resolves to false when the
 * request was rejected/unsupported so callers can fall back.
 */
export async function enterElementFullscreen(
  element: HTMLElement,
  options?: {
    /** Lock to landscape after entering (explicit fullscreen-button intent). */
    lockLandscape?: boolean
  },
): Promise<boolean> {
  try {
    if (typeof element.requestFullscreen === 'function') {
      await element.requestFullscreen()
    } else {
      const webkitRequest = (element as WebkitFullscreenElement)
        .webkitRequestFullscreen
      if (typeof webkitRequest !== 'function') return false
      webkitRequest.call(element)
    }
  } catch {
    return false
  }
  if (options?.lockLandscape && isCoarsePointerDevice()) {
    lockLandscapeOrientation()
  }
  return true
}

export async function exitAnyFullscreen(): Promise<void> {
  unlockOrientation()
  try {
    if (typeof document.exitFullscreen === 'function') {
      await document.exitFullscreen()
      return
    }
    ;(document as WebkitDocument).webkitExitFullscreen?.()
  } catch {
    /* already exited */
  }
}

/** iPhone-only path: the native fullscreen video player (rotates freely). */
function enterNativeVideoFullscreen(video: HTMLVideoElement | null): boolean {
  const webkitVideo: WebkitVideoElement | null = video
  if (!webkitVideo || typeof webkitVideo.webkitEnterFullscreen !== 'function') {
    return false
  }
  try {
    webkitVideo.webkitEnterFullscreen()
    return true
  } catch {
    // Throws InvalidStateError before metadata is loaded — kick off a load so
    // a follow-up tap succeeds.
    try {
      webkitVideo.load()
    } catch {
      /* noop */
    }
    return false
  }
}

/**
 * The fullscreen button behavior: exit if fullscreen, else standard/prefixed
 * element fullscreen (locking landscape on touch devices for landscape
 * videos), else iPhone native video fullscreen.
 */
export function toggleLectureVideoFullscreen(
  container: HTMLElement | null,
  video: HTMLVideoElement | null,
): void {
  if (getFullscreenElement()) {
    void exitAnyFullscreen()
    return
  }
  if (container && supportsElementFullscreen(container)) {
    const isLandscapeVideo =
      !video || video.videoWidth === 0 || video.videoWidth >= video.videoHeight
    void enterElementFullscreen(container, {
      lockLandscape: isLandscapeVideo,
    }).then((entered) => {
      if (!entered) enterNativeVideoFullscreen(video)
    })
    return
  }
  enterNativeVideoFullscreen(video)
}
