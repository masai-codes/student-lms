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

function renderHeader(showBatchDetails: boolean) {
  render(
    <LearnHeaderSection
      selectedBatch="133"
      batches={[
        {
          value: '133',
          label: 'Full Stack Web',
          courseLogo: null,
          showBatchDetails,
        },
      ]}
      onBatchChange={() => {}}
      sections={[]}
      selectedSectionId={null}
      onSectionChange={() => {}}
    />,
  )
}

function courseDetailsLink() {
  return screen.queryByRole('link', { name: /course details/i })
}

describe('LearnHeaderSection — Course Details link', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('links to the resolved legacy course page (new tab) when the batch opts in', () => {
    hoisted.getOldStudentUiUrlForPath.mockReturnValue(
      'https://old.example.com/new-courses/133',
    )
    renderHeader(true)

    expect(hoisted.getOldStudentUiUrlForPath).toHaveBeenCalledWith(
      '/new-courses/133',
    )
    const link = courseDetailsLink()
    expect(link?.getAttribute('href')).toBe(
      'https://old.example.com/new-courses/133',
    )
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('hides Course Details when the batch has showBatchDetails = false', () => {
    hoisted.getOldStudentUiUrlForPath.mockReturnValue(
      'https://old.example.com/new-courses/133',
    )
    renderHeader(false)

    expect(courseDetailsLink()).toBeNull()
    // Gated before resolving the URL — the resolver is never consulted.
    expect(hoisted.getOldStudentUiUrlForPath).not.toHaveBeenCalled()
  })

  it('hides Course Details when the legacy URL is not configured', () => {
    hoisted.getOldStudentUiUrlForPath.mockReturnValue(undefined)
    renderHeader(true)

    expect(courseDetailsLink()).toBeNull()
  })
})
