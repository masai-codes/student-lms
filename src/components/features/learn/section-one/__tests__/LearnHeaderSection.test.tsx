// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LearnHeaderSection } from '../LearnHeaderSection'

const hoisted = vi.hoisted(() => ({ getOldStudentUiUrlForPath: vi.fn() }))

vi.mock('@/utils/authRedirect', () => ({
  getOldStudentUiUrlForPath: hoisted.getOldStudentUiUrlForPath,
}))
vi.mock('@/components/ui/masai-drawer', () => ({
  MasaiDrawer: () => null,
}))

const BATCHES = [{ value: '133', label: 'Full Stack Web', courseLogo: null }]

function renderHeader() {
  return render(
    <LearnHeaderSection
      selectedBatch="133"
      batches={BATCHES}
      onBatchChange={() => {}}
    />,
  )
}

describe('LearnHeaderSection — Course Details link', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('links Course Details to the resolved legacy course page for the batch in a new tab', () => {
    hoisted.getOldStudentUiUrlForPath.mockReturnValue(
      'https://old.example.com/new-courses/133',
    )
    renderHeader()

    expect(hoisted.getOldStudentUiUrlForPath).toHaveBeenCalledWith(
      '/new-courses/133',
    )
    const link = screen.getByRole('link', { name: /course details/i })
    expect(link.getAttribute('href')).toBe(
      'https://old.example.com/new-courses/133',
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('hides Course Details when the legacy URL is not configured', () => {
    hoisted.getOldStudentUiUrlForPath.mockReturnValue(undefined)
    renderHeader()

    expect(screen.queryByRole('link', { name: /course details/i })).toBeNull()
  })
})
