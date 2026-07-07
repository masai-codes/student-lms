import { describe, expect, it } from 'vitest'
import {
  IHUB_BATCH_DURATION,
  batchVisibleOnPortal,
  isIHubBatch,
} from '../portalBatchScope'

describe('isIHubBatch', () => {
  it('treats only the "ihub" duration as an iHub batch', () => {
    expect(isIHubBatch(IHUB_BATCH_DURATION)).toBe(true)
    expect(isIHubBatch('ihub')).toBe(true)
    expect(isIHubBatch('6')).toBe(false)
    expect(isIHubBatch('masai')).toBe(false)
    expect(isIHubBatch(null)).toBe(false)
    expect(isIHubBatch(undefined)).toBe(false)
  })
})

describe('batchVisibleOnPortal', () => {
  it('iHub portal only sees iHub batches', () => {
    expect(batchVisibleOnPortal('ihub', 'ihub')).toBe(true)
    expect(batchVisibleOnPortal('6', 'ihub')).toBe(false)
    expect(batchVisibleOnPortal(null, 'ihub')).toBe(false)
  })

  it('Masai portal only sees non-iHub batches', () => {
    expect(batchVisibleOnPortal('ihub', 'masai')).toBe(false)
    expect(batchVisibleOnPortal('6', 'masai')).toBe(true)
    expect(batchVisibleOnPortal(null, 'masai')).toBe(true)
  })
})
