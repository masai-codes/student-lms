/**
 * Maps the floater's local category id (`CATEGORIES` in `mockData.ts`) to the
 * `tickets.category` value the backend/legacy tooling expects. Only "general"
 * differs — everything else (`lecture`, `assignment`, `evaluation`, `resource`)
 * already matches the ladder-routing strings used in `resolveAssignees.ts`.
 */
export function mapSupportCategoryToTicketCategory(categoryId: string): string {
  return categoryId === 'general' ? 'general_query' : categoryId
}
