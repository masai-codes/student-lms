import { describe, expect, it } from 'vitest'

import { buildSimulatedOnwardStatus } from './buildSimulatedOnwardStatus'

describe('buildSimulatedOnwardStatus', () => {
  it('defaults to nothing required/shown/uploaded', () => {
    expect(buildSimulatedOnwardStatus()).toEqual({
      documents: {
        required: false,
        instituteSideUpload: false,
        documentsUploaded: false,
        documentsVerified: false,
        documentsPendingVerification: false,
      },
      kit: {
        showKit: false,
        welcomeKitUrl: null,
        detailsFilled: false,
        details: null,
        tracking: null,
      },
    })
  })

  it('applies the 5 configurable overrides', () => {
    const status = buildSimulatedOnwardStatus({
      documentsRequired: true,
      documentsUploaded: true,
      kitShowKit: true,
      kitDetailsFilled: true,
      kitTrackingUrl: 'https://tracking.example.com/ABC',
    })

    expect(status.documents.required).toBe(true)
    expect(status.documents.documentsUploaded).toBe(true)
    expect(status.kit.showKit).toBe(true)
    expect(status.kit.detailsFilled).toBe(true)
    expect(status.kit.tracking).toBe('https://tracking.example.com/ABC')
  })

  it('ignores kit sub-fields when the kit is not shown', () => {
    const status = buildSimulatedOnwardStatus({
      kitShowKit: false,
      kitDetailsFilled: true,
      kitTrackingUrl: 'https://tracking.example.com/ABC',
    })

    expect(status.kit.showKit).toBe(false)
    expect(status.kit.detailsFilled).toBe(false)
    expect(status.kit.tracking).toBeNull()
  })
})
