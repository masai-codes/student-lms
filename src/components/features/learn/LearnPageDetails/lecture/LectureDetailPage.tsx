'use client'

import { LiveLectureContent } from './live/LiveLectureContent'
import { VideoLectureContent } from './video/VideoLectureContent'
import { LearnRestrictionPage } from '../common/ban/LearnBanNotice'
import { LectureAiChatSuggestionsProvider } from '@/components/features/lecture-ai-chat/hooks/LectureAiChatSuggestionsContext'
import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'
import {
  formatLectureRangeIST,
  formatLectureRangeLocal,
} from '@/utils/timeZoneHandler'

type LectureDetailPageProps = {
  detail: LectureDetailPayload
}

export function LectureDetailPage({ detail }: LectureDetailPageProps) {
  if (detail.restriction) {
    return <LearnRestrictionPage restriction={detail.restriction} />
  }

  // `scheduleDisplayRange` arrives from the server formatted in IST; re-derive it
  // here (client-side) in the viewer's local timezone so the date/time matches
  // their device clock. Falls back to the server string if unparseable.
  // `scheduleDisplayRangeIst` keeps the IST version for the non-IST hover tooltip.
  const localRange = formatLectureRangeLocal(detail.schedule, detail.concludes)
  const istRange = formatLectureRangeIST(detail.schedule, detail.concludes)
  const localizedDetail = localRange
    ? {
        ...detail,
        scheduleDisplayRange: localRange,
        scheduleDisplayRangeIst: istRange,
      }
    : detail

  const content =
    localizedDetail.lectureKind === 'live' ? (
      <LiveLectureContent detail={localizedDetail} />
    ) : (
      <VideoLectureContent detail={localizedDetail} />
    )

  return (
    <LectureAiChatSuggestionsProvider
      suggestions={localizedDetail.aiChatSuggestions}
    >
      {content}
    </LectureAiChatSuggestionsProvider>
  )
}
