import { describe, expect, it } from 'vitest'

import {
  buildBatchUserMeta,
  parseBatchUserMeta,
} from '@/server/api/webhooks/admissions/utils/batchUserMeta'

describe('parseBatchUserMeta', () => {
  it('returns an empty object for null/empty', () => {
    expect(parseBatchUserMeta(null)).toEqual({})
    expect(parseBatchUserMeta('')).toEqual({})
  })

  it('parses a plain object string', () => {
    expect(parseBatchUserMeta('{"isIhub":true,"batchPaused":true}')).toEqual({
      isIhub: true,
      batchPaused: true,
    })
  })

  it('flattens the legacy array-of-objects form', () => {
    expect(
      parseBatchUserMeta('[{"Student":"2022-07-25"},{"batchPaused":true}]'),
    ).toEqual({
      Student: '2022-07-25',
      batchPaused: true,
    })
  })

  it('returns an empty object for malformed json', () => {
    expect(parseBatchUserMeta('not json')).toEqual({})
  })
})

describe('buildBatchUserMeta', () => {
  it('merges the patch while preserving existing keys', () => {
    const result = buildBatchUserMeta('{"isIhub":true,"batchPaused":true}', {
      batchEnrolmentCancelled: true,
      batchEnrolmentCancelledDate: '2026-07-24',
    })
    expect(JSON.parse(result)).toEqual({
      isIhub: true,
      batchPaused: true,
      batchEnrolmentCancelled: true,
      batchEnrolmentCancelledDate: '2026-07-24',
    })
  })

  it('removeKeys drops the cancel keys on revive (absence = not cancelled)', () => {
    const result = buildBatchUserMeta(
      '{"batchEnrolmentCancelled":true,"batchEnrolmentCancelledDate":"2026-07-24","batchPaused":true}',
      { isIhub: false },
      ['batchEnrolmentCancelled', 'batchEnrolmentCancelledDate'],
    )
    const parsed = JSON.parse(result)
    expect(parsed).toEqual({ isIhub: false, batchPaused: true })
    expect('batchEnrolmentCancelled' in parsed).toBe(false)
    expect('batchEnrolmentCancelledDate' in parsed).toBe(false)
  })

  it('removeKeys applies even when the key was also in the patch', () => {
    const result = buildBatchUserMeta('{"a":1}', { b: 2 }, ['b'])
    expect(JSON.parse(result)).toEqual({ a: 1 })
  })

  it('builds fresh meta from null', () => {
    expect(JSON.parse(buildBatchUserMeta(null, { isIhub: false }))).toEqual({
      isIhub: false,
    })
  })
})
