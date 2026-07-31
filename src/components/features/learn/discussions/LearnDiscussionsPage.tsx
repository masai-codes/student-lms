import { Link } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'
import type { LearnDiscussionListItem } from '@/server/learn/types'
import { LAYOUT_MAIN_PADDING_X, LAYOUT_MAX_WIDTH_CLASS } from '@/lib/layout'

const CONTENT_LINK: Record<
  LearnDiscussionListItem['contentType'],
  (id: number) => { to: string; params: Record<string, string> }
> = {
  lecture: (id) => ({
    to: '/learn/lectures/$lectureId',
    params: { lectureId: String(id) },
  }),
  resource: (id) => ({
    to: '/resources/$resourceId',
    params: { resourceId: String(id) },
  }),
  assignment: (id) => ({
    to: '/assignments/$assignmentId',
    params: { assignmentId: String(id) },
  }),
}

const CONTENT_TYPE_LABEL: Record<
  LearnDiscussionListItem['contentType'],
  string
> = {
  lecture: 'Lecture',
  resource: 'Resource',
  assignment: 'Assignment',
}

function DiscussionRow({
  discussion,
}: {
  discussion: LearnDiscussionListItem
}) {
  const link = CONTENT_LINK[discussion.contentType](discussion.contentId)

  return (
    <Link
      to={link.to}
      params={link.params}
      className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-muted"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
        <span className="rounded-full bg-surface-muted px-2 py-0.5">
          {CONTENT_TYPE_LABEL[discussion.contentType]}
        </span>
        <span className="truncate">{discussion.contentTitle}</span>
        {!discussion.isPublic ? (
          <span className="rounded-full bg-info-subtle px-2 py-0.5 text-info-subtle-foreground">
            Only visible to you
          </span>
        ) : null}
      </div>
      <h3 className="type-b1-md font-semibold text-foreground">
        {discussion.title}
      </h3>
      <p className="line-clamp-2 text-sm text-foreground-muted">
        {discussion.messagePreview}
      </p>
      <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
        <MessageSquare className="size-3.5" aria-hidden />
        <span>{discussion.threadCount} replies</span>
        {discussion.author?.name ? (
          <span>· {discussion.author.name}</span>
        ) : null}
      </div>
    </Link>
  )
}

export function LearnDiscussionsPage({
  discussions,
}: {
  discussions: Array<LearnDiscussionListItem>
}) {
  return (
    <div className="w-full">
      <div className="relative ml-[calc(50%-50vw)] w-screen max-w-[100vw]">
        <div
          className={`mx-auto w-full ${LAYOUT_MAX_WIDTH_CLASS} ${LAYOUT_MAIN_PADDING_X} py-6`}
        >
          <h1 className="type-h4 mb-4 font-semibold text-foreground">
            Discussions
          </h1>
          {discussions.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              No discussions yet in this program.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {discussions.map((discussion) => (
                <DiscussionRow key={discussion.id} discussion={discussion} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
