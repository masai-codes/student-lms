import { and, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { lectures } from '@/db/schema'
import { getSectionIdsForUser } from '@/server/batches/getSectionIdsForUser'
import type { InterviewTopic } from '@/server/api/interviews/types/interviewSession'

const CURRICULUM_TOPIC_ID_PREFIX = 'curriculum:'

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase()
}

export function buildCurriculumTopicId(label: string): string {
  return `${CURRICULUM_TOPIC_ID_PREFIX}${slugify(label)}`
}

export function isCurriculumTopicId(topicId: string): boolean {
  return topicId.startsWith(CURRICULUM_TOPIC_ID_PREFIX)
}

export function buildCurriculumRubricFocus(label: string): Array<string> {
  return [`${label} fundamentals`, 'Applied problem solving', 'Communication']
}

/**
 * Derives interview topics from what the student has actually been taught —
 * distinct `lectures.module` values across their enrolled sections. `module`
 * (not `category`) is the source column: `category` is a generic content-type
 * tag ('course' / 'live-session' / 'coding') shared by nearly every lecture,
 * while `module` holds the human-readable curriculum unit name (e.g. "Data
 * Analysis") that actually reads as a personalized topic.
 *
 * De-duped against the catalog topics by normalized label so a module named
 * "System Design" doesn't show twice.
 */
export async function getCurriculumInterviewTopics(
  userId: number,
  catalogTopics: Array<InterviewTopic>,
): Promise<Array<InterviewTopic>> {
  const sectionIds = await getSectionIdsForUser(userId)
  if (sectionIds.length === 0) return []

  const rows = await db
    .selectDistinct({ module: lectures.module })
    .from(lectures)
    .where(
      and(inArray(lectures.sectionId, sectionIds), isNull(lectures.deletedAt)),
    )

  const catalogLabels = new Set(
    catalogTopics.map((topic) => normalizeLabel(topic.label)),
  )
  const seen = new Set<string>()
  const topics: Array<InterviewTopic> = []

  for (const row of rows) {
    const label = row.module?.trim()
    if (!label) continue

    const normalized = normalizeLabel(label)
    if (catalogLabels.has(normalized) || seen.has(normalized)) continue
    seen.add(normalized)

    topics.push({
      id: buildCurriculumTopicId(label),
      label,
      iconKey: 'curriculum',
      blurb: `Practice interview questions from your ${label} coursework.`,
      rubricFocus: buildCurriculumRubricFocus(label),
      subtopics: [],
    })
  }

  return topics.sort((a, b) => a.label.localeCompare(b.label))
}
