import { createFileRoute } from '@tanstack/react-router'

import type {BookmarkType} from '@/components/features/bookmark/BookmarkTabFilters';
import { FilterAndSeachBar } from '@/components/common'
import { BookmarkTabFilters  } from '@/components/features/bookmark/BookmarkTabFilters'

export type DiscussionType = BookmarkType

export const Route = createFileRoute('/(protected)/_layout/bookmark/')({
  validateSearch: search => {
    const page =
      typeof search.page === 'number' ? search.page : Number(search.page)

    const type: BookmarkType | undefined =
      search.type === 'lecture' ||
      search.type === 'assignment' ||
      search.type === 'resources' ||
      search.type === 'announcement' ||
      search.type === 'discussion'
        ? search.type
        : undefined

    return {
      page: page && page > 0 ? page : undefined,
      type,
    }
  },

  component: RouteComponent,
})

function RouteComponent() {
  const { type } = Route.useSearch()

  const activeType: BookmarkType | undefined =
    type === 'lecture' ||
    type === 'assignment' ||
    type === 'resources' ||
    type === 'announcement' ||
    type === 'discussion'
      ? type
      : undefined

  return (
    <div className="w-full space-y-6 py-6">
      <h2 className="text-2xl font-bold">Bookmarks</h2>

      <div className="flex justify-between items-center">
        <BookmarkTabFilters activeType={activeType} />
        <FilterAndSeachBar referer="bookmark" />
      </div>

      <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground">
        <p className="text-base">
          Bookmarked items for this filter are not available here yet. Discussion bookmarks will return when
          the new discussions experience is wired to this page.
        </p>
      </div>
    </div>
  )
}
