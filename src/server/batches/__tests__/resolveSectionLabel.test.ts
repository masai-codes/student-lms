import { describe, expect, it } from 'vitest'

import {
  resolveSectionDisplayName,
  resolveSectionLabel,
  resolveSectionLabelFromColumns,
} from '../resolveSectionLabel'

describe('resolveSectionLabel', () => {
  it('prefers settings.sectionDisplayName over the raw name', () => {
    expect(
      resolveSectionLabel('IITREICT_AIML_2604_M1_101', {
        sectionDisplayName: 'AI & ML — Module 1',
      }),
    ).toBe('AI & ML — Module 1')
  })

  it('trims the display name', () => {
    expect(
      resolveSectionLabel('CODE', { sectionDisplayName: '  Nice  ' }),
    ).toBe('Nice')
  })

  it.each([
    ['absent', {}],
    ['blank', { sectionDisplayName: '   ' }],
    ['non-string', { sectionDisplayName: 42 }],
    ['null settings', null],
    ['undefined settings', undefined],
  ])(
    'falls back to the name when the display name is %s',
    (_label, settings) => {
      expect(resolveSectionLabel('CODE', settings)).toBe('CODE')
    },
  )

  it('returns an empty string when neither is available', () => {
    expect(resolveSectionLabel(null, null)).toBe('')
  })
})

describe('resolveSectionDisplayName', () => {
  it('returns the trimmed display name or an empty string', () => {
    expect(resolveSectionDisplayName({ sectionDisplayName: ' X ' })).toBe('X')
    expect(resolveSectionDisplayName({})).toBe('')
    expect(resolveSectionDisplayName('not an object')).toBe('')
  })
})

describe('resolveSectionLabelFromColumns', () => {
  it('prefers the projected display name', () => {
    expect(resolveSectionLabelFromColumns('CODE', 'Friendly')).toBe('Friendly')
  })

  // MySQL `->>` renders a JSON null as the literal string 'null'.
  it.each([null, undefined, '', '   ', 'null'])(
    'falls back to the name for %p',
    (displayName) => {
      expect(resolveSectionLabelFromColumns('CODE', displayName)).toBe('CODE')
    },
  )
})
