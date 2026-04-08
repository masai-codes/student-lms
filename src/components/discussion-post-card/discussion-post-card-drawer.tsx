"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { DiscussionPostCardPreview } from "./discussion-post-card-preview"
import { DiscussionPostCardComposer } from "./discussion-post-card-composer"
import type { DiscussionPostCardProps, DrawerDirection } from "./types"

type DiscussionPostCardDrawerProps = Pick<
  DiscussionPostCardProps,
  | "profileImage"
  | "name"
  | "createdAt"
  | "content"
  | "currentUpvoteCount"
  | "currentDownvoteCount"
  | "onUpvoteClick"
  | "onDownvoteClick"
  | "replies"
  | "replyText"
  | "onReplyTextChange"
  | "onReplySubmit"
> & {
  isBookmarked: boolean
  onBookmarkClick: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  resolvedDirection: Exclude<DrawerDirection, "auto">
}

export function DiscussionPostCardDrawer({
  profileImage,
  name,
  createdAt,
  content,
  currentUpvoteCount,
  currentDownvoteCount,
  onUpvoteClick,
  onDownvoteClick,
  replies = [],
  replyText,
  onReplyTextChange,
  onReplySubmit,
  isBookmarked,
  onBookmarkClick,
  open,
  onOpenChange,
  resolvedDirection,
}: DiscussionPostCardDrawerProps) {
  const [replyVotes, setReplyVotes] = React.useState<
    Record<string, { upvotes: number; downvotes: number }>
  >({})

  React.useEffect(() => {
    setReplyVotes(
      replies.reduce<Record<string, { upvotes: number; downvotes: number }>>((accumulator, reply) => {
        accumulator[reply.id] = {
          upvotes: reply.currentUpvoteCount ?? 0,
          downvotes: reply.currentDownvoteCount ?? 0,
        }
        return accumulator
      }, {})
    )
  }, [replies])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <Dialog.Content
          className={`fixed z-50 border bg-white font-poppins shadow-xl outline-none ${
            resolvedDirection === "right"
              ? "right-0 top-0 flex h-svh w-full max-w-[460px] flex-col border-l transition-transform duration-300 ease-out will-change-transform data-[state=closed]:translate-x-full data-[state=open]:translate-x-0"
              : "bottom-0 left-0 flex max-h-[88svh] w-full flex-col rounded-t-2xl border-t transition-transform duration-300 ease-out will-change-transform data-[state=closed]:translate-y-full data-[state=open]:translate-y-0"
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
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                      }
                      name={reply.author}
                      createdAt={reply.createdAt}
                      content={reply.content}
                      currentUpvoteCount={replyVotes[reply.id]?.upvotes ?? 0}
                      currentDownvoteCount={replyVotes[reply.id]?.downvotes ?? 0}
                      onUpvoteClick={() =>
                        setReplyVotes((current) => ({
                          ...current,
                          [reply.id]: {
                            upvotes: (current[reply.id]?.upvotes ?? 0) + 1,
                            downvotes: current[reply.id]?.downvotes ?? 0,
                          },
                        }))
                      }
                      onDownvoteClick={() =>
                        setReplyVotes((current) => ({
                          ...current,
                          [reply.id]: {
                            upvotes: current[reply.id]?.upvotes ?? 0,
                            downvotes: (current[reply.id]?.downvotes ?? 0) + 1,
                          },
                        }))
                      }
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
