// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AssignmentDetailStickyFooter } from '../AssignmentDetailStickyFooter'
import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

const baseDetail = {
  id: 1,
  title: 'Test Assignment',
  hostName: 'Host',
  displayDate: 'May 20',
  priority: 'mandatory',
  tags: [],
  discussions: [],
  associatedItems: [],
  assignmentKind: 'assignment',
  phase: 'during',
  schedule: '2026-05-20T10:00:00.000Z',
  concludes: '2026-05-20T12:00:00.000Z',
  scheduleDisplayRange: 'May 20',
  hostAvatarUrl: null,
  instructions: null,
  emptyInstructionsMessage:
    'This Assignment does not require additional instructions.',
  enforceDeadline: true,
  phaseContent: { title: 'Open', description: 'Desc', scheduleHint: null },
  completedDetails: null,
  headerBadges: [],
  liveAnalytics: null,
  requiresPledge: false,
  problems: [],
  isBookmarked: false,
} satisfies Omit<AssignmentDetailPayload, 'footer'>

describe('AssignmentDetailStickyFooter', () => {
  it('renders status chip and primary action from server footer', () => {
    render(
      <AssignmentDetailStickyFooter
        detail={{
          ...baseDetail,
          footer: {
            visible: true,
            meta: {
              submissionId: 99,
              assessPlatformLink: null,
              platform: 'Assessment Platform',
            },
            statusChip: {
              status: 'in-progress',
              label: 'In Progress',
            },
            showPracticeModeChip: false,
            score: null,
            notices: [],
            actions: [
              {
                kind: 'start-assessment',
                label: 'Start Assignment',
                variant: 'primary',
                enabled: true,
              },
            ],
          },
        }}
      />,
    )

    expect(screen.getByTestId('assignment-detail-sticky-footer')).toBeTruthy()
    expect(
      screen.getByTestId('assignment-footer-status-chip').textContent,
    ).toContain('In Progress')
    expect(
      screen.getByTestId('assignment-footer-action-start-assessment')
        .textContent,
    ).toContain('Start Assignment')
  })

  it('renders nothing when footer is not visible', () => {
    const { container } = render(
      <AssignmentDetailStickyFooter
        detail={{
          ...baseDetail,
          footer: {
            visible: false,
            meta: {
              submissionId: null,
              assessPlatformLink: null,
              platform: null,
            },
            statusChip: null,
            showPracticeModeChip: false,
            score: null,
            notices: [],
            actions: [],
          },
        }}
      />,
    )

    expect(container.innerHTML).toBe('')
  })
})
