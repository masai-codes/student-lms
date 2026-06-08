import { useEffect, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import DiscussionComposer from './DiscussionComposer'
import DiscussionRow from './DiscussionRow'
import SectionHeader from './SectionHeader'
import { DiscussionRowSkeleton, repeat } from './skeletons'
import type { MasaiverseV2Discussion } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import { masaiverseV2DiscussionsInfiniteQuery } from '@/query/masaiverse-v2/discussionsQuery'

/** Avatar colors cycled per row so adjacent authors differ. */
const AVATAR_COLORS = ['var(--color-masaiverse-orange)', '#6D28D9', '#2E7D46', '#2563EB', '#DB2777']

type CommunityDiscussionsSectionProps = {
  /** Scopes the feed and new posts to a single club; omit for the community feed. */
  clubId?: string
  /** Heading shown above the feed. */
  title?: string
  /** Hides the "View all" link (e.g. on the discussions page itself). */
  hideViewAllLink?: boolean
  /**
   * Latest discussions embedded in the home / club detail payload. When given
   * (or while `preloadedLoading` is true), the section renders exactly these
   * (newest 5) with no search box and no pagination — the feed is sourced from
   * the parent's single request. Omit it for the standalone, searchable,
   * paginated feed (the "View all" page).
   */
  preloadedDiscussions?: Array<MasaiverseV2Discussion>
  /** True while the parent payload that carries `preloadedDiscussions` loads. */
  preloadedLoading?: boolean
}

export default function CommunityDiscussionsSection({
  clubId,
  title = 'Community Discussions',
  hideViewAllLink = false,
  preloadedDiscussions,
  preloadedLoading = false,
}: CommunityDiscussionsSectionProps = {}) {
  const isPreloaded = preloadedDiscussions !== undefined || preloadedLoading
  const [isComposing, setIsComposing] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Debounce so we query ~300ms after the user stops typing, not per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      ...masaiverseV2DiscussionsInfiniteQuery(search, clubId),
      // In preloaded mode the list comes from the parent payload; don't fetch.
      enabled: !isPreloaded,
    })

  const discussions = isPreloaded
    ? (preloadedDiscussions ?? [])
    : (data?.pages.flatMap((page) => page.discussions) ?? [])
  const showSkeleton = isPreloaded ? preloadedLoading : isPending
  const showLoadMore = !isPreloaded && hasNextPage

  return (
    <section>
      <SectionHeader
        title={title}
        action={
          clubId || hideViewAllLink ? undefined : (
            <Link
              to="/masaiverse/discussions"
              search={(prev) => prev}
              className="text-[14px] font-medium text-masaiverse-orange hover:underline"
            >
              View all →
            </Link>
          )
        }
      />

      {isComposing ? (
        <DiscussionComposer
          clubId={clubId}
          onClose={() => setIsComposing(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsComposing(true)}
          className="w-full rounded-[14px] bg-masaiverse-orange py-3.5 text-[15px] font-semibold text-white hover:bg-masaiverse-orange-dark"
        >
          + Start a discussion
        </button>
      )}

      {isPreloaded ? null : (
        <div className="relative mt-3">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search discussions by title, content or tag…"
            className="w-full rounded-[12px] border border-[#EDEAE8] bg-white py-2 pl-9 pr-3 text-[14px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
          />
        </div>
      )}

      {showSkeleton ? (
        <div role="status" aria-label="Loading discussions" className="mt-2">
          <span className="sr-only">Loading discussions…</span>
          {repeat(4, (key) => (
            <DiscussionRowSkeleton key={key} />
          ))}
        </div>
      ) : discussions.length === 0 ? (
        <p className="mt-4 text-[14px] text-[#6B7280]">
          {search
            ? `No discussions match “${search}”.`
            : 'No discussions yet — start the first one!'}
        </p>
      ) : (
        <>
          <div className="mt-2">
            {discussions.map((discussion, index) => (
              <DiscussionRow
                key={discussion.id}
                discussion={discussion}
                accentColor={AVATAR_COLORS[index % AVATAR_COLORS.length]}
              />
            ))}
          </div>
          {showLoadMore ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
                className="rounded-full border border-[#EDEAE8] bg-white px-5 py-2 text-[14px] font-medium text-masaiverse-orange hover:bg-[#FAF7F5] disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
