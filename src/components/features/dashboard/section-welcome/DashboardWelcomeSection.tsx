interface DashboardWelcomeSectionProps {
  userName: string
}

export function DashboardWelcomeSection({ userName }: DashboardWelcomeSectionProps) {
  const firstName = userName.split(' ')[0] ?? userName

  return (
    <div className="flex flex-col gap-0.5">
      <p className="type-b2 text-gray-500">Welcome</p>
      <h2 className="type-h3 font-bold text-gray-900 flex items-center gap-2">
        {firstName}
        <span role="img" aria-label="Waving hand">👋🏻</span>
      </h2>
    </div>
  )
}
