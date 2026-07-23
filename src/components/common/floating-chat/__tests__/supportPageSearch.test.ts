import { describe, expect, it } from 'vitest'

import { parseSupportPageContextSearch } from '@/components/common/floating-chat/supportPageSearch'

describe('parseSupportPageContextSearch', () => {
  it('parses valid lecture context params', () => {
    expect(
      parseSupportPageContextSearch({ category: 'lecture', entityId: '157894' }),
    ).toEqual({ category: 'lecture', entityId: 157894 })
  })

  it('accepts numeric entityId', () => {
    expect(
      parseSupportPageContextSearch({ category: 'assignment', entityId: 42 }),
    ).toEqual({ category: 'assignment', entityId: 42 })
  })

  it('trims category whitespace', () => {
    expect(
      parseSupportPageContextSearch({ category: ' resource ', entityId: 1 }),
    ).toEqual({ category: 'resource', entityId: 1 })
  })

  it('rejects unknown categories', () => {
    expect(
      parseSupportPageContextSearch({ category: 'batch', entityId: 1 }),
    ).toBeNull()
  })

  it('rejects missing or invalid entityId', () => {
    expect(parseSupportPageContextSearch({ category: 'lecture' })).toBeNull()
    expect(
      parseSupportPageContextSearch({ category: 'lecture', entityId: '0' }),
    ).toBeNull()
    expect(
      parseSupportPageContextSearch({ category: 'lecture', entityId: '-3' }),
    ).toBeNull()
    expect(
      parseSupportPageContextSearch({ category: 'lecture', entityId: 'abc' }),
    ).toBeNull()
  })
})
