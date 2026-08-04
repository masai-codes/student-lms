import { describe, expect, it } from 'vitest'
import { MOBILE_APP_PORTALS, portalHasMobileApp } from './portalCapabilities'

describe('portalHasMobileApp', () => {
  it('allows only the portals on the allowlist', () => {
    expect(portalHasMobileApp('masai')).toBe(true)
    expect(portalHasMobileApp('ihub')).toBe(false)
    expect(portalHasMobileApp('iitj')).toBe(false)
  })

  it('stays in sync with the allowlist', () => {
    // Guards the intent: the app is Masai-only today. Update both this list and
    // MOBILE_APP_PORTALS together when a portal gains (or loses) the app.
    expect([...MOBILE_APP_PORTALS]).toEqual(['masai'])
  })
})
