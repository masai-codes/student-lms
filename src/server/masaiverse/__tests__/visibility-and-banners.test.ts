import { describe, expect, it } from 'vitest'
import {
  getMocks,
  mockSelectInnerJoinWhereChain,
  mockSelectWhereChain,
  registerCommonBeforeEach,
} from './testSetup'

registerCommonBeforeEach()
const mocks = getMocks()

describe('masaiverse visibility and banners', () => {
  it('showMasaiversePage returns false when user has no batches', async () => {
    const { showMasaiversePageHandler } = await import('../showMasaiversePage')
    mocks.dbSelect.mockReturnValueOnce(mockSelectInnerJoinWhereChain([]))

    await expect(showMasaiversePageHandler({ data: { userId: 11 } })).resolves.toBe(false)
  })

  it('showMasaiversePage parses meta and returns true when enabled', async () => {
    const { showMasaiversePageHandler } = await import('../showMasaiversePage')
    mocks.dbSelect
      .mockReturnValueOnce(mockSelectInnerJoinWhereChain([{ batchId: 'batch-1' }]))
      .mockReturnValueOnce(
        mockSelectWhereChain([
          { meta: '{"show_masaiverse":false}' },
          { meta: { show_masaiverse: true } },
        ]),
      )

    await expect(showMasaiversePageHandler({ data: { userId: 11 } })).resolves.toBe(true)
  })

  it('fetchMasaiverseBanners maps and normalizes db rows', async () => {
    const { fetchMasaiverseBannersHandler } = await import('../fetchMasaiverseBanners')
    mocks.dbExecute.mockResolvedValueOnce({
      rows: [
        {
          id: 'b-1',
          title: 'Banner 1',
          description: null,
          ctaText: '  Join Now  ',
          ctaUrl: '  https://example.com  ',
        },
      ],
    })

    await expect(fetchMasaiverseBannersHandler()).resolves.toEqual([
      {
        id: 'b-1',
        title: 'Banner 1',
        description: '',
        ctaText: 'Join Now',
        ctaUrl: 'https://example.com',
      },
    ])
  })

  it('fetchMasaiverseBanners throws stable error on db failure', async () => {
    const { fetchMasaiverseBannersHandler } = await import('../fetchMasaiverseBanners')
    mocks.dbExecute.mockRejectedValueOnce(new Error('db down'))

    await expect(fetchMasaiverseBannersHandler()).rejects.toThrow(
      'SERVER_ERROR_FETCHING_MASAIVERSE_BANNERS',
    )
  })
})
