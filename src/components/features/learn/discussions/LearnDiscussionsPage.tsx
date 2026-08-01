import { Link, useRouteContext } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { LearnDiscussionListItem } from '@/server/learn/types'
import { LAYOUT_MAIN_PADDING_X, LAYOUT_MAX_WIDTH_CLASS } from '@/lib/layout'
import { MasaiInput } from '@/components/ui/masai-input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  filterLearnDiscussions,
  type LearnDiscussionsFilters,
} from '@/components/features/learn/discussions/utils/filterLearnDiscussions'
import { Input } from '@/components/ui/input'

const CONTENT_LINK: Record<
  LearnDiscussionListItem['contentType'],
  (id: number) => { to: string; params: Record<string, string> }
> = {
  lecture: (id) => ({
    to: '/learn/lectures/$lectureId',
    params: { lectureId: String(id) },
  }),
  resource: (id) => ({
    to: '/learn/resources/$resourceId',
    params: { resourceId: String(id) },
  }),
  assignment: (id) => ({
    to: '/learn/assignments/$assignmentId',
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

function DiscussionsToolbar({
  filters,
  onChange,
}: {
  filters: LearnDiscussionsFilters
  onChange: (next: Partial<LearnDiscussionsFilters>) => void
}) {
  return (
    <div
      data-testid="learn-discussions-toolbar"
      className="mb-4 flex flex-wrap items-center gap-2"
    >
      <Input
        data-testid="learn-discussions-search-input"
        type="search"
        value={filters.search}
        onChange={(event) => onChange({ search: event.target.value })}
        placeholder="Search discussions"
        aria-label="Search discussions"
        className="min-w-40 flex-1"
      />
      <Select
        value={filters.contentType}
        onValueChange={(value) =>
          onChange({
            contentType: value as LearnDiscussionsFilters['contentType'],
          })
        }
      >
        <SelectTrigger
          data-testid="learn-discussions-type-filter"
          size="sm"
          aria-label="Filter by content type"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="lecture">Lecture</SelectItem>
          <SelectItem value="assignment">Assignment</SelectItem>
          <SelectItem value="resource">Resource</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(value) =>
          onChange({ status: value as LearnDiscussionsFilters['status'] })
        }
      >
        <SelectTrigger
          data-testid="learn-discussions-status-filter"
          size="sm"
          aria-label="Filter by status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex shrink-0 items-center gap-2">
        <Switch
          id="learn-discussions-mine-toggle"
          data-testid="learn-discussions-mine-toggle"
          checked={filters.mineOnly}
          onCheckedChange={(checked) => onChange({ mineOnly: checked })}
        />
        <label
          htmlFor="learn-discussions-mine-toggle"
          className="type-b3-md cursor-pointer whitespace-nowrap text-foreground"
        >
          My discussions
        </label>
      </div>
    </div>
  )
}

export function LearnDiscussionsPage({
  discussions,
}: {
  discussions: Array<LearnDiscussionListItem>
}) {
  const { user } = useRouteContext({ from: '/(protected)/_layout' })
  const currentUserId = user?.id ?? null

  const [search, setSearch] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [contentType, setContentType] =
    useState<LearnDiscussionsFilters['contentType']>('all')
  const [status, setStatus] = useState<LearnDiscussionsFilters['status']>('all')

  const filters: LearnDiscussionsFilters = {
    search,
    mineOnly,
    currentUserId,
    contentType,
    status,
  }

  const filtered = useMemo(
    () => filterLearnDiscussions(discussions, filters),
    [discussions, search, mineOnly, currentUserId, contentType, status],
  )

  const handleFilterChange = (next: Partial<LearnDiscussionsFilters>) => {
    if (next.search !== undefined) setSearch(next.search)
    if (next.mineOnly !== undefined) setMineOnly(next.mineOnly)
    if (next.contentType !== undefined) setContentType(next.contentType)
    if (next.status !== undefined) setStatus(next.status)
  }

  const hasActiveFilters =
    mineOnly ||
    search.trim() !== '' ||
    contentType !== 'all' ||
    status !== 'all'

  return (
    <div className="w-full">
      <div className="relative ml-[calc(50%-50vw)] w-screen max-w-[100vw]">
        <div
          className={`mx-auto w-full ${LAYOUT_MAX_WIDTH_CLASS} ${LAYOUT_MAIN_PADDING_X}`}
        >
          <h1 className="type-h4 mb-4 font-semibold text-foreground">
            Discussions
          </h1>
          {discussions.length > 0 ? (
            <DiscussionsToolbar
              filters={filters}
              onChange={handleFilterChange}
            />
          ) : null}
          {filtered.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              {hasActiveFilters
                ? 'No discussions match your filters.'
                : 'No discussions yet in this program.'}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((discussion) => (
                <DiscussionRow key={discussion.id} discussion={discussion} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
