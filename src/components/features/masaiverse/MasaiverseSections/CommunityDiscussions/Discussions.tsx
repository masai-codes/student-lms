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

const Disucssions = () => {
  const [posts, setPosts] = useState<Array<DiscussionPost>>([])
  const [currentUserName, setCurrentUserName] = useState('')
  const [currentUserProfileImage, setCurrentUserProfileImage] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)

  const refreshDiscussions = async (showInitialLoader = false) => {
    if (showInitialLoader) {
      setIsInitialLoading(true)
    }
    try {
      const response = await fetchCommunityDiscussions()
      setPosts(response.posts)
      setCurrentUserName(response.currentUserName ?? '')
      setCurrentUserProfileImage(response.currentUserProfileImage ?? null)
    } finally {
      if (showInitialLoader) {
        setIsInitialLoading(false)
      }
    }
  }

  useEffect(() => {
    void refreshDiscussions(true)
  }, [])

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
    vote: 'upvote' | 'downvote'
  ) => {
    await voteCommunityPost({ data: { postId, vote } })
    await refreshDiscussions()
  }

  const handleVoteReply = async (
    replyId: string,
    vote: 'upvote' | 'downvote'
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
