import type { SimulatedOnwardStatus } from './types'

export interface SimulatedOnwardOverrides {
  documentsRequired?: boolean
  documentsUploaded?: boolean
  kitShowKit?: boolean
  kitDetailsFilled?: boolean
  kitTrackingUrl?: string | null
}

/**
 * Builds a fake onward `/lms/student-status` response for one student. Only
 * the 5 fields the LMS reads are configurable; everything else is fixed at a
 * default the LMS doesn't currently consume, kept only so the payload matches
 * onward's real contract shape.
 */
export function buildSimulatedOnwardStatus(
  overrides: SimulatedOnwardOverrides = {},
): SimulatedOnwardStatus {
  const kitShowKit = overrides.kitShowKit ?? false

  return {
    documents: {
      required: overrides.documentsRequired ?? false,
      instituteSideUpload: false,
      documentsUploaded: overrides.documentsUploaded ?? false,
      documentsVerified: false,
      documentsPendingVerification: false,
    },
    kit: {
      showKit: kitShowKit,
      welcomeKitUrl: null,
      // Kit sub-fields are meaningless while the kit itself isn't shown.
      detailsFilled: kitShowKit ? (overrides.kitDetailsFilled ?? false) : false,
      details: null,
      tracking: kitShowKit ? (overrides.kitTrackingUrl ?? null) : null,
    },
  }
}
