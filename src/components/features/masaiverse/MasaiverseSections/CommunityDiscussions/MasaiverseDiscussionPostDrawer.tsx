import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { DiscussionPostCardComposer } from '@/components/discussion-post-card'
import { DiscussionPostCardPreview } from '@/components/discussion-post-card/discussion-post-card-preview'
import type { DiscussionReply as DiscussionPostCardReply } from '@/components/discussion-post-card'

type MasaiverseDiscussionPostDrawerProps = {
  profileImage: string
  name: string
  createdAt: string
  content: string
  currentUpvoteCount: number
  currentDownvoteCount: number
  voteDirection?: 'up' | 'down' | null
  onUpvoteClick: () => void
  onDownvoteClick: () => void
  replies: Array<DiscussionPostCardReply>
  onVoteReply: (replyId: string, vote: 'upvote' | 'downvote') => Promise<void>
  replyText: string
  onReplyTextChange: (value: string) => void
  onReplySubmit?: () => void
  isBookmarked: boolean
  onBookmarkClick: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  resolvedDirection: 'right' | 'bottom'
}

export default function MasaiverseDiscussionPostDrawer({
  profileImage,
  name,
  createdAt,
  content,
  currentUpvoteCount,
  currentDownvoteCount,
  voteDirection = null,
  onUpvoteClick,
  onDownvoteClick,
  replies,
  onVoteReply,
  replyText,
  onReplyTextChange,
  onReplySubmit,
  isBookmarked,
  onBookmarkClick,
  open,
  onOpenChange,
  resolvedDirection,
}: MasaiverseDiscussionPostDrawerProps) {
  const getFallbackAvatar = (name: string) => {
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U'

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="100%" height="100%" fill="#F3F4F6"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="28" font-weight="600">${initials}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <Dialog.Content
          className={`fixed z-50 border bg-white font-poppins shadow-xl outline-none ${
            resolvedDirection === 'right'
              ? 'right-0 top-0 flex h-svh w-full max-w-[460px] flex-col border-l transition-transform duration-300 ease-out will-change-transform data-[state=closed]:translate-x-full data-[state=open]:translate-x-0'
              : 'bottom-0 left-0 flex max-h-[88svh] w-full flex-col rounded-t-2xl border-t transition-transform duration-300 ease-out will-change-transform data-[state=closed]:translate-y-full data-[state=open]:translate-y-0'
          }`}
        >
          <div className="flex items-start justify-between border-b p-4">
            <Dialog.Title className="text-lg font-semibold text-[#111928]">Discussion</Dialog.Title>
            <Dialog.Close className="inline-flex size-8 items-center justify-center rounded-md border text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111928]">
              <X size={16} />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <DiscussionPostCardPreview
              profileImage={profileImage}
              name={name}
              createdAt={createdAt}
              content={content}
              currentUpvoteCount={currentUpvoteCount}
              currentDownvoteCount={currentDownvoteCount}
              voteDirection={voteDirection}
              hideDownvoteCount={true}
              isBookmarked={isBookmarked}
              onBookmarkClick={onBookmarkClick}
              onUpvoteClick={onUpvoteClick}
              onDownvoteClick={onDownvoteClick}
              replyCount={replies.length}
              showReplyAction={false}
            />

            <div className="mt-4">
              <p className="text-[14px] font-[600] leading-[20px] text-[#111928]">Replies</p>
              {replies.length ? (
                <div className="mt-3 space-y-3">
                  {replies.map((reply) => (
                    <DiscussionPostCardPreview
                      key={reply.id}
                      profileImage={
                        reply.profileImage ||
                        getFallbackAvatar(reply.author)
                      }
                      name={reply.author}
                      createdAt={reply.createdAt}
                      content={reply.content}
                      currentUpvoteCount={reply.currentUpvoteCount ?? 0}
                      currentDownvoteCount={reply.currentDownvoteCount ?? 0}
                      voteDirection={reply.voteDirection ?? null}
                      hideDownvoteCount={true}
                      onUpvoteClick={() => {
                        void onVoteReply(reply.id, 'upvote')
                      }}
                      onDownvoteClick={() => {
                        void onVoteReply(reply.id, 'downvote')
                      }}
                      replyCount={0}
                      showReplyAction={false}
                      showBookmarkAction={false}
                      showDivider={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-[10px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-4 text-[13px] text-[#6B7280]">
                  No replies yet. Start the discussion.
                </div>
              )}
            </div>
          </div>

          <div className="border-t p-4">
            <DiscussionPostCardComposer
              profileImage={profileImage}
              replyText={replyText}
              onReplyTextChange={onReplyTextChange}
              onReplySubmit={onReplySubmit}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
