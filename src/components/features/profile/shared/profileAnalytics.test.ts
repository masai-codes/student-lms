import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  pushProfileEntityEvent,
  pushProfileEvent,
} from '@/components/features/profile/shared/profileAnalytics'

const hoisted = vi.hoisted(() => ({ pushGtmEvent: vi.fn() }))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

afterEach(() => vi.clearAllMocks())

describe('pushProfileEvent', () => {
  it('prefixes every event name so GTM can trigger on it', () => {
    pushProfileEvent('tab_click', { tab: 'details' })
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith('l_profile_tab_click', {
      tab: 'details',
    })
  })

  it('defaults to empty params', () => {
    pushProfileEvent('password_change_open')
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_password_change_open',
      {},
    )
  })
})

describe('pushProfileEntityEvent', () => {
  it('embeds the entity type and id in the event name and params', () => {
    pushProfileEntityEvent('accept', 'undertaking', 11, { extra: 'x' })
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_undertaking_accept_id_11',
      { entity_type: 'undertaking', entity_id: 11, extra: 'x' },
    )
  })

  it('supports string ids (e.g. session ids)', () => {
    pushProfileEntityEvent('revoke_confirm', 'session', 'sess-b')
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_session_revoke_confirm_id_sess-b',
      { entity_type: 'session', entity_id: 'sess-b' },
    )
  })

  it('lets callers override the derived params', () => {
    pushProfileEntityEvent('open', 'badge', 100, { entity_type: 'custom' })
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_badge_open_id_100',
      { entity_type: 'custom', entity_id: 100 },
    )
  })
})
