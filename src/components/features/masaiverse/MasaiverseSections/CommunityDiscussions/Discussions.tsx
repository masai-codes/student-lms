import { useEffect, useState } from 'react'
import DiscussionsList from './DiscussionsList'
import CreateDiscussion from './CreateDiscussion'
import type { DiscussionPost } from '@/server/masaiverse/communityDiscussions'
import {
  createCommunityPost,
  createCommunityReply,
  fetchCommunityDiscussions,
  toggleCommunityPostBookmark,
  voteCommunityPost,
  voteCommunityReply,
} from '@/server/masaiverse/communityDiscussions'
import type { DiscussionSortMode } from '@/server/masaiverse/communityDiscussions'

const discussionSortOptions: Array<{ key: DiscussionSortMode; label: string }> =
  [
    { key: 'new', label: 'New' },
    { key: 'hot', label: 'Hot' },
    { key: 'top', label: 'Top' },
  ]

const Disucssions = () => {
  const [posts, setPosts] = useState<Array<DiscussionPost>>([])
  const [currentUserName, setCurrentUserName] = useState('')
  const [currentUserProfileImage, setCurrentUserProfileImage] = useState<
    string | null
  >(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [sortBy, setSortBy] = useState<DiscussionSortMode>('new')

  const refreshDiscussions = async (
    showInitialLoader = false,
    selectedSort: DiscussionSortMode = sortBy,
  ) => {
    if (showInitialLoader) {
      setIsInitialLoading(true)
    }
    try {
      const response = await fetchCommunityDiscussions({
        data: { sortBy: selectedSort },
      })
      setPosts(response.posts)
      setCurrentUserName(response.currentUserName ?? '')
      setCurrentUserProfileImage(response.currentUserProfileImage ?? null)
      setSortBy(response.sortBy ?? selectedSort)
    } finally {
      if (showInitialLoader) {
        setIsInitialLoading(false)
      }
    }
  }

  useEffect(() => {
    void refreshDiscussions(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreatePost = async (content: string) => {
    setIsPosting(true)
    try {
      await createCommunityPost({ data: { content } })
      await refreshDiscussions()
    } finally {
      setIsPosting(false)
    }
  }

  const handleReply = async (postId: string, content: string) => {
    await createCommunityReply({ data: { postId, content } })
    await refreshDiscussions()
  }

  const handleVotePost = async (
    postId: string,
    vote: 'upvote' | 'downvote',
  ) => {
    await voteCommunityPost({ data: { postId, vote } })
    await refreshDiscussions()
  }

  const handleVoteReply = async (
    replyId: string,
    vote: 'upvote' | 'downvote',
  ) => {
    await voteCommunityReply({ data: { replyId, vote } })
    await refreshDiscussions()
  }

  const handleToggleBookmark = async (postId: string) => {
    await toggleCommunityPostBookmark({ data: { postId } })
    await refreshDiscussions()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {discussionSortOptions.map((option) => {
          const isActive = sortBy === option.key
          return (
            <button
              key={option.key}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors text-[#4B5563] ${
                isActive
                  ? 'border-[#EF8833] bg-[#FBE7D6] text-[#C96B1E]'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]'
              }`}
              onClick={() => {
                if (sortBy === option.key) return
                setSortBy(option.key)
                void refreshDiscussions(false, option.key)
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {isInitialLoading ? (
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
          Loading discussions...
        </div>
      ) : (
        <DiscussionsList
          posts={posts}
          onVotePost={handleVotePost}
          onVoteReply={handleVoteReply}
          onReply={handleReply}
          onToggleBookmark={handleToggleBookmark}
        />
      )}
      <div className="sticky bottom-0 z-10 bg-white/95 pt-2 backdrop-blur">
        <CreateDiscussion
          onCreate={handleCreatePost}
          isSubmitting={isPosting}
          currentUserName={currentUserName}
          currentUserProfileImage={currentUserProfileImage}
        />
      </div>
    </div>
  )
}

export default Disucssions
