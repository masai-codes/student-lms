import type { BookmarkTab } from './bookmarksConfig'

export interface BookmarkItem {
  id: string
  title: string
  subtitle: string
  meta: string
  savedAt: string
}

const DUMMY: Record<BookmarkTab, Array<BookmarkItem>> = {
  lectures: [
    {
      id: 'l1',
      title: 'Introduction to React Hooks',
      subtitle: 'Module 3 — Frontend Development',
      meta: 'Batch FSD-12',
      savedAt: '28 May 2025',
    },
    {
      id: 'l2',
      title: 'Understanding Closures in JavaScript',
      subtitle: 'Module 2 — JavaScript Fundamentals',
      meta: 'Batch FSD-12',
      savedAt: '25 May 2025',
    },
    {
      id: 'l3',
      title: 'Async/Await and Promises',
      subtitle: 'Module 2 — JavaScript Fundamentals',
      meta: 'Batch FSD-12',
      savedAt: '22 May 2025',
    },
  ],
  assignments: [
    {
      id: 'a1',
      title: 'Build a Todo App with React',
      subtitle: 'Module 3 — Frontend Development',
      meta: 'Due: 1 Jun 2025',
      savedAt: '27 May 2025',
    },
    {
      id: 'a2',
      title: 'REST API Integration Assignment',
      subtitle: 'Module 4 — Backend Basics',
      meta: 'Due: 5 Jun 2025',
      savedAt: '24 May 2025',
    },
  ],
  tickets: [],
  announcements: [],
  masaiverse: [],
}

export function getBookmarksByTab(tab: BookmarkTab): Array<BookmarkItem> {
  return DUMMY[tab]
}
