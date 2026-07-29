import { describe, expect, it } from 'vitest'
import {
  IHUB_BATCH_DURATION,
  IITJ_BATCH_DURATION,
  batchVisibleOnPortal,
  isIHubBatch,
  isIITJBatch,
} from '../portalBatchScope'

describe('isIHubBatch', () => {
  it('treats only the "ihub" duration as an iHub batch', () => {
    expect(isIHubBatch(IHUB_BATCH_DURATION)).toBe(true)
    expect(isIHubBatch('ihub')).toBe(true)
    expect(isIHubBatch('iitj')).toBe(false)
    expect(isIHubBatch('6')).toBe(false)
    expect(isIHubBatch('masai')).toBe(false)
    expect(isIHubBatch(null)).toBe(false)
    expect(isIHubBatch(undefined)).toBe(false)
  })
})

describe('isIITJBatch', () => {
  it('treats only the "iitj" duration as an IIT Jodhpur batch', () => {
    expect(isIITJBatch(IITJ_BATCH_DURATION)).toBe(true)
    expect(isIITJBatch('iitj')).toBe(true)
    expect(isIITJBatch('ihub')).toBe(false)
    expect(isIITJBatch('6')).toBe(false)
    expect(isIITJBatch(null)).toBe(false)
    expect(isIITJBatch(undefined)).toBe(false)
  })
})

describe('batchVisibleOnPortal', () => {
  it('iHub portal only sees iHub batches', () => {
    expect(batchVisibleOnPortal('ihub', 'ihub')).toBe(true)
    expect(batchVisibleOnPortal('iitj', 'ihub')).toBe(false)
    expect(batchVisibleOnPortal('6', 'ihub')).toBe(false)
    expect(batchVisibleOnPortal(null, 'ihub')).toBe(false)
  })

  it('IIT Jodhpur portal only sees IIT Jodhpur batches', () => {
    expect(batchVisibleOnPortal('iitj', 'iitj')).toBe(true)
    expect(batchVisibleOnPortal('ihub', 'iitj')).toBe(false)
    expect(batchVisibleOnPortal('6', 'iitj')).toBe(false)
    expect(batchVisibleOnPortal(null, 'iitj')).toBe(false)
  })

  it('Masai portal sees neither iHub nor IIT Jodhpur batches', () => {
    expect(batchVisibleOnPortal('ihub', 'masai')).toBe(false)
    expect(batchVisibleOnPortal('iitj', 'masai')).toBe(false)
    expect(batchVisibleOnPortal('6', 'masai')).toBe(true)
    expect(batchVisibleOnPortal(null, 'masai')).toBe(true)
  })
})
