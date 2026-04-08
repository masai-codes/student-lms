import { useEffect, useState } from 'react'
import DiscussionsList from './DiscussionsList'
import CreateDiscussion from './CreateDiscussion'
import type { DiscussionPost } from '@/server/masaiverse/communityDiscussions'
import {
  createCommunityPost,
  createCommunityReply,
  fetchCommunityDiscussions,
  voteCommunityPost,
  voteCommunityReply,
} from '@/server/masaiverse/communityDiscussions'

const Disucssions = () => {
  const [posts, setPosts] = useState<Array<DiscussionPost>>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)

  const refreshDiscussions = async (showInitialLoader = false) => {
    if (showInitialLoader) {
      setIsInitialLoading(true)
    }
    try {
      const response = await fetchCommunityDiscussions()
      setPosts(response.posts)
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

  return (
    <div className="space-y-4">
      <CreateDiscussion onCreate={handleCreatePost} isSubmitting={isPosting} />
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
        />
      )}
    </div>
  )
}

export default Disucssions
