'use client'

import { LectureStatePanel } from './LectureStatePanel'
import { ContactSupportButton } from '../../common/ban/LearnBanNotice'

/**
 * Shown in place of the recording player when the learner is agreement-banned from
 * this lecture's batch (live recording or video lecture alike).
 */
export function LectureRecordingBanPanel() {
  return (
    <LectureStatePanel
      icon="video"
      title="You're banned from this recording"
      description="You are not allowed to watch this recording as you are banned. Please contact support if you think this is a mistake."
      action={<ContactSupportButton />}
    />
  )
}
