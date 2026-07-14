interface FileCardProps {
  title: string
  uploadedOn: string
  onView?: () => void
  onShare?: () => void
  badge?: 'signed' | 'pending'
}

function FileIcon() {
  return (
    <div className="w-12 h-12 flex items-center justify-center rounded-lg shrink-0 bg-info-subtle">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
          stroke="#3F83F8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 2V8H20"
          stroke="#3F83F8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 13H16"
          stroke="#3F83F8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M8 17H16"
          stroke="#3F83F8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M8 9H10"
          stroke="#3F83F8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function FileCard({
  title,
  uploadedOn,
  onView,
  onShare,
  badge,
}: FileCardProps) {
  return (
    <div
      className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3"
      style={{
        boxShadow: '0px 1px 2px rgba(0,0,0,0.08)',
        height: 72,
        flex: 1,
        minWidth: 280,
      }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <FileIcon />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-base leading-6 text-foreground truncate max-w-[160px]">
              {title}
            </span>
            {badge === 'signed' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 bg-success-subtle text-success">
                Signed
              </span>
            )}
            {badge === 'pending' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 bg-danger-subtle text-danger">
                Not Signed
              </span>
            )}
          </div>
          <span className="text-sm text-foreground-muted">{uploadedOn}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer bg-info-subtle text-brand"
            style={{ padding: '10px 16px', height: 40 }}
          >
            Share
          </button>
        )}
        {onView && (
          <button
            onClick={onView}
            className="flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer bg-info-subtle text-brand"
            style={{ padding: '10px 16px', height: 40 }}
          >
            View
          </button>
        )}
      </div>
    </div>
  )
}
