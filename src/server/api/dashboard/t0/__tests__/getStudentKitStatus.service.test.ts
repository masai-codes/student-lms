import { describe, expect, it } from 'vitest'

import { toStudentKitStatus } from '../getStudentKitStatus.service'
import type { T0AdmissionsStatus } from '../getT0AdmissionsStatus.service'

/**
 * `toStudentKitStatus` is a pure projection of the admissions-derived
 * {@link T0AdmissionsStatus} onto the kit view the client consumes. All state
 * originates from the admissions `student-status` API — the four states are
 * not-applicable → details-not-filled → filled-pending-tracking → tracking.
 */
const status = (over: Partial<T0AdmissionsStatus> = {}): T0AdmissionsStatus => ({
  documentsRequired: false,
  documentsUploaded: false,
  documentsVerified: false,
  kitApplicable: true,
  kitDetailsFilled: false,
  trackingUrl: null,
  trackingId: null,
  idCardUrl: null,
  admissionsFormUrl: 'https://sso/kit-form',
  ...over,
})

describe('toStudentKitStatus', () => {
  it('is not applicable when there is no kit', () => {
    expect(toStudentKitStatus(status({ kitApplicable: false, admissionsFormUrl: 'https://sso/kit-form' }))).toEqual({
      applicable: false,
      detailsFilled: false,
      trackingUrl: null,
      trackingId: null,
      admissionsFormUrl: null,
    })
  })

  it('offers an admissions SSO form link when details are not filled', () => {
    const kit = toStudentKitStatus(status({ kitDetailsFilled: false }))
    expect(kit.applicable).toBe(true)
    expect(kit.detailsFilled).toBe(false)
    expect(kit.admissionsFormUrl).toBe('https://sso/kit-form')
  })

  it('is pending tracking when filled but no tracking url', () => {
    const kit = toStudentKitStatus(status({ kitDetailsFilled: true }))
    expect(kit).toMatchObject({ applicable: true, detailsFilled: true, trackingUrl: null, admissionsFormUrl: null })
  })

  it('surfaces the tracking url and id when the kit has shipped', () => {
    const kit = toStudentKitStatus(
      status({ kitDetailsFilled: true, trackingUrl: 'https://track/123', trackingId: 'CK540196281IN' }),
    )
    expect(kit).toMatchObject({
      applicable: true,
      detailsFilled: true,
      trackingUrl: 'https://track/123',
      trackingId: 'CK540196281IN',
    })
  })
})
