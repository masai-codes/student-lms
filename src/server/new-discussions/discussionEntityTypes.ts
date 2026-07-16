/** Stored `discussions.entity_type` values (legacy Laravel-style class names). */
export const DISCUSSION_ENTITY_ASSIGNMENT = 'App\\Models\\Assignment' as const
export const DISCUSSION_ENTITY_LECTURE = 'App\\Models\\Lecture' as const

export type DiscussionPersistedEntityType =
  typeof DISCUSSION_ENTITY_ASSIGNMENT | typeof DISCUSSION_ENTITY_LECTURE
