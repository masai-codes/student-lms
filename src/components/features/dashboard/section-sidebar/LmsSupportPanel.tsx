export function LmsSupportPanel() {
  return (
    <div className="bg-[#F9FAFB] rounded-[16px] border border-gray-200 overflow-hidden flex items-center gap-0">
      <div className="shrink-0 w-[136px] self-stretch">
        <img
          src="/SupportDashboard.svg"
          alt="LMS Support"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="flex flex-col gap-2 p-4 flex-1 min-w-0">
        <p className="text-base font-bold text-gray-900 leading-snug">LMS Support Session</p>
        <p className="text-sm text-gray-500 leading-snug">
          Join our daily session to get your questions answered
        </p>
        <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-[#FEF9C3] text-sm font-semibold text-[#713F12]">
          Everyday at 6:30 PM
        </span>
      </div>
    </div>
  )
}
