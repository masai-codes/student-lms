interface DashboardWelcomeSectionProps {
  userName: string
}

export function DashboardWelcomeSection({ userName }: DashboardWelcomeSectionProps) {
  const displayName = userName.length > 20 ? `${userName.slice(0, 20)}…` : userName

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[24px] font-normal leading-5 text-[#544D4F]">Welcome</p>
      <h2 className="text-[28px] font-semibold leading-7 text-[#21191B] flex items-center gap-2">
        {displayName}
        <span role="img" aria-label="Waving hand">👋🏻</span>
      </h2>
    </div>
  )
}
