import { SendHorizontal } from "lucide-react"

import { RichTextEditor } from "./rich-text-editor"

type DiscussionPostCardComposerProps = {
  profileImage?: string
  replyText: string
  onReplyTextChange: (value: string) => void
  onReplySubmit?: () => void
}

export function DiscussionPostCardComposer({
  profileImage,
  replyText,
  onReplyTextChange,
  onReplySubmit,
}: DiscussionPostCardComposerProps) {
  const hasReplyText = replyText.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0

  return (
    <div className="flex items-start gap-3">
      <img
        src={
          profileImage ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
        }
        alt="Your profile"
        className="mt-1 size-9 rounded-full border border-[#E5E7EB] object-cover"
      />
      <div className="relative min-w-0 flex-1">
      <label className="sr-only" htmlFor="discussion-reply-input">
        Write a reply
      </label>
      <RichTextEditor
        value={replyText}
        onChange={onReplyTextChange}
        placeholder="Write your reply..."
        contentClassName="!pb-14 !pr-16"
      />
      <button
        type="button"
        onClick={onReplySubmit}
        disabled={!hasReplyText}
        className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#EF8833] px-4 py-2 text-[14px] font-[500] text-white transition-colors hover:bg-[#DC7A2D] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
      >
        <SendHorizontal size={16} />
        <span className="sr-only">Send reply</span>
      </button>
      </div>
    </div>
  )
}
