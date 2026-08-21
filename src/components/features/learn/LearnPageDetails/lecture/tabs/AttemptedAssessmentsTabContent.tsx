'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'

import { MasaiButton } from '@/components/ui/masai-button'
import { formatVideoTime } from '../video/formatVideoTime'
import { AttemptedAssessmentViewPanel } from './AttemptedAssessmentViewPanel'
import { LectureTabEmptyState } from './LectureTabEmptyState'
import type { AttemptedAssessmentViewItem } from './AttemptedAssessmentViewPanel'

import type {
  InLecturePopupPollElement,
  InLecturePopupQuizElement,
} from '@/server/learn/lectureDetailTypes'

type AttemptedAssessmentsTabContentProps = {
  lectureId: number
  quizzes: Array<InLecturePopupQuizElement>
  polls: Array<InLecturePopupPollElement>
}

type ListEntry =
  | { kind: 'quiz'; item: InLecturePopupQuizElement; label: string }
  | { kind: 'poll'; item: InLecturePopupPollElement; label: string }

function formatSubmittedAt(submittedAt: string): string {
  const d = dayjs(submittedAt)
  return d.isValid() ? d.format('D MMM YYYY, h:mm A') : ''
}

/**
 * Read-only list of the in-lecture quizzes and polls for this lecture, split
 * into what the current user has already submitted and what's still pending.
 * Sourced from `inLecturePopupElements.quiz` / `.polls` via their
 * `submittedAt` fields (`zef_lms_quiz_submission` / `zef_lms_polls_submissions`).
 *
 * Labels ("Quiz 1", "Poll 2", …) are numbered by each kind's own `startSec`
 * order across the *full* list (not just the submitted or pending subset), so
 * a given quiz/poll keeps the same label whichever section it's currently in.
 * Pending items intentionally omit `startSec` — showing exactly when an
 * unattempted quiz/poll will appear would let a student skip straight to it.
 */
export function AttemptedAssessmentsTabContent({
  lectureId,
  quizzes,
  polls,
}: AttemptedAssessmentsTabContentProps) {
  const [viewing, setViewing] = useState<AttemptedAssessmentViewItem | null>(
    null,
  )

  const sortedQuizzes = [...quizzes].sort((a, b) => a.startSec - b.startSec)
  const sortedPolls = [...polls].sort((a, b) => a.startSec - b.startSec)

  const quizEntries: Array<ListEntry> = sortedQuizzes.map((item, index) => ({
    kind: 'quiz',
    item,
    label: `Quiz ${index + 1}`,
  }))
  const pollEntries: Array<ListEntry> = sortedPolls.map((item, index) => ({
    kind: 'poll',
    item,
    label: `Poll ${index + 1}`,
  }))

  const submitted = [...quizEntries, ...pollEntries]
    .filter((entry) => entry.item.submittedAt != null)
    .sort((a, b) => a.item.startSec - b.item.startSec)
  const pending = [...quizEntries, ...pollEntries].filter(
    (entry) => entry.item.submittedAt == null,
  )

  if (submitted.length === 0 && pending.length === 0) {
    return (
      <LectureTabEmptyState
        title="No assessments yet"
        description="Quizzes and polls from this lecture will show up here."
      />
    )
  }

  const handleView = (entry: ListEntry) => {
    setViewing(
      entry.kind === 'quiz'
        ? { kind: 'quiz', quiz: entry.item }
        : { kind: 'poll', poll: entry.item },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {submitted.length > 0 ? (
        <section
          data-testid="attempted-assessments-submitted"
          className="flex flex-col gap-2"
        >
          <h3 className="type-s1-md text-foreground">Submitted</h3>
          <div className="flex flex-col gap-2">
            {submitted.map((entry) => (
              <div
                key={`${entry.kind}-${entry.item.id}`}
                data-testid="attempted-assessment-item"
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="type-b1-md truncate text-foreground">
                    {entry.label} · at {formatVideoTime(entry.item.startSec)}
                  </p>
                  {entry.item.submittedAt ? (
                    <p className="type-b3-regular text-foreground-muted">
                      Submitted on {formatSubmittedAt(entry.item.submittedAt)}
                    </p>
                  ) : null}
                </div>
                <MasaiButton
                  type="secondary"
                  size="sm"
                  htmlType="button"
                  ctaText="View Submission"
                  icon={<ExternalLink />}
                  iconDirection="right"
                  onClick={() => handleView(entry)}
                  data-testid="attempted-assessment-view-button"
                  className="shrink-0"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {pending.length > 0 ? (
        <section
          data-testid="attempted-assessments-pending"
          className="flex flex-col gap-2"
        >
          <h3 className="type-s1-md text-foreground">Pending</h3>
          <div className="flex flex-col gap-2">
            {pending.map((entry) => (
              <div
                key={`${entry.kind}-${entry.item.id}`}
                data-testid="attempted-assessment-item"
                className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-surface-muted px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="type-b1-md truncate text-foreground-muted">
                    {entry.label}
                  </p>
                  <p className="type-b3-regular text-foreground-muted">
                    Not attempted yet — you'll be able to answer it during the
                    lecture.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 type-caption text-foreground-muted ring-1 ring-border">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {viewing ? (
        <AttemptedAssessmentViewPanel
          lectureId={lectureId}
          item={viewing}
          onClose={() => setViewing(null)}
        />
      ) : null}
    </div>
  )
}
