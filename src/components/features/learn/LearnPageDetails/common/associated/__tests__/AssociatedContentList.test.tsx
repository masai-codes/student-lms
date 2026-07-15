// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AssociatedContentList } from '../AssociatedContentList'
import type { LearningItem } from '@/server/learn/types'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    [key: string]: unknown
  }) => <a {...props}>{children}</a>,
}))

function learningItem(
  id: number,
  learningType: LearningItem['learningType'],
  title: string,
): LearningItem {
  return {
    id,
    learningType,
    title,
    hostName: 'Host',
    scheduleDate: null,
    concludes: null,
    type: learningType === 'resource' ? 'reading' : learningType,
    category: 'coding',
    isOptional: 'mandatory',
    moduleName: 'Module 1',
    attendance: null,
    optionalAttendance: null,
    assignmentProgressStatus: null,
    resourcePhase: null,
    listingCtas: {
      joinLive: 'hidden',
      joinZoomLink: null,
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      showAttendance: false,
      assignmentStatusChip: null,
      assignmentDeadlineLabel: null,
      assignmentScore: null,
    },
  }
}

describe('AssociatedContentList', () => {
  afterEach(() => cleanup())

  it('renders nothing when there are no items', () => {
    const { container } = render(<AssociatedContentList items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the /learn card grouped into kind sections', () => {
    render(
      <AssociatedContentList
        items={[
          learningItem(2, 'lecture', 'Lecture Two'),
          learningItem(3, 'resource', 'Reading Three'),
          learningItem(7, 'assignment', 'Assignment Seven'),
        ]}
      />,
    )

    expect(screen.getByText('Lectures')).toBeTruthy()
    expect(screen.getByText('Resources')).toBeTruthy()
    expect(screen.getByText('Assignments')).toBeTruthy()

    // The card title renders, and its link points at the entity route.
    const lectureSection = screen.getByTestId(
      'learn-associated-section-lecture',
    )
    expect(within(lectureSection).getByText('Lecture Two')).toBeTruthy()
    const link = within(lectureSection).getByText('Lecture Two').closest('a')
    expect(link?.getAttribute('to')).toBe('/lectures/$lectureId')
  })

  it('omits a section with no items for that kind', () => {
    render(
      <AssociatedContentList
        items={[learningItem(7, 'assignment', 'Only Assignment')]}
      />,
    )

    expect(screen.queryByTestId('learn-associated-section-lecture')).toBeNull()
    expect(
      screen.getByTestId('learn-associated-section-assignment'),
    ).toBeTruthy()
  })
})
