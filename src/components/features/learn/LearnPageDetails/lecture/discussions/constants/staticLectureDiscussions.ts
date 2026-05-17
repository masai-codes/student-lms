export type StaticLectureDiscussion = {
  id: number
  title: string
  bodyMarkdown: string
  authorName: string
  authorInitials: string
  postedAtLabel: string
  replyCount: number
}

export const STATIC_LECTURE_DISCUSSIONS: Array<StaticLectureDiscussion> = [
  {
    id: 1,
    title: 'Clarification on two-pointer approach',
    bodyMarkdown:
      'At **05:30** the instructor mentions avoiding nested loops. Can someone share when sliding window is preferred over two pointers on a sorted array?',
    authorName: 'Priya Sharma',
    authorInitials: 'PS',
    postedAtLabel: '2 hours ago',
    replyCount: 4,
  },
  {
    id: 2,
    title: 'Assignment deadline extension?',
    bodyMarkdown:
      'Will the **Tree Traversals Lab** deadline be extended for students who joined late? I could not find an announcement.',
    authorName: 'Arjun Mehta',
    authorInitials: 'AM',
    postedAtLabel: '1 day ago',
    replyCount: 1,
  },
  {
    id: 3,
    title: 'Recommended practice after this lecture',
    bodyMarkdown:
      'Finished the warm-up problems. What should we prioritise before Lecture 14 — graphs or more hash map drills?',
    authorName: 'Sneha Reddy',
    authorInitials: 'SR',
    postedAtLabel: '3 days ago',
    replyCount: 7,
  },
]
