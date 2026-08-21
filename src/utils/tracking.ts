let currentUser: { id?: number } | null = null
const CLARITY_PROJECT_ID = 'xpb03nelcs'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function setCurrentUserForTracking(
  user: { id?: number } | null | undefined,
) {
  currentUser = user ?? null
}

export function sendTrackingEvent(eventObj: Record<string, string>) {
  if (!isBrowser()) return
  if (!(window as any).gtag) return

  const payload = {
    ...eventObj,
    ...(currentUser?.id ? { user_id: String(currentUser.id) } : {}),
  }

  ;(window as any).gtag('event', eventObj.event, payload)
}

export function initClarity() {
  if (!isBrowser()) return

  if ((window as any).__clarityInitialized) return
  ;(function (
    c: any,
    l: Document,
    a: string,
    r: string,
    i: string,
    t?: HTMLScriptElement,
    y?: Node,
  ) {
    c[a] =
      c[a] ||
      function (...args: any[]) {
        ;(c[a].q = c[a].q || []).push(args)
      }
    t = l.createElement(r) as HTMLScriptElement
    t.async = true
    t.src = `https://www.clarity.ms/tag/${i}`
    y = l.getElementsByTagName(r)[0]
    y?.parentNode?.insertBefore(t, y)
  })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID)
  ;(window as any).__clarityInitialized = true
}
