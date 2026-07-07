// Shared GTM/GA event helper. Pushes a named event (plus optional params) onto
// the GTM `dataLayer` (initialised in the app root). Safe no-op on the server
// or when the dataLayer is absent. GTM triggers/tags read these events; the
// event name and params are what analytics dashboards key off, so we embed the
// relevant DB row id in the event name and pass identifying context as params.

export type GtmEventParams = Record<string, string | number | boolean | null | undefined>

type WindowWithDataLayer = Window & {
  dataLayer?: Array<Record<string, unknown>>
}

export function pushGtmEvent(event: string, params: GtmEventParams = {}): void {
  if (typeof window === 'undefined') return

  const win = window as WindowWithDataLayer
  win.dataLayer = win.dataLayer ?? []

  // Drop undefined/null so we never push noisy empty keys into the dataLayer.
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) cleaned[key] = value
  }

  win.dataLayer.push({ event, ...cleaned })
}
