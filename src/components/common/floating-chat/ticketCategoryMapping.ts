import { IITJ_ASSIGNMENT_PRACTICE_ID } from './mockData'

/**
 * Maps the floater's local category id (`CATEGORIES` in `mockData.ts`) to the
 * `tickets.category` value the backend/legacy tooling expects. "general" maps
 * to `general_query`, iitj's "Non graded practice exercises" chip is a full
 * duplicate of `assignment` (same underlying category, just a distinct chip),
 * and everything else (`lecture`, `assignment`, `evaluation`, `resource`)
 * already matches the ladder-routing strings used in `resolveAssignees.ts`.
 */
export function mapSupportCategoryToTicketCategory(categoryId: string): string {
  if (categoryId === 'general') return 'general_query'
  if (categoryId === IITJ_ASSIGNMENT_PRACTICE_ID) return 'assignment'
  return categoryId
}
