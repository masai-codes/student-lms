import {
  ChatCircle,
  PlayCircle,
  CheckSquareOffset,
  BookOpen,
  CheckCircle,
} from '@phosphor-icons/react'
import type { Category } from './types'

export const CATEGORIES: Category[] = [
  {
    id: 'lecture',
    label: 'Lecture',
    desc: 'A doubt about a class or recording',
    icon: PlayCircle,
  },
  {
    id: 'assignment',
    label: 'Assignment',
    desc: 'Stuck on a problem or submission',
    icon: CheckSquareOffset,
  },
  {
    id: 'resource',
    label: 'Resource',
    desc: 'Issue with a document or reading',
    icon: BookOpen,
  },
  {
    id: 'evaluation',
    label: 'Evaluation',
    desc: 'Quiz, test or interview related',
    icon: CheckCircle,
  },
  {
    id: 'general',
    label: 'General Query',
    desc: "Anything that doesn't fit below",
    icon: ChatCircle,
  },
]

/**
 * TEMP FIX — iitj-only category relabel/duplicate below. Flip this to
 * `false` to instantly revert every iitj student to the default categories,
 * with zero other code changes: `getFloatingChatCategories` falls back to
 * plain `CATEGORIES`, so the `assignment-practice` id is never produced, and
 * `normalizeFloatingChatCategoryId` becomes a no-op passthrough everywhere
 * it's used (`ticketCategoryMapping.ts`, `supportCategoryLearning.ts`,
 * `FloatingChatModal.tsx`). To rip this out for good once it's no longer
 * needed: delete this flag, `IITJ_CATEGORY_LABELS`, `IITJ_CATEGORY_DESCS`,
 * `IITJ_ASSIGNMENT_PRACTICE_ID`/`_LABEL`, and the iitj branch of
 * `getFloatingChatCategories` + `normalizeFloatingChatCategoryId` in this
 * file, then remove the now-unused imports in the three files above.
 */
export const ENABLE_IITJ_CATEGORY_OVERRIDES = true

/** iitj-only label overrides for the top-level category chips — everything
 * else (id, desc, icon, and every other client) is unchanged. */
const IITJ_CATEGORY_LABELS: Partial<Record<string, string>> = {
  lecture: 'Course content related doubt',
  assignment: 'Assignment / Quiz',
  resource: 'Course study material',
  evaluation: 'Offline Major exams',
}

/** iitj-only description overrides — only the two chips below get a distinct
 * `desc`; every other chip keeps its default description. */
const IITJ_CATEGORY_DESCS: Partial<Record<string, string>> = {
  evaluation: 'Offline exam, centre related',
  general: 'Any General Program related queries excluding the above',
}

/**
 * iitj-only extra chip: a full duplicate of `assignment` (same desc/icon,
 * same underlying ticket category — see `mapSupportCategoryToTicketCategory`
 * and `supportCategoryLearning.ts`), just under a distinct id/label so it can
 * sit as its own chip next to "Assignment / Quiz" without colliding with it.
 */
export const IITJ_ASSIGNMENT_PRACTICE_ID = 'assignment-practice'
const IITJ_ASSIGNMENT_PRACTICE_LABEL = 'Non graded practice exercises'

/** The category chips to show — relabels lecture/assignment/resource/evaluation
 * for iitj students, and adds the iitj-only "practice exercises" chip. */
export function getFloatingChatCategories(isIitj: boolean): Category[] {
  if (!ENABLE_IITJ_CATEGORY_OVERRIDES || !isIitj) return CATEGORIES

  const relabeled = CATEGORIES.map((category) => {
    const label = IITJ_CATEGORY_LABELS[category.id]
    const desc = IITJ_CATEGORY_DESCS[category.id]
    if (!label && !desc) return category
    return {
      ...category,
      ...(label ? { label } : {}),
      ...(desc ? { desc } : {}),
    }
  })

  const assignmentIndex = relabeled.findIndex((c) => c.id === 'assignment')
  if (assignmentIndex === -1) return relabeled

  const practiceExercise: Category = {
    ...relabeled[assignmentIndex],
    id: IITJ_ASSIGNMENT_PRACTICE_ID,
    label: IITJ_ASSIGNMENT_PRACTICE_LABEL,
  }

  return [
    ...relabeled.slice(0, assignmentIndex + 1),
    practiceExercise,
    ...relabeled.slice(assignmentIndex + 1),
  ]
}

/**
 * Maps a chip id to the category that drives everything EXCEPT the chip's
 * own label/desc — item listing, filters, the entity snapshot/confirmation
 * screen, subcategory lookups, review navigation. iitj's practice-exercise
 * chip is `assignment` for every one of those; every other id passes through
 * unchanged. Use this wherever a chip id drives behavior rather than display.
 */
export function normalizeFloatingChatCategoryId(categoryId: string): string {
  return ENABLE_IITJ_CATEGORY_OVERRIDES &&
    categoryId === IITJ_ASSIGNMENT_PRACTICE_ID
    ? 'assignment'
    : categoryId
}
