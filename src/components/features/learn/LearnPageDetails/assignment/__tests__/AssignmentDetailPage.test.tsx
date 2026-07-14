// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AssignmentDetailPage } from '../AssignmentDetailPage'
import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

const hoisted = vi.hoisted(() => ({
  useAutoCreateAssignmentSubmission: vi.fn(),
  useTokenCompletion: vi.fn(),
}))

vi.mock('../shared/useAutoCreateAssignmentSubmission', () => ({
  useAutoCreateAssignmentSubmission: hoisted.useAutoCreateAssignmentSubmission,
}))
vi.mock('../shared/useTokenCompletion', () => ({
  useTokenCompletion: hoisted.useTokenCompletion,
}))
vi.mock('../practice/PracticeAssignmentContent', () => ({
  PracticeAssignmentContent: () => <div data-testid="practice-content" />,
}))
vi.mock('../regular/RegularAssignmentContent', () => ({
  RegularAssignmentContent: () => <div data-testid="regular-content" />,
}))
vi.mock('../evaluation/EvaluationAssignmentContent', () => ({
  EvaluationAssignmentContent: () => <div data-testid="evaluation-content" />,
}))
vi.mock('../../common/ban/LearnBanNotice', () => ({
  LearnRestrictionPage: () => <div data-testid="restriction-content" />,
}))

function buildDetail(
  overrides: Partial<AssignmentDetailPayload> = {},
): AssignmentDetailPayload {
  return {
    id: 79307,
    restriction: null,
    assignmentKind: 'assignment',
    ...overrides,
  } as unknown as AssignmentDetailPayload
}

afterEach(cleanup)

describe('AssignmentDetailPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('always runs the auto-create and token-completion effects', () => {
    const detail = buildDetail()
    render(<AssignmentDetailPage detail={detail} />)

    expect(hoisted.useAutoCreateAssignmentSubmission).toHaveBeenCalledWith(
      detail,
    )
    expect(hoisted.useTokenCompletion).toHaveBeenCalledWith(79307)
  })

  it('renders the restriction page when restricted', () => {
    render(
      <AssignmentDetailPage
        detail={buildDetail({ restriction: { kind: 'ban' } } as never)}
      />,
    )
    expect(screen.getByTestId('restriction-content')).toBeTruthy()
  })

  it('renders the practice content for a practice assignment', () => {
    render(
      <AssignmentDetailPage
        detail={buildDetail({ assignmentKind: 'practice' })}
      />,
    )
    expect(screen.getByTestId('practice-content')).toBeTruthy()
  })

  it('renders the regular content for a standard assignment', () => {
    render(<AssignmentDetailPage detail={buildDetail()} />)
    expect(screen.getByTestId('regular-content')).toBeTruthy()
  })

  it('renders the evaluation content for an evaluation', () => {
    render(
      <AssignmentDetailPage
        detail={buildDetail({ assignmentKind: 'evaluation' })}
      />,
    )
    expect(screen.getByTestId('evaluation-content')).toBeTruthy()
  })
})
