import { describe, expect, it } from 'vitest'
import {
  getMocks,
  mockSelectInnerJoinWhereChain,
  mockSelectWhereChain,
  registerCommonBeforeEach,
} from './testSetup'

registerCommonBeforeEach()
const mocks = getMocks()

describe('masaiverse visibility', () => {
  it('showMasaiversePage returns false when user has no batches', async () => {
    const { showMasaiversePageHandler } = await import('../showMasaiversePage')
    mocks.dbSelect
      // getBatchIdsForEnrolledUser: section-enrollment query…
      .mockReturnValueOnce(mockSelectInnerJoinWhereChain([]))
      // …then the batch-restrictions query (getUserBatchRestrictions).
      .mockReturnValueOnce(mockSelectWhereChain([]))

    await expect(
      showMasaiversePageHandler({ data: { userId: 11 } }),
    ).resolves.toBe(false)
  })

  it('showMasaiversePage parses meta and returns true when enabled', async () => {
    const { showMasaiversePageHandler } = await import('../showMasaiversePage')
    mocks.dbSelect
      // getBatchIdsForEnrolledUser: section-enrollment query…
      .mockReturnValueOnce(
        mockSelectInnerJoinWhereChain([{ batchId: 'batch-1' }]),
      )
      // …then the batch-restrictions query (getUserBatchRestrictions)…
      .mockReturnValueOnce(mockSelectWhereChain([]))
      // …then the batch-meta lookup.
      .mockReturnValueOnce(
        mockSelectWhereChain([
          { meta: '{"show_masaiverse":false}' },
          { meta: { show_masaiverse: true } },
        ]),
      )

    await expect(
      showMasaiversePageHandler({ data: { userId: 11 } }),
    ).resolves.toBe(true)
  })
})
