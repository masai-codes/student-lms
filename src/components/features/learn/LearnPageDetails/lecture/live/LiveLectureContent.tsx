'use client'

import { LectureDetailActions } from '../shared/LectureDetailActions'
import { LectureDetailChrome } from '../shared/LectureDetailChrome'
import { LectureDetailFooter } from '../shared/LectureDetailFooter'
import { AfterLiveLecture } from './AfterLiveLecture'
import { BeforeStartingLiveLecture } from './BeforeStartingLiveLecture'
import { DuringLiveLecture } from './DuringLiveLecture'

import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'

type LiveLectureContentProps = {
  detail: LectureDetailPayload
}

function renderLiveHero(detail: LectureDetailPayload) {
  switch (detail.livePhase) {
    case 'before':
      return <BeforeStartingLiveLecture schedule={detail.schedule} />
    case 'during':
      return (
        <DuringLiveLecture
          lectureId={detail.id}
          schedule={detail.schedule}
          zoomLink={detail.zoomLink}
          joinLiveButtonState={detail.joinLiveButtonState ?? 'hidden'}
          isNewZoomRedirection={detail.isNewZoomRedirection}
          enableZoomWebView={detail.enableZoomWebView}
        />
      )
    case 'after':
      return <AfterLiveLecture detail={detail} />
    default:
      return <BeforeStartingLiveLecture schedule={detail.schedule} />
  }
}

export function LiveLectureContent({ detail }: LiveLectureContentProps) {
  if (detail.livePhase === 'after' && detail.hasRecording && detail.videoUrl) {
    return <AfterLiveLecture detail={detail} />
  }

  return (
    <LectureDetailChrome
      title={detail.title}
      tags={detail.tags}
      priority={detail.priority}
      hostName={detail.hostName}
      hostAvatarUrl={detail.hostAvatarUrl}
      scheduleDisplayRange={detail.scheduleDisplayRange}
      scheduleDisplayRangeIst={detail.scheduleDisplayRangeIst}
      attendance={detail.attendance}
      optionalAttendance={detail.optionalAttendance}
      isLiveLecture={detail.lectureKind === 'live'}
      watchPercentage={detail.videoAttendance?.watchPercentage}
      actions={
        <LectureDetailActions
          lectureId={detail.id}
          initialIsBookmarked={detail.isBookmarked}
        />
      }
      hero={renderLiveHero(detail)}
      footer={
        <LectureDetailFooter
          entityId={detail.id}
          discussions={detail.discussions}
          hideNotes={detail.hideNotes}
          tabs={detail.tabs}
          feedback={detail.feedback}
        />
      }
    />
  )
}
