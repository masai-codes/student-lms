import { describe, expect, it } from 'vitest'

import { resolveClient } from '@/server/api/webhooks/admissions/utils/resolveClient'

describe('resolveClient', () => {
  it('maps isiHub=true to the ihub client', () => {
    expect(resolveClient(true)).toBe('ihub')
  })

  it('maps isiHub=false to the masai client', () => {
    expect(resolveClient(false)).toBe('masai')
  })

  it('defaults to masai when isiHub is omitted', () => {
    expect(resolveClient()).toBe('masai')
  })
})
