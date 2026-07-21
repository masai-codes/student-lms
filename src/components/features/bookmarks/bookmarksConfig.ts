export const BOOKMARKS_PER_PAGE = 15

export const BOOKMARK_TABS = [
  { id: 'lectures', label: 'Lectures' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'masaiverse', label: 'Masaiverse' },
] as const

export type BookmarkTab = (typeof BOOKMARK_TABS)[number]['id']
