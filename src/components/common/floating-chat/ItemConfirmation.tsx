import { ArrowUpRight, ChatCircle, VideoCamera, Timer, Notepad, UserCheck, Target, Info, PencilSimple, Star } from '@phosphor-icons/react'
import type { Category, Item } from './types'

interface ItemConfirmationProps {
  categoryObj: Category
  itemObj: Item
  onConfirm: () => void
  onDirectQuery?: (query: string) => void
}

export function ItemConfirmation({ categoryObj, itemObj, onConfirm, onDirectQuery }: ItemConfirmationProps) {
  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  // Live lecture logic (hoisted for global component use)
  const isLive = itemObj.type === 'live';
  const startTime = itemObj.startTime ? new Date(itemObj.startTime).getTime() : 0;
  const now = Date.now();
  const diffMins = startTime ? (now - startTime) / (1000 * 60) : 0;

  // Join window: 5 mins before to 20 mins after start time
  const isJoinWindow = isLive && startTime && diffMins >= -5 && diffMins <= 20;

  // Assuming lectures are ~1 hour long. If it's live and less than 60 mins have passed, it's ongoing/upcoming.
  const isOngoingOrUpcoming = Boolean(isLive && startTime && diffMins < 60);

  return (
    <div className="flex flex-col h-full">
      <div className="border-[1.5px] border-[#e3e3fb] rounded-[14px] bg-[#f0f0fd] p-[16px_16px_14px] mb-2.5 flex items-start gap-[13px]">
        <div className="flex items-center justify-center shrink-0 size-[42px] rounded-[11px] bg-[#e3e3fb] text-[#4b4396]">
          <categoryObj.icon weight="fill" className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10.8px] font-bold text-[#4338ca] uppercase tracking-[0.04em] mb-[3px]">
            {categoryObj.label}
          </div>
          <div className="text-[14px] font-bold text-[#15162c] leading-[1.35] mb-1 truncate">
            {itemObj.title}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#62647d] bg-[rgba(255,255,255,0.7)] px-2 py-0.5 rounded-full">{itemObj.meta}</span>
            <span className="text-[11px] text-[#9496ab]">{itemObj.date}</span>
          </div>
        </div>
      </div>

      {categoryObj.id === 'lecture' && (() => {
        // Mock attendance logic for demonstration
        const isAbsent = itemObj.title.includes('007') || itemObj.title.includes('Absent');
        const attendanceStatus = isAbsent ? 'Absent' : 'Present';
        const attendanceColor = isAbsent ? 'text-[#ef4444]' : 'text-[#0E9F6E]';

        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isJoinWindow && (
              <button
                onClick={() => onDirectQuery?.('Unable to join live lecture')}
                className="w-full flex items-center justify-between p-3.5 mb-3 bg-[#fff1f2] border-[1.5px] border-[#fda4af] rounded-[12px] group hover:bg-[#ffe4e6] transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-8 bg-[#f43f5e] text-white rounded-full shrink-0 shadow-sm shadow-[#f43f5e]/20 group-hover:scale-105 transition-transform">
                    <VideoCamera weight="fill" className="size-4" />
                  </div>
                  <div className="text-left flex flex-col">
                    <span className="text-[13.5px] font-bold text-[#be123c] leading-tight mb-0.5">Unable to join live lecture?</span>
                    <span className="text-[11.5px] font-medium text-[#e11d48]">Tap here for assistance</span>
                  </div>
                </div>
                <div className="shrink-0 text-[#f43f5e] group-hover:translate-x-0.5 transition-transform">
                  <ArrowUpRight weight="bold" className="size-4" />
                </div>
              </button>
            )}

            {isOngoingOrUpcoming ? (
              <div className="flex flex-col items-center justify-center p-5 mb-3 bg-[#f8f8fc] border border-[#e9e9f3] rounded-[12px] text-center border-dashed">
                <div className="relative flex h-3 w-3 mb-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f43f5e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e11d48]"></span>
                </div>
                <span className="text-[14px] font-bold text-[#15162c] mb-1">
                  {diffMins < 0 ? 'Lecture starts soon' : 'Lecture is ongoing'}
                </span>
                <span className="text-[12px] text-[#62647d] max-w-[200px] leading-snug">
                  Recording, AI Summary, and Attendance will be available after the session ends.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
                  <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
                    <VideoCamera weight="fill" className="size-[13px] text-[#4b4396]" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wide">Recording</span>
                  </div>
                  <span className="text-[12.5px] font-extrabold text-[#15162c]">Available</span>
                </div>
                <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
                  <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
                    <Timer weight="fill" className="size-[13px] text-[#4b4396]" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wide">Duration</span>
                  </div>
                  <span className="text-[12.5px] font-extrabold text-[#15162c]">1h 45m</span>
                </div>
                <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
                  <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
                    <Notepad weight="fill" className="size-[13px] text-[#4b4396]" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wide">AI Summary</span>
                  </div>
                  <span className="text-[12.5px] font-extrabold text-[#15162c]">Generated</span>
                </div>
                <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
                  <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
                    <UserCheck weight="fill" className={`size-[14px] ${attendanceColor}`} />
                    <span className="text-[10.5px] font-bold uppercase tracking-wide">Attendance</span>
                  </div>
                  <span className={`text-[12.5px] font-extrabold ${attendanceColor}`}>{attendanceStatus}</span>
                </div>
                {isAbsent && !isOngoingOrUpcoming && (
                  <div className="col-span-2 flex items-center gap-2 p-[10px_12px] bg-[#fef2f2] border border-[#fecaca] rounded-[12px] shadow-sm">
                    <Info weight="fill" className="size-[15px] text-[#ef4444] shrink-0" />
                    <span className="text-[12px] font-bold text-[#b91c1c]">Reason: Joined late and did not meet duration criteria</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {categoryObj.id === 'assignment' && (
        <div className="grid grid-cols-2 gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
              <Target weight="fill" className="size-[14px] text-[#4b4396]" />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">Type</span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#15162c]">Practice</span>
          </div>
          <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
              <PencilSimple weight="fill" className="size-[13px] text-[#4b4396]" />
              <span className="text-[10.5px] font-bold uppercase tracking-wide">Status</span>
            </div>
            <span className="text-[12.5px] font-extrabold text-[#0E9F6E]">Submitted</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 p-[10px_12px] bg-[#f0f4ff] border border-[#d6e4ff] rounded-[12px] shadow-sm">
            <Info weight="fill" className="size-[15px] text-[#2952cc] shrink-0" />
            <span className="text-[12px] font-bold text-[#1a3380]">Score will not be considered for final grading</span>
          </div>
        </div>
      )}

      {categoryObj.id === 'evaluation' && (() => {
        let evalStatus = 'Not Attempted'
        let evalScore = '-'
        let evalStatusColor = 'text-[#62647d]'

        if (itemObj.date.includes('Scored')) {
          evalStatus = 'Attempted'
          evalScore = itemObj.date.replace('Scored ', '')
          evalStatusColor = 'text-[#0E9F6E]'
        } else if (itemObj.date === 'Result pending') {
          evalStatus = 'Attempted'
          evalScore = 'Pending'
          evalStatusColor = 'text-[#0E9F6E]'
        } else if (itemObj.date === 'Scheduled') {
          evalStatus = 'Not Attempted'
          evalScore = '-'
          evalStatusColor = 'text-[#62647d]'
        }

        return (
          <div className="grid grid-cols-2 gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
              <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
                <PencilSimple weight="fill" className="size-[13px] text-[#4b4396]" />
                <span className="text-[10.5px] font-bold uppercase tracking-wide">Status</span>
              </div>
              <span className={`text-[12.5px] font-extrabold ${evalStatusColor}`}>{evalStatus}</span>
            </div>
            <div className="flex flex-col p-[11px_12px] bg-white border border-[#e9e9f3] rounded-[12px] shadow-sm">
              <div className="flex items-center gap-1.5 mb-[3px] text-[#62647d]">
                <Star weight="fill" className="size-[13px] text-[#4b4396]" />
                <span className="text-[10.5px] font-bold uppercase tracking-wide">Score</span>
              </div>
              <span className="text-[12.5px] font-extrabold text-[#15162c]">{evalScore}</span>
            </div>
            <div className="col-span-2 flex items-center gap-2 p-[10px_12px] bg-[#f0f4ff] border border-[#d6e4ff] rounded-[12px] shadow-sm">
              <Info weight="fill" className="size-[15px] text-[#2952cc] shrink-0" />
              <span className="text-[12px] font-bold text-[#1a3380]">Score will be considered for final grading</span>
            </div>
          </div>
        )
      })()}
      {!isOngoingOrUpcoming && (
        <>
          <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center justify-center gap-1.5 mb-1.5 p-[9px_14px] rounded-[10px] text-[13px] font-bold text-[#4338ca] bg-white border-[1.5px] border-[#e3e3fb] hover:bg-[#e3e3fb] hover:border-[#4b4396] hover:text-[#4b4396] transition-colors no-underline">
            <categoryObj.icon weight="fill" className="size-[14px] shrink-0" />
            Open {categoryObj.label} to review it
            <ArrowUpRight weight="bold" className="size-[14px] shrink-0 ml-auto" />
          </a>

          <div className="mt-auto shrink-0 pt-4">
            <div className="text-[12.5px] text-[#62647d] leading-[1.5] p-[11px_13px] bg-[#f6f6fb] rounded-[10px] border border-dashed border-[#e9e9f3] mb-3">
              Still need help? <strong className="text-[#15162c]">Raise a ticket below</strong>
            </div>

            <button
              onClick={onConfirm}
              className="flex w-full items-center justify-center gap-2 p-[13px] rounded-[10px] font-bold text-[14px] text-white transition-all hover:-translate-y-[1px] hover:opacity-90 active:scale-[0.98]"
              style={{ background: gradientBg }}
            >
              <ChatCircle className="size-[15px]" weight="fill" />
              Yes, I still need help
            </button>
          </div>
        </>
      )}
    </div>
  )
}
