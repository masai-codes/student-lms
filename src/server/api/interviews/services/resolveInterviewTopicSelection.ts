import {
  findCatalogTopicById,
  getCatalogTopicsForDomain,
} from '@/server/api/interviews/catalog/interviewTopicCatalog'
import {
  buildCurriculumRubricFocus,
  getCurriculumInterviewTopics,
  isCurriculumTopicId,
} from '@/server/api/interviews/services/getCurriculumInterviewTopics.service'
import { resolveInterviewDomain } from '@/server/api/interviews/services/resolveInterviewDomain'
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
}

/**
 * Validates a client-supplied `topicId` against the catalog for the user's
 * resolved domain, or (for `curriculum:*` ids) against the user's OWN
 * curriculum-derived topics — never trusting a client-supplied label. Throws
 * `INTERVIEW_TOPIC_INVALID` for anything else.
 */
export async function resolveInterviewTopicSelection(
  userId: number,
  topicId: string,
): Promise<ResolvedInterviewTopicSelection> {
  const domain = await resolveInterviewDomain(userId)
  const catalogTopics = getCatalogTopicsForDomain(domain)

  if (isCurriculumTopicId(topicId)) {
    const curriculumTopics = await getCurriculumInterviewTopics(
      userId,
      catalogTopics,
    )
    const topic = curriculumTopics.find((t) => t.id === topicId)
    if (!topic) throw new ApiError(400, 'INTERVIEW_TOPIC_INVALID')
    return {
      topicId: topic.id,
      topicLabel: topic.label,
      domain,
      rubricFocus: topic.rubricFocus,
    }
  }

  const topic: InterviewTopic | undefined =
    findCatalogTopicById(topicId) ?? catalogTopics.find((t) => t.id === topicId)
  if (!topic) throw new ApiError(400, 'INTERVIEW_TOPIC_INVALID')

  return {
    topicId: topic.id,
    topicLabel: topic.label,
    domain,
    rubricFocus: topic.rubricFocus,
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
