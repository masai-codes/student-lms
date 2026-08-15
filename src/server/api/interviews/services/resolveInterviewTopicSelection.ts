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
import type {
  InterviewDomain,
  InterviewTopic,
} from '@/server/api/interviews/types/interviewSession'

export type ResolvedInterviewTopicSelection = {
  topicId: string
  topicLabel: string
  domain: InterviewDomain
  rubricFocus: Array<string>
  subtopics: Array<string>
}

/**
 * Validates a client-supplied `topicId` against the catalog, or (for
 * `curriculum:*` ids) against the user's OWN curriculum-derived topics —
 * never trusting a client-supplied label. Throws `INTERVIEW_TOPIC_INVALID`
 * for anything else. `domain` on the result is the topic's OWN catalog
 * domain (not necessarily the batch's resolved domain — a catalog topic id
 * is valid regardless of which domains the student's batch enables).
 */
export async function resolveInterviewTopicSelection(
  userId: number,
  topicId: string,
): Promise<ResolvedInterviewTopicSelection> {
  const domains = await resolveInterviewDomains(userId)

  if (isCurriculumTopicId(topicId)) {
    const catalogTopics = getCatalogTopicsForDomains(domains)
    const curriculumTopics = await getCurriculumInterviewTopics(
      userId,
      catalogTopics,
    )
    const topic = curriculumTopics.find((t) => t.id === topicId)
    if (!topic) throw new ApiError(400, 'INTERVIEW_TOPIC_INVALID')
    return {
      topicId: topic.id,
      topicLabel: topic.label,
      domain: domains[0] ?? 'general',
      rubricFocus: topic.rubricFocus,
      subtopics: topic.subtopics,
    }
  }

  const topic: InterviewTopic | undefined = findCatalogTopicById(topicId)
  if (!topic) throw new ApiError(400, 'INTERVIEW_TOPIC_INVALID')

  return {
    topicId: topic.id,
    topicLabel: topic.label,
    domain: findCatalogTopicDomainById(topicId) ?? domains[0] ?? 'general',
    rubricFocus: topic.rubricFocus,
    subtopics: topic.subtopics,
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
