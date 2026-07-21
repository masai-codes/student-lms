import { describe, expect, it } from 'vitest'

import {
  makeAssociationNodeKey,
  parseAssociationNodeKey,
} from '../associationGraphTypes'

describe('associationGraphTypes', () => {
  it('round-trips node keys for both kinds', () => {
    expect(makeAssociationNodeKey('lecture', 42)).toBe('lecture:42')
    expect(makeAssociationNodeKey('assignment', 7)).toBe('assignment:7')
    expect(parseAssociationNodeKey('lecture:42')).toEqual({
      kind: 'lecture',
      id: 42,
    })
    expect(parseAssociationNodeKey('assignment:7')).toEqual({
      kind: 'assignment',
      id: 7,
    })
  })
})
