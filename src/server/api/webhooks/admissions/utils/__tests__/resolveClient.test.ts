import { describe, expect, it } from 'vitest'

import { resolveClient } from '@/server/api/webhooks/admissions/utils/resolveClient'

describe('resolveClient', () => {
  it('maps isiHub=true to the ihub client', () => {
    expect(resolveClient({ isiHub: true })).toBe('ihub')
  })

  it('maps isiitj=true to the iitj client', () => {
    expect(resolveClient({ isiitj: true })).toBe('iitj')
  })

  it('prefers iitj when both portal flags are true', () => {
    expect(resolveClient({ isiHub: true, isiitj: true })).toBe('iitj')
  })

  it('maps both flags false to the masai client', () => {
    expect(resolveClient({ isiHub: false, isiitj: false })).toBe('masai')
  })

  it('defaults to masai when the portal flags are omitted', () => {
    expect(resolveClient({})).toBe('masai')
  })
})
