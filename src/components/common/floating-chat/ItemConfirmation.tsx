import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpRight,
  ChatCircle,
  Info,
  Notepad,
  PencilSimple,
  Percent,
  Star,
  Timer,
  UserCheck,
  VideoCamera,
} from '@phosphor-icons/react'
import {
  formatAiSummaryStatusLabel,
  formatRecordingStatusLabel,
  getSupportAttendancePresentation,
  getSupportCatchUpPresentation,
  shouldShowUnableToJoinLiveLecture,
} from './lectureSnapshotPresentation'
import {
  getAssignmentSnapshotStatusClassName,
  formatAssignmentWeightageDisplay,
  shouldShowAssignmentScoreCard,
  shouldShowAssignmentWeightageCard,
} from './assignmentSnapshotPresentation'
import {
  formatSupportItemScheduleDate,
  formatSupportLectureTypeLabel,
  supportAssignmentPriorityChipClassName,
  supportLectureTypeChipClassName,
} from './supportCategoryLearning'
import type { SupportReviewItemInput } from './supportReviewItem'
import type { Category, Item } from './types'
import type {
  AssignmentSupportSnapshot,
  LectureSupportSnapshot,
} from '@/server/api/support/support.types'
import {
  assignmentSupportSnapshotQuery,
  lectureSupportSnapshotQuery,
} from '@/query/support/supportQueries'
import { showsCatchUpCountdown } from '@/utils/portal'

interface ItemConfirmationProps {
  categoryObj: Category
  itemObj: Item
  onConfirm: () => void
  onDirectQuery?: (query: string) => void
  onReviewItem?: (input: SupportReviewItemInput) => void
}

/** Deep-link to the exact learn item (matches LearnContentCard routes). */
function getSupportItemReviewHref(
  categoryId: string,
  itemId: number | undefined,
): string | null {
  if (itemId == null) return null
  if (categoryId === 'lecture') return `/lectures/${itemId}`
  if (categoryId === 'assignment' || categoryId === 'evaluation') {
    return `/assignments/${itemId}`
  }
  if (categoryId === 'resource') return `/resources/${itemId}`
  return null
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
  const fallbackIsLive = itemObj.type === 'live' || itemObj.type === 'scrum'
  const startTime = itemObj.startTime
    ? new Date(itemObj.startTime).getTime()
    : 0
  const now = Date.now()
  const diffMins = startTime ? (now - startTime) / (1000 * 60) : 0
  const fallbackOngoing = Boolean(fallbackIsLive && startTime && diffMins < 60)

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
            className="h-[62px] rounded-[12px] border border-[#e9e9f3] dark:border-border bg-surface"
          />
        ))}
      </div>
    )
  }

  if (isError || !snapshot) {
    return (
      <div className="mb-3 rounded-[12px] border border-[#fecaca] dark:border-danger-subtle bg-[#fef2f2] dark:bg-danger-subtle p-3 text-center">
        <p className="text-[12.5px] font-bold text-[#b91c1c] dark:text-danger-subtle-foreground mb-2">
          Couldn&apos;t load lecture details.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="text-[12px] font-bold text-[#4338ca] dark:text-brand underline"
        >
          Try again
        </button>
      </div>
    )
  }

  const attendance = getSupportAttendancePresentation(snapshot)
  const catchUp = getSupportCatchUpPresentation(snapshot)
  // Portals that hide the catch-up countdown drop the whole "Days left" tile.
  const showCatchUp = showsCatchUpCountdown()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {showUnableToJoin && (
        <button
          onClick={() => onDirectQuery?.('Unable to join live lecture')}
          className="w-full flex items-center justify-between p-3.5 mb-3 bg-[#fff1f2] dark:bg-rose-500/10 border-[1.5px] border-[#fda4af] dark:border-rose-500/40 rounded-[12px] group hover:bg-[#ffe4e6] dark:hover:bg-rose-500/15 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 bg-[#f43f5e] text-white rounded-full shrink-0 shadow-sm shadow-[#f43f5e]/20 group-hover:scale-105 transition-transform">
              <VideoCamera weight="fill" className="size-4" />
            </div>
            <div className="text-left flex flex-col">
              <span className="text-[13.5px] font-bold text-[#be123c] dark:text-rose-300 leading-tight mb-0.5">
                Unable to join live lecture?
              </span>
              <span className="text-[11.5px] font-medium text-[#e11d48] dark:text-rose-400">
                Tap here for assistance
              </span>
            </div>
          </div>
          <div className="shrink-0 text-[#f43f5e] dark:text-rose-400 group-hover:translate-x-0.5 transition-transform">
            <ArrowUpRight weight="bold" className="size-4" />
          </div>
        </button>
      )}

      {isSessionPending ? (
        <div className="flex flex-col items-center justify-center p-5 mb-3 bg-[#f8f8fc] dark:bg-muted/40 border border-[#e9e9f3] dark:border-border rounded-[12px] text-center border-dashed">
          <div className="relative flex h-3 w-3 mb-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f43f5e] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e11d48]" />
          </div>
          <span className="text-[14px] font-bold text-[#15162c] dark:text-foreground mb-1">
            {snapshot.livePhase === 'before'
              ? 'Lecture starts soon'
              : 'Lecture is ongoing'}
          </span>
          <span className="text-[12px] text-[#62647d] dark:text-foreground-muted max-w-[200px] leading-snug">
            Recording, AI Summary, and Attendance will be available after the
            session ends.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex flex-col p-[11px_12px] bg-surface border border-[#e9e9f3] dark:border-border rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d] dark:text-foreground-muted">
              <VideoCamera
                weight="fill"
                className="size-[13px] text-[#4b4396] dark:text-brand"
              />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">
                Recording
              </span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#15162c] dark:text-foreground">
              {formatRecordingStatusLabel(snapshot.recordingStatus)}
            </span>
          </div>
          {showCatchUp ? (
            <div className="flex flex-col p-[11px_12px] bg-surface border border-[#e9e9f3] dark:border-border rounded-[12px] shadow-sm">
              <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d] dark:text-foreground-muted">
                <Timer
                  weight="fill"
                  className="size-[13px] text-[#4b4396] dark:text-brand"
                />
                <span className="text-[10.5px] font-bold uppercase tracking-wide">
                  Days left
                </span>
              </div>
              <span className="text-[12.5px] font-extrabold text-[#15162c] dark:text-foreground">
                {catchUp.label}
              </span>
            </div>
          ) : null}
          <div className="flex flex-col p-[11px_12px] bg-surface border border-[#e9e9f3] dark:border-border rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d] dark:text-foreground-muted">
              <Notepad
                weight="fill"
                className="size-[13px] text-[#4b4396] dark:text-brand"
              />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">
                AI Summary
              </span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#15162c] dark:text-foreground">
              {formatAiSummaryStatusLabel(snapshot.aiSummaryStatus)}
            </span>
          </div>
          <div className="flex flex-col p-[11px_12px] bg-surface border border-[#e9e9f3] dark:border-border rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d] dark:text-foreground-muted">
              <UserCheck
                weight="fill"
                className={`size-[14px] ${attendance.colorClass}`}
              />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">
                Attendance
              </span>
            </div>
            <span
              className={`text-[12.5px] font-extrabold ${attendance.colorClass}`}
            >
              {attendance.label}
            </span>
          </div>
          {attendance.showAbsentReason && attendance.absentReason && (
            <div
              className={
                attendance.isAbsent
                  ? 'col-span-2 flex items-center gap-2 p-[10px_12px] bg-[#fef2f2] dark:bg-danger-subtle border border-[#fecaca] dark:border-danger-subtle rounded-[12px] shadow-sm'
                  : 'col-span-2 flex items-center gap-2 p-[10px_12px] bg-[#f0f4ff] dark:bg-info-subtle border border-[#d6e4ff] dark:border-info-subtle rounded-[12px] shadow-sm'
              }
            >
              <Info
                weight="fill"
                className={`size-[15px] shrink-0 ${attendance.isAbsent ? 'text-[#ef4444] dark:text-danger' : 'text-[#2952cc] dark:text-info'}`}
              />
              <span
                className={`text-[12px] font-bold ${attendance.isAbsent ? 'text-[#b91c1c] dark:text-danger-subtle-foreground' : 'text-[#1a3380] dark:text-info-subtle-foreground'}`}
              >
                {attendance.isAbsent ? 'Reason: ' : ''}
                {attendance.absentReason}
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
  showScoreCard,
}: {
  snapshot?: AssignmentSupportSnapshot
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  showScoreCard: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 mb-3 animate-pulse">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-[62px] rounded-[12px] border border-[#e9e9f3] dark:border-border bg-surface"
          />
        ))}
      </div>
    )
  }

  if (isError || !snapshot) {
    return (
      <div className="mb-3 rounded-[12px] border border-[#fecaca] dark:border-danger-subtle bg-[#fef2f2] dark:bg-danger-subtle p-3 text-center">
        <p className="text-[12.5px] font-bold text-[#b91c1c] dark:text-danger-subtle-foreground mb-2">
          Couldn&apos;t load assignment details.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="text-[12px] font-bold text-[#4338ca] dark:text-brand underline"
        >
          Try again
        </button>
      </div>
    )
  }

  const statusClassName = getAssignmentSnapshotStatusClassName(
    snapshot.statusTone,
  )
  const showWeightageCard = shouldShowAssignmentWeightageCard(snapshot)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex flex-col p-[11px_12px] bg-surface border border-[#e9e9f3] dark:border-border rounded-[12px] shadow-sm">
          <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d] dark:text-foreground-muted">
            <PencilSimple
              weight="fill"
              className="size-[13px] text-[#4b4396] dark:text-brand"
            />
            <span className="text-[10.5px] font-bold uppercase tracking-wide">
              Status
            </span>
          </div>
          <span className={`text-[12.5px] font-extrabold ${statusClassName}`}>
            {snapshot.statusLabel}
          </span>
        </div>
        {showWeightageCard && snapshot.weightagePercentage != null && (
          <div
            className="flex flex-col p-[11px_12px] bg-surface border border-[#e9e9f3] dark:border-border rounded-[12px] shadow-sm"
            data-testid="floating-chat-assignment-weightage-card"
          >
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d] dark:text-foreground-muted">
              <Percent
                weight="bold"
                className="size-[13px] text-[#4b4396] dark:text-brand"
              />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">
                Weightage
              </span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#15162c] dark:text-foreground">
              {formatAssignmentWeightageDisplay(snapshot.weightagePercentage)}
            </span>
          </div>
        )}
        {showScoreCard && (
          <div className="flex flex-col p-[11px_12px] bg-surface border border-[#e9e9f3] dark:border-border rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d] dark:text-foreground-muted">
              <Star
                weight="fill"
                className="size-[13px] text-[#4b4396] dark:text-brand"
              />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">
                Score
              </span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#15162c] dark:text-foreground">
              {snapshot.scoreDisplay ?? '-'}
            </span>
          </div>
        )}
        {snapshot.scorePolicyNotice != null && (
          <div className="col-span-2 flex items-center gap-2 p-[10px_12px] bg-[#f0f4ff] dark:bg-info-subtle border border-[#d6e4ff] dark:border-info-subtle rounded-[12px] shadow-sm">
            <Info
              weight="fill"
              className="size-[15px] text-[#2952cc] dark:text-info shrink-0"
            />
            <span className="text-[12px] font-bold text-[#1a3380] dark:text-info-subtle-foreground">
              {snapshot.scorePolicyNotice}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function ItemConfirmation({
  categoryObj,
  itemObj,
  onConfirm,
  onDirectQuery,
  onReviewItem,
}: ItemConfirmationProps) {
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

  const fallbackIsLive = itemObj.type === 'live' || itemObj.type === 'scrum'
  const startTime = itemObj.startTime
    ? new Date(itemObj.startTime).getTime()
    : 0
  const now = Date.now()
  const diffMins = startTime ? (now - startTime) / (1000 * 60) : 0
  const fallbackOngoing = Boolean(fallbackIsLive && startTime && diffMins < 60)
  const isSessionPending = isLecture
    ? (lectureSnapshot?.isSessionPending ?? fallbackOngoing)
    : false
  const lectureType = isLecture
    ? (lectureSnapshot?.lectureDisplayType ?? itemObj.type)
    : undefined
  const displayTitle = lectureSnapshot?.title ?? itemObj.title
  const displayMeta = lectureSnapshot?.meta ?? itemObj.meta
  const scheduleRaw = isLecture
    ? (lectureSnapshot?.schedule ?? itemObj.startTime)
    : itemObj.startTime
  const displayDate = scheduleRaw
    ? formatSupportItemScheduleDate(scheduleRaw)
    : itemObj.date
  const lectureTypeLabel = formatSupportLectureTypeLabel(lectureType)
  const reviewHref = getSupportItemReviewHref(categoryObj.id, itemObj.id)
  const showOptionalChip =
    (categoryObj.id === 'assignment' ||
      categoryObj.id === 'evaluation' ||
      categoryObj.id === 'resource' ||
      categoryObj.id === 'lecture') &&
    (lectureSnapshot?.isOptional ?? itemObj.isOptional === true)
  const showMandatoryChip =
    (categoryObj.id === 'assignment' ||
      categoryObj.id === 'evaluation' ||
      categoryObj.id === 'lecture') &&
    (lectureSnapshot?.isMandatory ?? itemObj.isMandatory === true)

  return (
    <div className="flex flex-col h-full">
      <div className="border-[1.5px] border-[#e3e3fb] dark:border-brand/25 rounded-[14px] bg-[#f0f0fd] dark:bg-brand/10 p-[16px_16px_14px] mb-2.5 flex items-start gap-[13px]">
        <div className="flex items-center justify-center shrink-0 size-[42px] rounded-[11px] bg-[#e3e3fb] dark:bg-brand/15 text-[#4b4396] dark:text-brand">
          <categoryObj.icon weight="fill" className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10.8px] font-bold text-[#4338ca] dark:text-brand uppercase tracking-[0.04em] mb-[3px]">
            {categoryObj.label}
          </div>
          <div className="text-[14px] font-bold text-[#15162c] dark:text-foreground leading-[1.35] mb-1 truncate">
            {displayTitle}
          </div>
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {lectureTypeLabel ? (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${supportLectureTypeChipClassName(lectureType)}`}
              >
                {lectureTypeLabel}
              </span>
            ) : null}
            {showMandatoryChip ? (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${supportAssignmentPriorityChipClassName('mandatory')}`}
              >
                Mandatory
              </span>
            ) : null}
            {showOptionalChip ? (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${supportAssignmentPriorityChipClassName('optional')}`}
              >
                Optional
              </span>
            ) : null}
            <span className="text-[11px] font-bold text-[#62647d] dark:text-foreground-muted bg-[rgba(255,255,255,0.7)] dark:bg-white/10 px-2 py-0.5 rounded-full">
              {displayMeta}
            </span>
            <span className="text-[11px] text-[#9496ab] dark:text-foreground-subtle">
              {displayDate}
            </span>
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
          {reviewHref ? (
            <button
              type="button"
              onClick={() =>
                onReviewItem?.({
                  href: reviewHref,
                  category: categoryObj.id,
                  entityId: itemObj.id!,
                  categoryLabel: categoryObj.label,
                  itemTitle: itemObj.title,
                })
              }
              className="flex w-full items-center justify-center gap-1.5 mb-1.5 p-[9px_14px] rounded-[10px] text-[13px] font-bold text-[#4338ca] dark:text-brand bg-surface border-[1.5px] border-[#e3e3fb] dark:border-brand/25 hover:bg-[#e3e3fb] dark:hover:bg-brand/15 hover:border-[#4b4396] dark:hover:border-brand hover:text-[#4b4396] transition-colors"
            >
              <categoryObj.icon
                weight="fill"
                className="size-[14px] shrink-0"
              />
              Open {categoryObj.label} to review it
              <ArrowUpRight
                weight="bold"
                className="size-[14px] shrink-0 ml-auto"
              />
            </button>
          ) : null}

          <div className="mt-auto shrink-0 pt-4">
            <div className="text-[12.5px] text-[#62647d] dark:text-foreground-muted leading-[1.5] p-[11px_13px] bg-[#f6f6fb] dark:bg-muted/40 rounded-[10px] border border-dashed border-[#e9e9f3] dark:border-border mb-3">
              Still need help?{' '}
              <strong className="text-[#15162c] dark:text-foreground">
                Raise a ticket below
              </strong>
            </div>

            {/* Purple gradient is light-only (dark theme is red & black) — the
                gradient lives in the class list so `dark:` can replace it with
                the solid brand (red) fill. */}
            <button
              onClick={onConfirm}
              className="flex w-full items-center justify-center gap-2 p-[13px] rounded-[10px] font-bold text-[14px] text-white transition-all hover:-translate-y-[1px] hover:opacity-90 active:scale-[0.98] [background:var(--chat-cta-gradient)]"
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
