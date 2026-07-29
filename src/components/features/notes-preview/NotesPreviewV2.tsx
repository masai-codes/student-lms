import { useQuery } from '@tanstack/react-query'
import { NoteBlank } from '@phosphor-icons/react'

import { MarkdownContent } from '@/components/shared/markdown-content'
import { fetchNotesPreviewFromApi } from '@/lib/api/notes-preview/notesPreviewApi'

import { notesPreviewRouteApi } from './notesPreviewRoute'

function PreviewShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-testid="notes-preview-v2-root"
      className="min-h-dvh bg-background text-foreground animate-dash-rise px-4 py-5 sm:px-6 sm:py-8"
    >
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </div>
  )
}

function LoadingState() {
  return (
    <div data-testid="notes-preview-v2-loading" className="space-y-3">
      <span className="sr-only">Loading…</span>
      <div className="dash-skeleton h-7 w-2/3 rounded-md" />
      <div className="dash-skeleton h-4 w-full rounded-md" />
      <div className="dash-skeleton h-4 w-11/12 rounded-md" />
      <div className="dash-skeleton h-4 w-full rounded-md" />
      <div className="dash-skeleton h-4 w-4/5 rounded-md" />
      <div className="dash-skeleton h-4 w-3/4 rounded-md" />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      data-testid="notes-preview-v2-empty"
      className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 text-center"
    >
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand animate-dash-float"
      >
        <NoteBlank size={28} weight="duotone" />
      </span>
      <p className="type-body-md text-foreground-muted max-w-xs wrap-break-word">
        {message}
      </p>
    </div>
  )
}

const EMPTY_MESSAGE = 'There is nothing to show here yet.'
const ERROR_MESSAGE = "This content couldn't be loaded right now."

export function NotesPreviewV2() {
  const { user } = notesPreviewRouteApi.useRouteContext()
  const { category, contentType, entityId } = notesPreviewRouteApi.useSearch()
  const hasParams = Boolean(category && contentType && entityId)

  const userHeader = user ? (
    <div
      data-testid="notes-preview-v2-user"
      className="type-body-md text-foreground-muted wrap-break-word"
    >
      {user.id} {user.email}
    </div>
  ) : null

  const query = useQuery({
    queryKey: ['notes-preview-v2', category, contentType, entityId],
    enabled: hasParams,
    queryFn: () =>
      fetchNotesPreviewFromApi({
        category: category ?? '',
        contentType: contentType ?? '',
        entityId: entityId ?? '',
      }),
  })

  if (!hasParams) {
    return (
      <PreviewShell>
        {userHeader}
        <EmptyState message={EMPTY_MESSAGE} />
      </PreviewShell>
    )
  }

  if (query.isPending) {
    return (
      <PreviewShell>
        {userHeader}
        <LoadingState />
      </PreviewShell>
    )
  }

  if (query.isError) {
    return (
      <PreviewShell>
        {userHeader}
        <EmptyState message={ERROR_MESSAGE} />
      </PreviewShell>
    )
  }

  const content = query.data.content
  if (!content || !content.trim()) {
    return (
      <PreviewShell>
        {userHeader}
        <EmptyState message={EMPTY_MESSAGE} />
      </PreviewShell>
    )
  }

  return (
    <PreviewShell>
      {userHeader}
      <div data-testid="notes-preview-v2-content">
        <MarkdownContent value={content} variant="detail" />
      </div>
    </PreviewShell>
  )
}
