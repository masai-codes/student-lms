import { describe, expect, it } from 'vitest'
import { toEventFormState, toEventPatch } from './eventFormState'

const EDIT_DATA = {
  id: '5',
  columns: {
    title: 'Build Sprint',
    description: 'About',
    category: 'hackathon',
    mode: 'online',
    clubId: '7',
    locationTitle: null,
    locationMapLink: null,
    eventLink: 'https://meet',
    imageLink: 'https://cdn/i.png',
    platform: 'Meet',
    startTime: '2026-06-10T09:00:00.000Z',
    endTime: '2026-06-10T11:00:00.000Z',
  },
  clubs: [{ id: '7', name: 'Code Club' }],
  meta: {
    aboveTitle: 'FLAGSHIP',
    belowTitle: 'below',
    pastEventEmojiValue: '⚡',
    eventSummary: 'recap',
    confirmationModalText: 'confirm',
    isWeeklyConnect: true,
    isPublished: true,
    hostedBy: [{ host: 'Aman', imageUrl: 'https://cdn/a.png' }, 'bogus'],
  },
}

describe('toEventFormState', () => {
  it('seeds columns + meta, coercing flags and hosts', () => {
    const state = toEventFormState(EDIT_DATA)
    expect(state.title).toBe('Build Sprint')
    expect(state.category).toBe('hackathon')
    expect(state.mode).toBe('online')
    expect(state.startTime).toBe('2026-06-10T09:00:00.000Z')
    expect(state.clubId).toBe('7')
    expect(state.isWeeklyConnect).toBe(true)
    expect(state.isPublished).toBe(true)
    expect(state.hostedBy).toEqual([
      { host: 'Aman', imageUrl: 'https://cdn/a.png' },
    ])
  })

  it('falls back to empty values for null columns / missing meta', () => {
    const state = toEventFormState({
      id: '6',
      columns: {
        title: 'X',
        description: null,
        category: null,
        mode: null,
        clubId: null,
        locationTitle: null,
        locationMapLink: null,
        eventLink: null,
        imageLink: null,
        platform: null,
        startTime: null,
        endTime: null,
      },
      clubs: [],
      meta: {},
    })
    expect(state.description).toBe('')
    expect(state.mode).toBe('')
    expect(state.startTime).toBe('')
    expect(state.isPublished).toBe(false)
    expect(state.hostedBy).toEqual([])
  })
})

describe('toEventPatch', () => {
  it('maps columns + meta, nulling empty enums/dates', () => {
    const state = toEventFormState(EDIT_DATA)
    const patch = toEventPatch({
      ...state,
      category: '',
      mode: '',
      startTime: '',
    })
    expect(patch.column).toMatchObject({
      title: 'Build Sprint',
      category: null,
      mode: null,
      startTime: null,
    })
    expect(patch.meta).toMatchObject({
      isPublished: true,
      isWeeklyConnect: true,
      eventSummary: 'recap',
    })
  })
})
