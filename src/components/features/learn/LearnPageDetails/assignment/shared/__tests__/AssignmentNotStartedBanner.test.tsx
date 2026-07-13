// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AssignmentNotStartedBanner } from '../AssignmentNotStartedBanner'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

const baseDetail = {
  id: 1,
  title: 'Sample',
  hostName: 'Instructor',
  displayDate: '20 May 2026',
  priority: 'mandatory' as const,
  tags: [],
  discussions: [],
  associatedItems: [],
  assignmentKind: 'assignment' as const,
  phase: 'before' as const,
  schedule: '2026-05-20T10:00:00.000Z',
  concludes: null,
  scheduleDisplayRange: '20 May 2026',
  hostAvatarUrl: null,
  instructions: null,
  enforceDeadline: false,
  phaseContent: {
    title: 'Assignment not open yet',
    description: 'Description',
    scheduleHint: 'Opens 20 May 2026.',
  },
  footer: {
    visible: false,
    meta: { submissionId: null, assessPlatformLink: null, platform: null },
    statusChip: null,
    showPracticeModeChip: false,
    score: null,
    notices: [],
    actions: [],
  },
  completedDetails: null,
  headerBadges: [],
  liveAnalytics: null,
  requiresPledge: false,
  problems: [],
  isBookmarked: false,
} satisfies AssignmentDetailPayload

describe('AssignmentNotStartedBanner', () => {
  it('renders kind-specific title and formatted schedule', () => {
    render(<AssignmentNotStartedBanner detail={baseDetail} />)

    expect(screen.getByTestId('assignment-not-started-banner')).toBeTruthy()
    expect(screen.getByRole('heading', { name: "Assignment hasn't started yet" })).toBeTruthy()
    expect(screen.getByText(/Assignment will be unlocked and available at/)).toBeTruthy()
  })

  it('falls back when schedule is missing', () => {
    render(
      <AssignmentNotStartedBanner
        detail={{ ...baseDetail, schedule: null }}
      />,
    )

    expect(screen.getByText('the scheduled time')).toBeTruthy()
  })
})
