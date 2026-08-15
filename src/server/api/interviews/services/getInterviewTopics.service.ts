import { getCatalogTopicsForDomains } from '@/server/api/interviews/catalog/interviewTopicCatalog'
import { getCurriculumInterviewTopics } from '@/server/api/interviews/services/getCurriculumInterviewTopics.service'
import { resolveInterviewDomains } from '@/server/api/interviews/services/resolveInterviewDomain'
import type { InterviewTopicsForUser } from '@/server/api/interviews/types/interviewSession'

/**
 * Personalized topic list for `/interviews`: the student's program domain's
 * catalog topics ("Recommended for your program") plus topics derived from
 * their actual coursework ("From your coursework"). No enrolled batch still
 * returns the `general` catalog — the page is never empty.
 */
export async function getInterviewTopicsForUser(
  userId: number,
): Promise<InterviewTopicsForUser> {
  const domains = await resolveInterviewDomains(userId)
  const catalogTopics = getCatalogTopicsForDomains(domains)
  const curriculumTopics = await getCurriculumInterviewTopics(
    userId,
    catalogTopics,
  )

  return { domains, catalogTopics, curriculumTopics }
}
