import { describe, expect, it } from 'vitest'

import { buildAssignmentLiveAnalytics } from '../buildAssignmentLiveAnalytics'

const liveData = {
  assess_platform_link_clicked: true,
  totalQuestions: 10,
  totalAttempted: 8,
  gradedQuestions: 6,
  correctAnswers: 5,
  wrongAnswers: 1,
}

const baseInput = {
  platform: 'Assessment Platform',
  settings: { liveProgress: true },
  submission: { data: liveData },
}

describe('buildAssignmentLiveAnalytics', () => {
  it('returns null when the platform is not an assessment platform', () => {
    expect(
      buildAssignmentLiveAnalytics({ ...baseInput, platform: 'LMS' }),
    ).toBeNull()
  })

  it('returns null when live progress is disabled', () => {
    expect(
      buildAssignmentLiveAnalytics({
        ...baseInput,
        settings: { liveProgress: false },
      }),
    ).toBeNull()
  })

  it('returns null when there is no submission', () => {
    expect(
      buildAssignmentLiveAnalytics({ ...baseInput, submission: null }),
    ).toBeNull()
  })

  it('returns null when the platform link has not been clicked', () => {
    expect(
      buildAssignmentLiveAnalytics({
        ...baseInput,
        submission: {
          data: { ...liveData, assess_platform_link_clicked: false },
        },
      }),
    ).toBeNull()
  })

  it('builds metrics and derives not-graded from attempted minus graded', () => {
    expect(buildAssignmentLiveAnalytics(baseInput)).toEqual({
      totalQuestions: 10,
      attempted: 8,
      notGraded: 2,
      correct: 5,
      wrong: 1,
    })
  })

  it('returns null metrics when values are missing or non-numeric', () => {
    const analytics = buildAssignmentLiveAnalytics({
      ...baseInput,
      submission: {
        data: { assess_platform_link_clicked: true, totalQuestions: 'x' },
      },
    })

    expect(analytics).toEqual({
      totalQuestions: null,
      attempted: null,
      notGraded: null,
      correct: null,
      wrong: null,
    })
  })

  it('returns null not-graded when only one of attempted/graded is present', () => {
    const analytics = buildAssignmentLiveAnalytics({
      ...baseInput,
      submission: {
        data: { assess_platform_link_clicked: true, totalAttempted: 8 },
      },
    })

    expect(analytics?.notGraded).toBeNull()
  })
})
