import { describe, expect, it } from 'vitest'
import { IITJ_ASSIGNMENT_PRACTICE_ID } from '../mockData'
import { mapSupportCategoryToTicketCategory } from '../ticketCategoryMapping'

describe('mapSupportCategoryToTicketCategory', () => {
  it('maps "general" to the legacy underscore value', () => {
    expect(mapSupportCategoryToTicketCategory('general')).toBe('general_query')
  })

  it("maps iitj's practice-exercise chip to the same assignment category", () => {
    expect(
      mapSupportCategoryToTicketCategory(IITJ_ASSIGNMENT_PRACTICE_ID),
    ).toBe('assignment')
  })

  it('passes every other category through unchanged', () => {
    expect(mapSupportCategoryToTicketCategory('lecture')).toBe('lecture')
    expect(mapSupportCategoryToTicketCategory('assignment')).toBe('assignment')
    expect(mapSupportCategoryToTicketCategory('resource')).toBe('resource')
    expect(mapSupportCategoryToTicketCategory('evaluation')).toBe('evaluation')
  })
})
