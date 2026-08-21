import {
  findCatalogTopicById,
  findCatalogTopicDomainById,
  getCatalogTopicsForDomains,
} from '@/server/api/interviews/catalog/interviewTopicCatalog'
import {
  buildCurriculumRubricFocus,
  getCurriculumInterviewTopics,
  isCurriculumTopicId,
} from '@/server/api/interviews/services/getCurriculumInterviewTopics.service'
import { resolveInterviewDomains } from '@/server/api/interviews/services/resolveInterviewDomain'
import { ApiError } from '@/server/api/http/apiError'
import type { InterviewDomain } from '@/server/api/interviews/types/interviewSession'

export type ResolvedInterviewTopicSelection = {
  topicId: string
  topicLabel: string
  domain: InterviewDomain
  rubricFocus: Array<string>
  subtopics: Array<string>
}

/**
 * Narrows a topic's full subtopic list down to the client-requested subset,
 * ignoring any requested entry that isn't actually one of the topic's own
 * subtopics (never trusting client-supplied strings verbatim into the
 * question-gen prompt). Falls back to the FULL list when the request is
 * absent/empty or the intersection comes back empty — "customize" is only
 * ever a narrowing, never a way to end up with zero guidance.
 */
function narrowSubtopics(
  topicSubtopics: Array<string>,
  requestedSubtopics: Array<string> | undefined,
): Array<string> {
  if (!requestedSubtopics || requestedSubtopics.length === 0) {
    return topicSubtopics
  }
  const allowed = new Set(topicSubtopics)
  const narrowed = requestedSubtopics.filter((subtopic) =>
    allowed.has(subtopic),
  )
  return narrowed.length > 0 ? narrowed : topicSubtopics
}

/**
 * Validates a client-supplied `topicId` against the catalog, or (for
 * `curriculum:*` ids) against the user's OWN curriculum-derived topics —
 * never trusting a client-supplied label. Throws `INTERVIEW_TOPIC_INVALID`
 * for anything else. `domain` on the result is the topic's OWN catalog
 * domain (not necessarily the batch's resolved domain — a catalog topic id
 * is valid regardless of which domains the student's batch enables).
 *
 * `requestedSubtopics` is the optional client-chosen subset from the
 * "customize" drawer — see `narrowSubtopics`.
 */
export async function resolveInterviewTopicSelection(
  userId: number,
  topicId: string,
  requestedSubtopics?: Array<string>,
): Promise<ResolvedInterviewTopicSelection> {
  const domains = await resolveInterviewDomains(userId)

  if (isCurriculumTopicId(topicId)) {
    const catalogTopics = getCatalogTopicsForDomains(domains)
    const curriculumTopics = await getCurriculumInterviewTopics(
      userId,
      domains[0] ?? 'general',
      catalogTopics,
    )
    const topic = curriculumTopics.find((t) => t.id === topicId)
    if (!topic) throw new ApiError(400, 'INTERVIEW_TOPIC_INVALID')
    return {
      topicId: topic.id,
      topicLabel: topic.label,
      domain: topic.domain,
      rubricFocus: topic.rubricFocus,
      subtopics: narrowSubtopics(topic.subtopics, requestedSubtopics),
    }
  }

  const topic = findCatalogTopicById(topicId)
  if (!topic) throw new ApiError(400, 'INTERVIEW_TOPIC_INVALID')

  return {
    topicId: topic.id,
    topicLabel: topic.label,
    domain: findCatalogTopicDomainById(topicId) ?? domains[0] ?? 'general',
    rubricFocus: topic.rubricFocus,
    subtopics: narrowSubtopics(topic.subtopics, requestedSubtopics),
  }
}

/**
 * Reconstructs rubric focus for an ALREADY-CREATED session from its
 * denormalized `topicId`/`topicLabel` (no DB re-query) — used mid-interview
 * when we no longer need to re-validate ownership, just rebuild the prompt.
 */
export function resolveRubricFocusForStoredTopic(
  topicId: string,
  topicLabel: string,
): Array<string> {
  if (isCurriculumTopicId(topicId)) {
    return buildCurriculumRubricFocus(topicLabel)
  }
  const catalogTopic = findCatalogTopicById(topicId)
  if (catalogTopic) return catalogTopic.rubricFocus
  return ['Technical depth', 'Problem solving', 'Communication']
}
