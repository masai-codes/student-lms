import { describe, expect, it } from 'vitest'
import {
  CHAT_PORTALS,
  MASAI_LIVE_PROMO_PORTALS,
  MOBILE_APP_PORTALS,
  SECTION_ON_LEARN_CARD_PORTALS,
  portalHasChat,
  portalHasMasaiLivePromo,
  portalHasMobileApp,
  portalShowsSectionOnLearnCard,
} from './portalCapabilities'

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

describe('portalHasChat', () => {
  it('allows Masai and IIT Jodhpur, but not iHub', () => {
    expect(portalHasChat('masai')).toBe(true)
    expect(portalHasChat('iitj')).toBe(true)
    expect(portalHasChat('ihub')).toBe(false)
  })

  it('stays in sync with the allowlist', () => {
    expect([...CHAT_PORTALS]).toEqual(['masai', 'iitj'])
  })
})

describe('portalHasMasaiLivePromo', () => {
  it('hides the Masai-branded promo on IIT Jodhpur', () => {
    expect(portalHasMasaiLivePromo('masai')).toBe(true)
    expect(portalHasMasaiLivePromo('ihub')).toBe(true)
    expect(portalHasMasaiLivePromo('iitj')).toBe(false)
  })

  it('stays in sync with the allowlist', () => {
    expect([...MASAI_LIVE_PROMO_PORTALS]).toEqual(['masai', 'ihub'])
  })
})

describe('portalShowsSectionOnLearnCard', () => {
  it('allows only IIT Jodhpur', () => {
    expect(portalShowsSectionOnLearnCard('iitj')).toBe(true)
    expect(portalShowsSectionOnLearnCard('masai')).toBe(false)
    expect(portalShowsSectionOnLearnCard('ihub')).toBe(false)
  })

  it('stays in sync with the allowlist', () => {
    expect([...SECTION_ON_LEARN_CARD_PORTALS]).toEqual(['iitj'])
  })
})
