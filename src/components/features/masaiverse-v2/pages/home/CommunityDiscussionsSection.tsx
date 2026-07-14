import { useEffect, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import DiscussionComposer from './DiscussionComposer'
import DiscussionRow from './DiscussionRow'
import SectionHeader from './SectionHeader'
import { DiscussionRowSkeleton, repeat } from './skeletons'
import type { MasaiverseV2Discussion } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import {
  DISCUSSIONS_PUBLIC_TAB,
  masaiverseV2DiscussionsInfiniteQuery,
} from '@/query/masaiverse-v2/discussionsQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

/** Avatar colors cycled per row so adjacent authors differ. */
const AVATAR_COLORS = [
  'var(--color-masaiverse-orange)',
  '#6D28D9',
  '#2E7D46',
  '#2563EB',
  '#DB2777',
]

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
    const id = setTimeout(() => {
      const trimmed = searchInput.trim()
      setSearch(trimmed)
      // Track the committed (debounced) query, not every keystroke.
      if (trimmed) {
        trackMasaiverse(MASAIVERSE_EVENTS.discussionSearch, {
          query: trimmed,
          club_id: clubId,
        })
      }
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput, clubId])

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
          hideViewAllLink ? undefined : (
            <Link
              to="/masaiverse/discussions"
              // Deep-link to the matching tab on the discussions page: this
              // club's feed, or the public feed when unscoped.
              search={(prev) => ({
                ...prev,
                tab: clubId ?? DISCUSSIONS_PUBLIC_TAB,
              })}
              onClick={() =>
                trackMasaiverse(MASAIVERSE_EVENTS.seeAllClick, {
                  section: 'discussions',
                  to: 'discussions',
                  club_id: clubId,
                })
              }
              className="text-[14px] font-medium text-accent-warm hover:underline"
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
          onClick={() => {
            trackMasaiverse(MASAIVERSE_EVENTS.discussionComposeOpen, {
              club_id: clubId,
            })
            setIsComposing(true)
          }}
          className="w-full rounded-[14px] bg-accent-warm py-3.5 text-[15px] font-semibold text-accent-warm-foreground hover:bg-accent-warm-hover"
        >
          + Start a discussion
        </button>
      )}

      {isPreloaded ? null : (
        <div className="relative mt-3">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search discussions by title, content or tag…"
            className="w-full rounded-[12px] border border-border bg-surface py-2 pl-9 pr-3 text-[14px] text-foreground outline-none placeholder:text-foreground-subtle"
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
        <p className="mt-4 text-[14px] text-foreground-muted">
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
                clubId={clubId}
              />
            ))}
          </div>
          {showLoadMore ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                disabled={isFetchingNextPage}
                onClick={() => {
                  trackMasaiverse(MASAIVERSE_EVENTS.discussionLoadMore, {
                    club_id: clubId,
                  })
                  fetchNextPage()
                }}
                className="rounded-full border border-border bg-surface px-5 py-2 text-[14px] font-medium text-accent-warm hover:bg-surface-muted disabled:opacity-50"
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
