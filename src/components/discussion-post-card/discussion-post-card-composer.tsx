"use client";

import { SendHorizontal } from "lucide-react";

import { RichTextEditor } from "./rich-text-editor";

type DiscussionPostCardComposerProps = {
  profileImage?: string;
  replyText: string;
  onReplyTextChange: (value: string) => void;
  onReplySubmit?: () => void;
  placeholder?: string;
  showOuterRoundedBorder?: boolean;
};

export function DiscussionPostCardComposer({
  profileImage,
  replyText,
  onReplyTextChange,
  onReplySubmit,
  placeholder = "Write your reply...",
  showOuterRoundedBorder = true,
}: DiscussionPostCardComposerProps) {
  const hasReplyText =
    replyText
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0;
  const isMultilineReply =
    /<br\s*\/?>/i.test(replyText) ||
    /<\/p>\s*<p>/i.test(replyText) ||
    replyText.includes("\n");

  return (
    <div
      className={`flex items-start gap-3 bg-[#F9FAFB] p-[12px] shadow-[0_1px_3px_0_rgba(0,0,0,0.11)] ${
        showOuterRoundedBorder ? "rounded-[12px]" : ""
      }`}
    >
      <img
        src={
          profileImage ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
        }
        alt="Your profile"
        className="mt-1 size-9 shrink-0 self-start rounded-full border border-[#E5E7EB] object-cover"
      />
      <div className="relative min-w-0 flex-1">
        <label className="sr-only" htmlFor="discussion-reply-input">
          Write a reply
        </label>
        <RichTextEditor
          value={replyText}
          onChange={onReplyTextChange}
          placeholder={placeholder}
          showToolbar={false}
          contentClassName={`!min-h-[40px] !max-h-[140px] !overflow-y-auto !bg-white !py-[10px] !pl-[12px] !pr-14 [&_p]:!my-0 ${
            isMultilineReply ? "!rounded-[12px]" : "!rounded-[104px]"
          }`}
        />
        <button
          type="button"
          onClick={onReplySubmit}
          disabled={!hasReplyText}
          className="absolute bottom-[6px] right-[8px] inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-[#EF8833] text-white transition-colors hover:bg-[#DC7A2D] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
        >
          <SendHorizontal size={14} />
          <span className="sr-only">Send reply</span>
        </button>
      </div>
    </div>
  );
}
