import { describe, expect, it } from 'vitest'
import { formatGreetingName } from './greeting'

describe('formatGreetingName', () => {
  it('shows a short name in full (trimmed)', () => {
    expect(formatGreetingName('  Suryakumar  ')).toBe('Suryakumar')
  })

  it('falls back to the first name for a long full name', () => {
    expect(formatGreetingName('Suryakumar Venkatasubramanian Iyer')).toBe(
      'Suryakumar',
    )
  })

  it('truncates a very long single first name with an ellipsis', () => {
    expect(formatGreetingName('Venkatanarasimharajuvaripeta')).toBe(
      'Venkatanarasimharaj…',
    )
    expect(formatGreetingName('Venkatanarasimharajuvaripeta')).toHaveLength(20)
  })
})
