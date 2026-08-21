import { describe, expect, it } from 'vitest'
import {
  CATEGORIES,
  getFloatingChatCategories,
  IITJ_ASSIGNMENT_PRACTICE_ID,
  normalizeFloatingChatCategoryId,
} from '../mockData'

describe('getFloatingChatCategories', () => {
  it('returns the default labels for non-iitj students', () => {
    expect(getFloatingChatCategories(false)).toEqual(CATEGORIES)
  })

  it('relabels lecture/assignment/resource/evaluation for iitj students', () => {
    const categories = getFloatingChatCategories(true)

    expect(categories.find((c) => c.id === 'lecture')?.label).toBe(
      'Course content related doubt',
    )
    expect(categories.find((c) => c.id === 'assignment')?.label).toBe(
      'Assignment / Quiz',
    )
    expect(categories.find((c) => c.id === 'resource')?.label).toBe(
      'Course study material',
    )
    expect(categories.find((c) => c.id === 'evaluation')?.label).toBe(
      'Offline Major exams',
    )
  })

  it('leaves the general category and every other field untouched for iitj students', () => {
    const categories = getFloatingChatCategories(true)
    const general = categories.find((c) => c.id === 'general')
    const defaultGeneral = CATEGORIES.find((c) => c.id === 'general')

    expect(general).toEqual(defaultGeneral)

    const lecture = categories.find((c) => c.id === 'lecture')
    const defaultLecture = CATEGORIES.find((c) => c.id === 'lecture')
    expect(lecture?.id).toBe(defaultLecture?.id)
    expect(lecture?.desc).toBe(defaultLecture?.desc)
    expect(lecture?.icon).toBe(defaultLecture?.icon)
  })

  it('never mutates the shared CATEGORIES constant', () => {
    const before = CATEGORIES.map((c) => c.label)
    getFloatingChatCategories(true)
    expect(CATEGORIES.map((c) => c.label)).toEqual(before)
  })

  it('adds a duplicate "Non graded practice exercises" chip right after assignment for iitj students', () => {
    const categories = getFloatingChatCategories(true)
    const assignmentIndex = categories.findIndex((c) => c.id === 'assignment')
    const practiceIndex = categories.findIndex(
      (c) => c.id === IITJ_ASSIGNMENT_PRACTICE_ID,
    )

    expect(practiceIndex).toBe(assignmentIndex + 1)

    const assignment = categories[assignmentIndex]
    const practice = categories[practiceIndex]
    expect(practice.label).toBe('Non graded practice exercises')
    expect(practice.desc).toBe(assignment.desc)
    expect(practice.icon).toBe(assignment.icon)
  })

  it('does not add the practice-exercise chip for non-iitj students', () => {
    const categories = getFloatingChatCategories(false)
    expect(categories.some((c) => c.id === IITJ_ASSIGNMENT_PRACTICE_ID)).toBe(
      false,
    )
    expect(categories).toHaveLength(CATEGORIES.length)
  })
})

describe('normalizeFloatingChatCategoryId', () => {
  it('normalizes the practice-exercise chip to assignment', () => {
    expect(normalizeFloatingChatCategoryId(IITJ_ASSIGNMENT_PRACTICE_ID)).toBe(
      'assignment',
    )
  })

  it('passes every other id through unchanged', () => {
    for (const id of [
      'lecture',
      'assignment',
      'resource',
      'evaluation',
      'general',
    ]) {
      expect(normalizeFloatingChatCategoryId(id)).toBe(id)
    }
  })
})
