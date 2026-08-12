interface PersonCardProps {
  name: string
  role: string
  avatarUrl?: string | null
}

export function PersonCard({ name, role, avatarUrl }: PersonCardProps) {
  return (
    <div
      className="relative flex items-center rounded-[10px] bg-surface"
      style={{ width: 300, height: 72, flexShrink: 0 }}
    >
      <div
        className="absolute"
        style={{ left: 8, top: '50%', transform: 'translateY(-50%)' }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-surface border-[1.5px] border-border">
            <svg
              viewBox="0 0 56 56"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <rect width="56" height="56" fill="var(--muted)" />
              <circle cx="28" cy="21" r="10" fill="var(--foreground-muted)" />
              <path
                d="M6 54c0-12.15 9.85-22 22-22s22 9.85 22 22"
                fill="var(--foreground-muted)"
              />
              <circle
                cx="28"
                cy="28"
                r="27"
                fill="none"
                stroke="var(--foreground-muted)"
                strokeWidth="3.5"
              />
            </svg>
          </div>
        )}
      </div>
      <div
        className="absolute flex flex-col gap-1"
        style={{
          left: 76,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 200,
        }}
      >
        <span className="text-sm font-medium text-foreground leading-[21px]">
          {name}
        </span>
        <span className="text-xs font-medium text-foreground leading-[18px]">
          {role}
        </span>
      </div>
    </div>
  )
}
