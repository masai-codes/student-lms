// Thin GTM helper for dashboard click events. Pushes a named event onto the
// GTM dataLayer (initialised in the app root); safe no-op on the server or when
// the dataLayer is absent.

type WindowWithDataLayer = Window & {
  dataLayer?: Array<Record<string, unknown>>
}

export function pushDashboardEvent(event: string): void {
  if (typeof window === 'undefined') return
  const win = window as WindowWithDataLayer
  win.dataLayer = win.dataLayer ?? []
  win.dataLayer.push({ event })
}

/** GTM event for a banner click: `l_dashboard_banner_carousel_<key>_id_<id>`. */
export function bannerClickEvent(analyticsKey: string, id: number): string {
  return `l_dashboard_banner_carousel_${analyticsKey}_id_${id}`
}
