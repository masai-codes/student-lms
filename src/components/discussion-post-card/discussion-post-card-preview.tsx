import {
  ArrowBigDown,
  ArrowBigUp,
  Bookmark,
  MessageCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { RichTextContent } from "./rich-text-content";
import type { DiscussionPostCardProps, VoteDirection } from "./types";

type DiscussionPostCardPreviewProps = Pick<
  DiscussionPostCardProps,
  "profileImage" | "name" | "createdAt" | "content" | "hideDownvoteCount"
> & {
  currentUpvoteCount: number;
  currentDownvoteCount: number;
  isBookmarked?: boolean;
  onBookmarkClick?: () => void;
  onUpvoteClick: () => void;
  onDownvoteClick: () => void;
  onReplyClick?: () => void;
  replyCount: number;
  showReplyAction?: boolean;
  showBookmarkAction?: boolean;
  showDivider?: boolean;
  voteDirection?: VoteDirection;
};

type CountActionButtonProps = {
  icon: ReactNode;
  value: number;
  onClick: () => void;
  srLabel: string;
  hideValue?: boolean;
  isActive?: boolean;
};

function CountActionButton({
  icon,
  value,
  onClick,
  srLabel,
  hideValue = false,
  isActive = false,
}: CountActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer inline-flex items-center gap-[4px] rounded-[16px] px-[8px] py-[4px] text-[#3B3435] transition-colors hover:text-[#111928] ${
        isActive
          ? "bg-[#E5E7EB] text-[#111928]"
          : "bg-[#F3F4F6] hover:bg-[#E5E7EB]"
      }`}
    >
      {icon}
      {!hideValue ? (
        <span className="text-[12px] font-[400] leading-[16px] text-[#111928]">
          {value}
        </span>
      ) : null}
      <span className="sr-only">{srLabel}</span>
    </button>
  );
}

export function DiscussionPostCardPreview({
  profileImage,
  name,
  createdAt,
  content,
  currentUpvoteCount,
  currentDownvoteCount,
  hideDownvoteCount = false,
  isBookmarked = false,
  onBookmarkClick,
  onUpvoteClick,
  onDownvoteClick,
  onReplyClick,
  replyCount,
  showReplyAction = true,
  showBookmarkAction = true,
  showDivider = true,
  voteDirection = null,
}: DiscussionPostCardPreviewProps) {
  return (
    <article className="font-poppins w-full w-[100%] rounded-[12px] border border-[#E5E7EB] bg-white p-[12px]">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-[8px]">
          <img
            src={profileImage}
            alt={name}
            className="size-[36px] rounded-full"
          />
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-[500] leading-[20px] text-[#111928]">
              {name}
            </h3>
            <p className="text-[12px] leading-[16px] font-[400] text-[#4B5563]">
              {createdAt}
            </p>
          </div>
        </div>

        {showBookmarkAction ? (
          <button
            type="button"
            onClick={onBookmarkClick ?? (() => {})}
            className="cursor-pointer"
          >
            <Bookmark
              color="#544D4F"
              size={24}
              className={isBookmarked ? "fill-current" : ""}
            />
            <span className="sr-only">Bookmark discussion</span>
          </button>
        ) : null}
      </header>

      <RichTextContent
        html={content}
        className="mt-[12px] text-[14px] font-[400] leading-[20px] text-[#4B5563]"
      />

      {showDivider ? <div className="h-[1px] my-[16px] w-full bg-[#E5E7EB]" /> : null}
      <div className={showDivider ? "" : "mt-[16px]"}>
        <div className="flex flex-wrap items-center gap-[16px]">
          <CountActionButton
            icon={
              <ArrowBigUp
                size={16}
                color="#374151"
                className={voteDirection === "up" ? "fill-current" : ""}
              />
            }
            value={currentUpvoteCount}
            onClick={onUpvoteClick}
            srLabel="Upvote discussion"
            isActive={voteDirection === "up"}
          />
          <CountActionButton
            icon={
              <ArrowBigDown
                size={16}
                color="#374151"
                className={voteDirection === "down" ? "fill-current" : ""}
              />
            }
            value={currentDownvoteCount}
            onClick={onDownvoteClick}
            srLabel="Downvote discussion"
            hideValue={hideDownvoteCount}
            isActive={voteDirection === "down"}
          />
          {showReplyAction ? (
            <CountActionButton
              icon={<MessageCircle size={16} color="#374151" />}
              value={replyCount}
              onClick={onReplyClick ?? (() => {})}
              srLabel="Open replies"
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
