interface EntityLaunchErrorPanelProps {
  message: string
  onRetry: () => void
  onDismiss: () => void
}

export function EntityLaunchErrorPanel({
  message,
  onRetry,
  onDismiss,
}: EntityLaunchErrorPanelProps) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center"
      data-testid="floating-chat-entity-launch-error"
    >
      <p className="text-[14px] font-bold text-[#15162c]">
        Couldn&apos;t open this item
      </p>
      <p className="max-w-[320px] text-[13px] leading-relaxed text-[#62647d]">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          data-testid="floating-chat-entity-launch-retry"
          className="rounded-[10px] border border-[#e9e9f3] bg-white px-4 py-2 text-[13px] font-bold text-[#15162c] hover:bg-[#f0f0fd]"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={onDismiss}
          data-testid="floating-chat-entity-launch-dismiss"
          className="rounded-[10px] bg-[#4F6BED] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#4359d4]"
        >
          Continue to support
        </button>
      </div>
    </div>
  )
}
