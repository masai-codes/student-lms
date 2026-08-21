import { describe, expect, it } from 'vitest'
import {
  filterCallbackReasons,
  hasPendingCallbackForBatch,
} from '@/components/common/floating-chat/callbackHelpers'

describe('hasPendingCallbackForBatch', () => {
  it('returns true when a pending callback exists for the batch', () => {
    expect(
      hasPendingCallbackForBatch(
        [
          {
            id: 1,
            batchId: 10,
            category: 'Fees',
            status: 'pending',
            preferredTimeSlot: '11 AM',
            createdAt: null,
            updatedAt: null,
          },
        ],
        10,
      ),
    ).toBe(true)
  })

  it('ignores resolved callbacks and other batches', () => {
    expect(
      hasPendingCallbackForBatch(
        [
          {
            id: 1,
            batchId: 10,
            category: 'Fees',
            status: 'resolved',
            preferredTimeSlot: null,
            createdAt: null,
            updatedAt: null,
          },
          {
            id: 2,
            batchId: 11,
            category: 'Query',
            status: 'pending',
            preferredTimeSlot: null,
            createdAt: null,
            updatedAt: null,
          },
        ],
        10,
      ),
    ).toBe(false)
  })
})

describe('filterCallbackReasons', () => {
  it('hides Student-Kit unless full fees are paid', () => {
    const reasons = [{ value: 'Program Query' }, { value: 'Student-Kit' }]
    expect(filterCallbackReasons(reasons, false)).toEqual(['Program Query'])
    expect(filterCallbackReasons(reasons, true)).toEqual([
      'Program Query',
      'Student-Kit',
    ])
  })
})
