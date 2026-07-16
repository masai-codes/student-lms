interface ComingSoonTabProps {
  tab: string
}

export function ComingSoonTab({ tab }: ComingSoonTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <p className="text-sm text-foreground-subtle">{tab} — coming soon.</p>
    </div>
  )
}
