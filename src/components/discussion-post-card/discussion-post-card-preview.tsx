import {
  ArrowBigDown,
  ArrowBigUp,
  Bookmark,
  MessageCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { RichTextContent } from "./rich-text-content";
import type { DiscussionPostCardProps } from "./types";

type DiscussionPostCardPreviewProps = Pick<
  DiscussionPostCardProps,
  "profileImage" | "name" | "createdAt" | "content"
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
};

type CountActionButtonProps = {
  icon: ReactNode;
  value: number;
  onClick: () => void;
  srLabel: string;
};

function CountActionButton({
  icon,
  value,
  onClick,
  srLabel,
}: CountActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer inline-flex items-center gap-[4px] rounded-[16px] bg-[#F3F4F6] px-[8px] py-[4px] text-[#3B3435] transition-colors hover:bg-[#E5E7EB] hover:text-[#111928]"
    >
      {icon}
      <span className="text-[12px] font-[400] leading-[16px] text-[#111928]">
        {value}
      </span>
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
  isBookmarked = false,
  onBookmarkClick,
  onUpvoteClick,
  onDownvoteClick,
  onReplyClick,
  replyCount,
  showReplyAction = true,
  showBookmarkAction = true,
  showDivider = true,
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
            icon={<ArrowBigUp size={16} color="#374151" />}
            value={currentUpvoteCount}
            onClick={onUpvoteClick}
            srLabel="Upvote discussion"
          />
          <CountActionButton
            icon={<ArrowBigDown size={16} color="#374151" />}
            value={currentDownvoteCount}
            onClick={onDownvoteClick}
            srLabel="Downvote discussion"
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
