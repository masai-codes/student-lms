/** View model for YouTube-style comment rows on the lecture detail page. */
export type LectureDiscussionView = {
  id: number
  title: string
  bodyMarkdown: string
  authorName: string
  authorInitials: string
  postedAtLabel: string
  replyCount: number
}
