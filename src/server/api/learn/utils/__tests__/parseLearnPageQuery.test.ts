import { describe, expect, it } from 'vitest'

import { parseLearnPageQuery } from '@/server/api/learn/utils/parseLearnPageQuery'

function parse(query: string) {
  return parseLearnPageQuery(
    new URL(`http://localhost/api/learn/page?${query}`),
  )
}

describe('parseLearnPageQuery', () => {
  it('throws when learningType is missing or invalid', () => {
    expect(() => parse('batchId=1')).toThrow('INVALID_LEARNING_TYPE')
    expect(() => parse('learningType=videos')).toThrow('INVALID_LEARNING_TYPE')
  })

  it('parses a minimal query with an optional, omitted batchId', () => {
    expect(parse('learningType=lecture')).toEqual({
      batchId: undefined,
      learningType: 'lecture',
      search: undefined,
      page: undefined,
      pageSize: undefined,
      filters: undefined,
    })
  })

  it('parses batchId, paging, search and plural filter params', () => {
    const result = parse(
      'batchId=10&learningType=lecture&page=2&pageSize=25&search=react' +
        '&modules=Module 1&categories=coding&types=live&priorities=recommended' +
        '&instructors=Ana&scheduleStartDate=2026-06-01&scheduleEndDate=2026-06-10' +
        '&lectureTab=upcoming&attendanceStatus=present',
    )
    expect(result.batchId).toBe(10)
    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(25)
    expect(result.search).toBe('react')
    expect(result.filters).toMatchObject({
      modules: ['Module 1'],
      categories: ['coding'],
      types: ['live'],
      priorities: ['recommended'],
      instructors: ['Ana'],
      scheduleStartDate: '2026-06-01',
      scheduleEndDate: '2026-06-10',
      schedulePhase: 'upcoming',
      attendanceStatus: 'present',
    })
  })

  it('maps the legacy optional + assignmentTab params', () => {
    const result = parse(
      'learningType=assignment&optional=no&assignmentTab=overdue',
    )
    expect(result.filters?.priorities).toEqual(['mandatory'])
    expect(result.filters?.assignmentProgressStatuses).toEqual(['overdue'])
  })

  it('returns undefined filters when nothing filterable is provided', () => {
    expect(
      parse('learningType=resource&lectureTab=all').filters,
    ).toBeUndefined()
  })
})
