import { describe, expect, it } from 'vitest'
import { toClubFormState, toClubPatch } from './clubFormState'

describe('toClubFormState', () => {
  it('seeds every field from name + meta, coercing types', () => {
    const state = toClubFormState({
      name: 'Programming Club',
      meta: {
        description: 'About',
        cardImageLink: 'https://cdn/c.png',
        galleryImages: ['https://cdn/1.png', 42, 'https://cdn/2.png'],
        projectsBuild: 12,
        cardDescription: 'card',
        aboutCardDetails: [
          { heading: 'Founded', value: '2023' },
          'bogus',
        ],
        belowTitleCardText: 'below',
        learningTenureData: [
          { emoji: '⚡', heading: 'H', text: 'T', tags: ['a', 7, 'b'] },
        ],
        clubDetailBannerTags: ['x', 'y'],
        confirmationModalText: 'confirm',
        learningTenureDateText: '20-26 June',
        isPublished: true,
      },
    })

    expect(state).toEqual({
      name: 'Programming Club',
      description: 'About',
      cardImageLink: 'https://cdn/c.png',
      galleryImages: ['https://cdn/1.png', 'https://cdn/2.png'],
      projectsBuild: '12',
      cardDescription: 'card',
      aboutCardDetails: [{ heading: 'Founded', value: '2023' }],
      belowTitleCardText: 'below',
      learningTenureData: [
        { emoji: '⚡', heading: 'H', text: 'T', tags: ['a', 'b'] },
      ],
      clubDetailBannerTags: ['x', 'y'],
      confirmationModalText: 'confirm',
      learningTenureDateText: '20-26 June',
      isPublished: true,
    })
  })

  it('falls back to empty values for missing/empty meta', () => {
    const state = toClubFormState({ name: 'Empty', meta: {} })
    expect(state.description).toBe('')
    expect(state.galleryImages).toEqual([])
    expect(state.projectsBuild).toBe('')
    expect(state.aboutCardDetails).toEqual([])
    expect(state.learningTenureData).toEqual([])
    expect(state.clubDetailBannerTags).toEqual([])
  })
})

describe('toClubPatch', () => {
  it('maps name to a column and everything else to meta, coercing projects to a number', () => {
    const patch = toClubPatch({
      name: 'New name',
      description: 'd',
      cardImageLink: 'img',
      galleryImages: ['g1'],
      projectsBuild: '7',
      cardDescription: 'cd',
      aboutCardDetails: [{ heading: 'h', value: 'v' }],
      belowTitleCardText: 'b',
      learningTenureData: [],
      clubDetailBannerTags: ['t'],
      confirmationModalText: 'c',
      learningTenureDateText: 'date',
    })

    expect(patch.column).toEqual({ name: 'New name' })
    expect(patch.meta).toMatchObject({
      description: 'd',
      cardImageLink: 'img',
      galleryImages: ['g1'],
      projectsBuild: 7,
      clubDetailBannerTags: ['t'],
    })
  })

  it('defaults projectsBuild to 0 when not a number', () => {
    const patch = toClubPatch({
      name: 'n',
      description: '',
      cardImageLink: '',
      galleryImages: [],
      projectsBuild: 'abc',
      cardDescription: '',
      aboutCardDetails: [],
      belowTitleCardText: '',
      learningTenureData: [],
      clubDetailBannerTags: [],
      confirmationModalText: '',
      learningTenureDateText: '',
    })
    expect(patch.meta?.projectsBuild).toBe(0)
  })
})
