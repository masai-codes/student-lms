import { describe, expect, it } from 'vitest'

import { ApiClientError } from '@/lib/api/apiClientError'
import { getEntityLaunchErrorMessage } from '@/components/common/floating-chat/entityLaunchErrorMessage'

describe('getEntityLaunchErrorMessage', () => {
  it('maps lecture not found to a clear message', () => {
    expect(
      getEntityLaunchErrorMessage({
        error: new ApiClientError(404, { code: 'SUPPORT_LECTURE_NOT_FOUND' }),
        category: 'lecture',
        entityId: 177893,
      }),
    ).toBe("Lecture #177893 couldn't be found, or you don't have access to it.")
  })

  it('maps batch unknown client failures', () => {
    expect(
      getEntityLaunchErrorMessage({
        reason: 'batch_unknown',
        category: 'lecture',
        entityId: 12,
      }),
    ).toContain("Lecture #12 belongs to a course that isn't available")
  })

  it('falls back for unknown API errors', () => {
    expect(
      getEntityLaunchErrorMessage({
        error: new ApiClientError(500, { code: 'SUPPORT_SERVER_ERROR' }),
        category: 'assignment',
        entityId: 3,
      }),
    ).toBe("We couldn't open support for Assignment #3. Please try again or continue without this item.")
  })
})
