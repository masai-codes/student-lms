import { describe, expect, it } from 'vitest'

import {
  flowScopedBatchName,
  flowScopedEmail,
  flowScopedLectureTitle,
  ONBOARDING_LMS_APP_VIDEO_URL,
  ONBOARDING_LMS_WEB_VIDEO_URL,
  resolveSectionVideos,
  SECTION_NAME_LMS_APP,
  SECTION_NAME_LMS_WEB,
} from './constants'

describe('onboarding constants', () => {
  it('scopes emails and batch names by flow id', () => {
    expect(flowScopedEmail('onboarding-welcome-modal', 'student')).toBe(
      'onboarding-welcome-modal.student@example.com',
    )
    expect(flowScopedBatchName('onboarding-fees-paid')).toBe(
      'SDE Batch 42 [onboarding-fees-paid]',
    )
    expect(flowScopedLectureTitle('onboarding-complete', 'Intro')).toBe(
      'Intro [onboarding-complete]',
    )
  })

  it('maps section names to the correct recording URLs', () => {
    expect(resolveSectionVideos(SECTION_NAME_LMS_WEB)).toEqual([
      ONBOARDING_LMS_WEB_VIDEO_URL,
    ])
    expect(resolveSectionVideos(SECTION_NAME_LMS_APP)).toEqual([
      ONBOARDING_LMS_APP_VIDEO_URL,
    ])
  })
})
