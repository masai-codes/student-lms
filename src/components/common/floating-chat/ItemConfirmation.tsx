import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpRight,
  ChatCircle,
  Info,
  Notepad,
  PencilSimple,
  Star,
  Target,
  Timer,
  UserCheck,
  VideoCamera,
} from '@phosphor-icons/react'
import {
  formatAiSummaryStatusLabel,
  formatRecordingStatusLabel,
  formatSupportDuration,
  getSupportAttendancePresentation,
  shouldShowLectureDuration,
  shouldShowUnableToJoinLiveLecture,
} from './lectureSnapshotPresentation'
import {
  getAssignmentSnapshotStatusClassName,
  shouldShowAssignmentScoreCard,
  shouldShowAssignmentTypeCard,
} from './assignmentSnapshotPresentation'
import type { Category, Item } from './types'
import type { AssignmentSupportSnapshot, LectureSupportSnapshot } from '@/server/api/support/support.types'
import {
  assignmentSupportSnapshotQuery,
  lectureSupportSnapshotQuery,
} from '@/query/support/supportQueries'

interface ItemConfirmationProps {
  categoryObj: Category
  itemObj: Item
  onConfirm: () => void
  onDirectQuery?: (query: string) => void
}

function LectureSnapshotCards({
  itemObj,
  snapshot,
  isLoading,
  isError,
  onRetry,
  onDirectQuery,
}: {
  itemObj: Item
  snapshot?: LectureSupportSnapshot
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onDirectQuery?: (query: string) => void
}) {
  const fallbackIsLive = itemObj.type === 'live'
  const startTime = itemObj.startTime ? new Date(itemObj.startTime).getTime() : 0
  const now = Date.now()
  const diffMins = startTime ? (now - startTime) / (1000 * 60) : 0
  const fallbackOngoing =
    Boolean(fallbackIsLive && startTime && diffMins < 60)

  const showUnableToJoin =
    snapshot != null ? shouldShowUnableToJoinLiveLecture(snapshot) : false
  const isSessionPending =
    snapshot != null ? snapshot.isSessionPending : fallbackOngoing

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 mb-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[62px] rounded-[12px] border border-[#e9e9f3] bg-white"
          />
        ))}
      </div>
    )
  }

  if (isError || !snapshot) {
    return (
      <div className="mb-3 rounded-[12px] border border-[#fecaca] bg-[#fef2f2] p-3 text-center">
        <p className="text-[12.5px] font-bold text-[#b91c1c] mb-2">
          Couldn&apos;t load lecture details.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="text-[12px] font-bold text-[#4338ca] underline"
        >
          Try again
        </button>
      </div>
    )
  }

  const attendance = getSupportAttendancePresentation(snapshot)
  const showDuration = shouldShowLectureDuration(snapshot)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {showUnableToJoin && (
        <button
          onClick={() => onDirectQuery?.('Unable to join live lecture')}
          className="w-full flex items-center justify-between p-3.5 mb-3 bg-[#fff1f2] border-[1.5px] border-[#fda4af] rounded-[12px] group hover:bg-[#ffe4e6] transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 bg-[#f43f5e] text-white rounded-full shrink-0 shadow-sm shadow-[#f43f5e]/20 group-hover:scale-105 transition-transform">
              <VideoCamera weight="fill" className="size-4" />
            </div>
            <div className="text-left flex flex-col">
              <span className="text-[13.5px] font-bold text-[#be123c] leading-tight mb-0.5">
                Unable to join live lecture?
              </span>
              <span className="text-[11.5px] font-medium text-[#e11d48]">Tap here for assistance</span>
            </div>
          </div>
          <div className="shrink-0 text-[#f43f5e] group-hover:translate-x-0.5 transition-transform">
            <ArrowUpRight weight="bold" className="size-4" />
          </div>
        </button>
      )}

      {isSessionPending ? (
        <div className="flex flex-col items-center justify-center p-5 mb-3 bg-[#f8f8fc] border border-[#e9e9f3] rounded-[12px] text-center border-dashed">
          <div className="relative flex h-3 w-3 mb-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f43f5e] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e11d48]" />
          </div>
          <span className="text-[14px] font-bold text-[#15162c] mb-1">
            {snapshot.livePhase === 'before' ? 'Lecture starts soon' : 'Lecture is ongoing'}
          </span>
          <span className="text-[12px] text-[#62647d] max-w-[200px] leading-snug">
            Recording, AI Summary, and Attendance will be available after the session ends.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
              <VideoCamera weight="fill" className="size-[13px] text-[#4b4396]" />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">Recording</span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#15162c]">
              {formatRecordingStatusLabel(snapshot.recordingStatus)}
            </span>
          </div>
          <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
              <Timer weight="fill" className="size-[13px] text-[#4b4396]" />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">Duration</span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#15162c]">
              {showDuration ? formatSupportDuration(snapshot.durationSeconds!) : '—'}
            </span>
          </div>
          <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
              <Notepad weight="fill" className="size-[13px] text-[#4b4396]" />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">AI Summary</span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#15162c]">
              {formatAiSummaryStatusLabel(snapshot.aiSummaryStatus)}
            </span>
          </div>
          <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
              <UserCheck weight="fill" className={`size-[14px] ${attendance.colorClass}`} />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">Attendance</span>
            </div>
            <span className={`text-[12.5px] font-extrabold ${attendance.colorClass}`}>
              {attendance.label}
            </span>
          </div>
          {attendance.showAbsentReason && attendance.absentReason && (
            <div className="col-span-2 flex items-center gap-2 p-[10px_12px] bg-[#fef2f2] border border-[#fecaca] rounded-[12px] shadow-sm">
              <Info weight="fill" className="size-[15px] text-[#ef4444] shrink-0" />
              <span className="text-[12px] font-bold text-[#b91c1c]">
                Reason: {attendance.absentReason}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AssignmentSnapshotCards({
  snapshot,
  isLoading,
  isError,
  onRetry,
  showTypeCard,
  showScoreCard,
}: {
  snapshot?: AssignmentSupportSnapshot
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  showTypeCard: boolean
  showScoreCard: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 mb-3 animate-pulse">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-[62px] rounded-[12px] border border-[#e9e9f3] bg-white"
          />
        ))}
      </div>
    )
  }

  if (isError || !snapshot) {
    return (
      <div className="mb-3 rounded-[12px] border border-[#fecaca] bg-[#fef2f2] p-3 text-center">
        <p className="text-[12.5px] font-bold text-[#b91c1c] mb-2">
          Couldn&apos;t load assignment details.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="text-[12px] font-bold text-[#4338ca] underline"
        >
          Try again
        </button>
      </div>
    )
  }

  const statusClassName = getAssignmentSnapshotStatusClassName(snapshot.statusTone)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 gap-2 mb-3">
        {showTypeCard && snapshot.typeLabel != null && (
          <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
              <Target weight="fill" className="size-[14px] text-[#4b4396]" />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">Type</span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#15162c]">{snapshot.typeLabel}</span>
          </div>
        )}
        <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
          <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
            <PencilSimple weight="fill" className="size-[13px] text-[#4b4396]" />
            <span className="text-[10.5px] font-bold uppercase tracking-wide">Status</span>
          </div>
          <span className={`text-[12.5px] font-extrabold ${statusClassName}`}>
            {snapshot.statusLabel}
          </span>
        </div>
        {showScoreCard && (
          <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
              <Star weight="fill" className="size-[13px] text-[#4b4396]" />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">Score</span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#15162c]">
              {snapshot.scoreDisplay ?? '-'}
            </span>
          </div>
        )}
        {snapshot.scorePolicyNotice != null && (
          <div className="col-span-2 flex items-center gap-2 p-[10px_12px] bg-[#f0f4ff] border border-[#d6e4ff] rounded-[12px] shadow-sm">
            <Info weight="fill" className="size-[15px] text-[#2952cc] shrink-0" />
            <span className="text-[12px] font-bold text-[#1a3380]">{snapshot.scorePolicyNotice}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function ItemConfirmation({ categoryObj, itemObj, onConfirm, onDirectQuery }: ItemConfirmationProps) {
  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  const isLecture = categoryObj.id === 'lecture' && itemObj.id != null
  const isAssignmentLike =
    (categoryObj.id === 'assignment' || categoryObj.id === 'evaluation') &&
    itemObj.id != null
  const {
    data: lectureSnapshot,
    isLoading: isLectureSnapshotLoading,
    isError: isLectureSnapshotError,
    refetch: refetchLectureSnapshot,
  } = useQuery({
    ...lectureSupportSnapshotQuery(itemObj.id ?? 0),
    enabled: isLecture,
  })
  const {
    data: assignmentSnapshot,
    isLoading: isAssignmentSnapshotLoading,
    isError: isAssignmentSnapshotError,
    refetch: refetchAssignmentSnapshot,
  } = useQuery({
    ...assignmentSupportSnapshotQuery(itemObj.id ?? 0),
    enabled: isAssignmentLike,
  })

  const fallbackIsLive = itemObj.type === 'live'
  const startTime = itemObj.startTime ? new Date(itemObj.startTime).getTime() : 0
  const now = Date.now()
  const diffMins = startTime ? (now - startTime) / (1000 * 60) : 0
  const fallbackOngoing = Boolean(fallbackIsLive && startTime && diffMins < 60)
  const isSessionPending = isLecture
    ? (lectureSnapshot?.isSessionPending ?? fallbackOngoing)
    : false

  return (
    <div className="flex flex-col h-full">
      <div className="border-[1.5px] border-[#e3e3fb] rounded-[14px] bg-[#f0f0fd] p-[16px_16px_14px] mb-2.5 flex items-start gap-[13px]">
        <div className="flex items-center justify-center shrink-0 size-[42px] rounded-[11px] bg-[#e3e3fb] text-[#4b4396]">
          <categoryObj.icon weight="fill" className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10.8px] font-bold text-[#4338ca] uppercase tracking-[0.04em] mb-[3px]">
            {categoryObj.label}
          </div>
          <div className="text-[14px] font-bold text-[#15162c] leading-[1.35] mb-1 truncate">
            {itemObj.title}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#62647d] bg-[rgba(255,255,255,0.7)] px-2 py-0.5 rounded-full">{itemObj.meta}</span>
            <span className="text-[11px] text-[#9496ab]">{itemObj.date}</span>
          </div>
        </div>
      </div>

      {categoryObj.id === 'lecture' && itemObj.id != null && (
        <LectureSnapshotCards
          itemObj={itemObj}
          snapshot={lectureSnapshot}
          isLoading={isLectureSnapshotLoading}
          isError={isLectureSnapshotError}
          onRetry={() => void refetchLectureSnapshot()}
          onDirectQuery={onDirectQuery}
        />
      )}

      {(categoryObj.id === 'assignment' || categoryObj.id === 'evaluation') &&
        itemObj.id != null && (
        <AssignmentSnapshotCards
          snapshot={assignmentSnapshot}
          isLoading={isAssignmentSnapshotLoading}
          isError={isAssignmentSnapshotError}
          onRetry={() => void refetchAssignmentSnapshot()}
          showTypeCard={
            categoryObj.id === 'assignment' &&
            (assignmentSnapshot != null
              ? shouldShowAssignmentTypeCard(assignmentSnapshot)
              : true)
          }
          showScoreCard={
            categoryObj.id === 'evaluation' &&
            (assignmentSnapshot != null
              ? shouldShowAssignmentScoreCard(assignmentSnapshot)
              : true)
          }
        />
      )}
      {!isSessionPending && (
        <>
          <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center justify-center gap-1.5 mb-1.5 p-[9px_14px] rounded-[10px] text-[13px] font-bold text-[#4338ca] bg-white border-[1.5px] border-[#e3e3fb] hover:bg-[#e3e3fb] hover:border-[#4b4396] hover:text-[#4b4396] transition-colors no-underline">
            <categoryObj.icon weight="fill" className="size-[14px] shrink-0" />
            Open {categoryObj.label} to review it
            <ArrowUpRight weight="bold" className="size-[14px] shrink-0 ml-auto" />
          </a>

          <div className="mt-auto shrink-0 pt-4">
            <div className="text-[12.5px] text-[#62647d] leading-[1.5] p-[11px_13px] bg-[#f6f6fb] rounded-[10px] border border-dashed border-[#e9e9f3] mb-3">
              Still need help? <strong className="text-[#15162c]">Raise a ticket below</strong>
            </div>

            <button
              onClick={onConfirm}
              className="flex w-full items-center justify-center gap-2 p-[13px] rounded-[10px] font-bold text-[14px] text-white transition-all hover:-translate-y-[1px] hover:opacity-90 active:scale-[0.98]"
              style={{ background: gradientBg }}
            >
              <ChatCircle className="size-[15px]" weight="fill" />
              Yes, I still need help
            </button>
          </div>
        </>
      )}
    </div>
  )
}
