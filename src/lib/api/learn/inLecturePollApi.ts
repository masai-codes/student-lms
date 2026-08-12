import { fetchJson } from '@/lib/api/fetchJson'
import { LEARN_API } from '@/lib/api/learnPaths'

export type InLecturePollResults = {
  /** Response count per option index, sized to the poll's option list. */
  optionCounts: Array<number>
  totalResponses: number
}

export type InLecturePollSubmissionStatus = {
  submitted: boolean
  /** 0-indexed, or `null` when `submitted` is false. */
  selectedOptionIndex: number | null
  /** Aggregate response counts, or `null` until this user has submitted. */
  results: InLecturePollResults | null
}

export type SubmitInLecturePollResponseResult = {
  submitted: true
  selectedOptionIndex: number
  results: InLecturePollResults
}

/**
 * Looks up whether the current user already has a saved
 * `zef_lms_polls_submissions` row for this in-lecture popup poll.
 */
export async function getInLecturePollSubmission(input: {
  lectureId: number
  pollId: string
}): Promise<InLecturePollSubmissionStatus> {
  const params = new URLSearchParams({ pollId: input.pollId })
  return fetchJson<InLecturePollSubmissionStatus>(
    `${LEARN_API.lecturePollStatus(input.lectureId)}?${params.toString()}`,
  )
}

/**
 * Submits the user's response to an in-lecture popup poll. `selectedOptionIndex`
 * is 0-indexed into the poll's `options` list.
 */
export async function submitInLecturePollResponse(input: {
  lectureId: number
  pollId: string
  selectedOptionIndex: number
}): Promise<SubmitInLecturePollResponseResult> {
  return fetchJson<SubmitInLecturePollResponseResult>(
    LEARN_API.lecturePollSubmit(input.lectureId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pollId: input.pollId,
        selectedOptionIndex: input.selectedOptionIndex,
      }),
    },
  )
}
