import { describe, expect, it } from 'vitest'

import {
  formatLearnDetailHostName,
  formatLearnDetailPriorityLabel,
  formatLearnDetailTagLabel,
} from '../formatLearnDetailDisplay'

describe('formatLearnDetailTagLabel', () => {
  it('capitalizes single-word tags', () => {
    expect(formatLearnDetailTagLabel('live')).toBe('Live')
    expect(formatLearnDetailTagLabel('practice')).toBe('Practice')
  })

  it('capitalizes hyphenated tags', () => {
    expect(formatLearnDetailTagLabel('pre-read')).toBe('Pre-Read')
    expect(formatLearnDetailTagLabel('interactive-video')).toBe(
      'Interactive-Video',
    )
  })

  it('capitalizes multi-word labels', () => {
    expect(formatLearnDetailTagLabel('module 1')).toBe('Module 1')
  })
})

describe('formatLearnDetailHostName', () => {
  it('title-cases host names', () => {
    expect(formatLearnDetailHostName('john doe')).toBe('John Doe')
    expect(formatLearnDetailHostName('RAVI KUMAR')).toBe('Ravi Kumar')
  })
})

describe('formatLearnDetailPriorityLabel', () => {
  it('capitalizes priority', () => {
    expect(formatLearnDetailPriorityLabel('mandatory')).toBe('Mandatory')
    expect(formatLearnDetailPriorityLabel('recommended')).toBe('Recommended')
  })
})
