"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { DiscussionPostCardPreview } from "./discussion-post-card-preview";
import { DiscussionPostCardComposer } from "./discussion-post-card-composer";
import type {
  DiscussionPostCardProps,
  DrawerDirection,
  VoteDirection,
} from "./types";

import { cn } from "@/lib/utils";

type DiscussionPostCardDrawerProps = Pick<
  DiscussionPostCardProps,
  | "profileImage"
  | "name"
  | "createdAt"
  | "content"
  | "currentUpvoteCount"
  | "currentDownvoteCount"
  | "voteDirection"
  | "hideDownvoteCount"
  | "onUpvoteClick"
  | "onDownvoteClick"
  | "replies"
  | "replyText"
  | "onReplyTextChange"
  | "onReplySubmit"
  | "replyPlaceholder"
  | "drawerBottomInsetClassName"
  | "drawerBodyClassName"
  | "drawerPinFooter"
  | "drawerFooterClassName"
> & {
  isBookmarked: boolean;
  onBookmarkClick: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resolvedDirection: Exclude<DrawerDirection, "auto">;
};

export function DiscussionPostCardDrawer({
  profileImage,
  name,
  createdAt,
  content,
  currentUpvoteCount,
  currentDownvoteCount,
  voteDirection = null,
  hideDownvoteCount = false,
  onUpvoteClick,
  onDownvoteClick,
  replies = [],
  replyText,
  onReplyTextChange,
  onReplySubmit,
  replyPlaceholder,
  isBookmarked,
  onBookmarkClick,
  open,
  onOpenChange,
  resolvedDirection,
  drawerBottomInsetClassName,
  drawerBodyClassName,
  drawerPinFooter = true,
  drawerFooterClassName,
}: DiscussionPostCardDrawerProps) {
  const [replyVotes, setReplyVotes] = React.useState<
    Record<string, { upvotes: number; downvotes: number; direction: VoteDirection }>
  >({});

  React.useEffect(() => {
    setReplyVotes(
      replies.reduce<
        Record<string, { upvotes: number; downvotes: number; direction: VoteDirection }>
      >(
        (accumulator, reply) => {
          accumulator[reply.id] = {
            upvotes: reply.currentUpvoteCount ?? 0,
            downvotes: reply.currentDownvoteCount ?? 0,
            direction: reply.voteDirection ?? null,
          };
          return accumulator;
        },
        {},
      ),
    );
  }, [replies]);

  const composerFooter = (
    <div
      className={cn(
        "bg-white",
        drawerPinFooter && "shrink-0 border-t p-4",
        drawerPinFooter &&
          resolvedDirection === "bottom" &&
          "shadow-[0_-4px_16px_rgba(0,0,0,0.06)]",
        !drawerPinFooter && "mt-4 border-t border-[#E5E7EB] pt-4",
        drawerFooterClassName,
      )}
    >
      <DiscussionPostCardComposer
        profileImage={profileImage}
        replyText={replyText}
        onReplyTextChange={onReplyTextChange}
        onReplySubmit={onReplySubmit}
        placeholder={replyPlaceholder}
      />
    </div>
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <Dialog.Content
          className={cn(
            "fixed z-50 border bg-white font-poppins shadow-xl outline-none",
            resolvedDirection === "right"
              ? "right-0 top-0 flex h-svh w-full max-w-[460px] flex-col border-l transition-transform duration-300 ease-out will-change-transform data-[state=closed]:translate-x-full data-[state=open]:translate-x-0"
              : "bottom-0 left-0 flex max-h-[88svh] w-full flex-col rounded-t-2xl border-t transition-transform duration-300 ease-out will-change-transform data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
            drawerBottomInsetClassName,
          )}
        >
          <div className="flex items-start justify-between border-b p-4">
            <Dialog.Title className="text-lg font-semibold text-[#111928]">
              Discussion Thread
            </Dialog.Title>
            <Dialog.Close className="inline-flex size-8 items-center justify-center rounded-md border text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111928]">
              <X size={16} />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto p-4",
              drawerBodyClassName,
            )}
          >
            <DiscussionPostCardPreview
              profileImage={profileImage}
              name={name}
              createdAt={createdAt}
              content={content}
              currentUpvoteCount={currentUpvoteCount}
              currentDownvoteCount={currentDownvoteCount}
              voteDirection={voteDirection}
              hideDownvoteCount={hideDownvoteCount}
              isBookmarked={isBookmarked}
              onBookmarkClick={onBookmarkClick}
              onUpvoteClick={onUpvoteClick}
              onDownvoteClick={onDownvoteClick}
              replyCount={replies.length}
              showReplyAction={false}
            />

            <div className="mt-4">
              <p className="text-[14px] font-[600] leading-[20px] text-[#111928]">
                Responses
              </p>
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
                      currentDownvoteCount={
                        replyVotes[reply.id]?.downvotes ?? 0
                      }
                      voteDirection={replyVotes[reply.id]?.direction ?? null}
                      hideDownvoteCount={hideDownvoteCount}
                      onUpvoteClick={() => {
                        setReplyVotes((current) => {
                          const currentState = current[reply.id] ?? {
                            upvotes: 0,
                            downvotes: 0,
                            direction: null,
                          };

                          if (currentState.direction === "up") {
                            return {
                              ...current,
                              [reply.id]: {
                                ...currentState,
                                upvotes: Math.max(currentState.upvotes - 1, 0),
                                direction: null,
                              },
                            };
                          }

                          if (currentState.direction === "down") {
                            return {
                              ...current,
                              [reply.id]: {
                                upvotes: currentState.upvotes + 1,
                                downvotes: Math.max(currentState.downvotes - 1, 0),
                                direction: "up",
                              },
                            };
                          }

                          return {
                            ...current,
                            [reply.id]: {
                              ...currentState,
                              upvotes: currentState.upvotes + 1,
                              direction: "up",
                            },
                          };
                        });
                      }}
                      onDownvoteClick={() => {
                        setReplyVotes((current) => {
                          const currentState = current[reply.id] ?? {
                            upvotes: 0,
                            downvotes: 0,
                            direction: null,
                          };

                          if (currentState.direction === "down") {
                            return {
                              ...current,
                              [reply.id]: {
                                ...currentState,
                                downvotes: Math.max(currentState.downvotes - 1, 0),
                                direction: null,
                              },
                            };
                          }

                          if (currentState.direction === "up") {
                            return {
                              ...current,
                              [reply.id]: {
                                upvotes: Math.max(currentState.upvotes - 1, 0),
                                downvotes: currentState.downvotes + 1,
                                direction: "down",
                              },
                            };
                          }

                          return {
                            ...current,
                            [reply.id]: {
                              ...currentState,
                              downvotes: currentState.downvotes + 1,
                              direction: "down",
                            },
                          };
                        });
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

            {!drawerPinFooter ? composerFooter : null}
          </div>

          {drawerPinFooter ? composerFooter : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
