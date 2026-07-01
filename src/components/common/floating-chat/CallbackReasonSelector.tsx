import { CaretRight, Question, CurrencyInr, Books, PhoneCall, Lightning } from '@phosphor-icons/react'

interface CallbackReasonSelectorProps {
  onSelect: (reason: string) => void
}

export function CallbackReasonSelector({ onSelect }: CallbackReasonSelectorProps) {
  const reasons = [
    { id: 'query', label: 'Program Related Query', icon: Question },
    { id: 'fees', label: 'Program Fees', icon: CurrencyInr },
    { id: 'support', label: 'Learning Support', icon: Books }
  ]

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">

      {/* Fast Track Call Box */}
      <div className="mb-4 p-4 rounded-[16px] bg-[#f8f8fc] border border-[#e3e3fb] shadow-sm">
        <div className="flex items-start gap-[14px]">
          <div className="flex items-center justify-center shrink-0 size-[42px] rounded-full bg-[#f0f0fd] text-[#4b4396]">
            <PhoneCall weight="fill" className="size-[22px]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[12.5px] font-extrabold text-[#4338ca] uppercase tracking-[0.03em]">Need quicker resolution?</span>
            </div>
            <p className="text-[12.5px] text-[#4b4396] font-medium leading-[1.4] mb-2">
              Reach out to our support team directly for help.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[30px] inline-flex shrink-0 items-center px-2 bg-[#f0f0fd] rounded-[6px] text-[#4b4396] font-bold text-[11px] border border-[#e3e3fb] whitespace-nowrap">
                Mon-Fri • 12 PM to 8 PM
              </div>
              <div className="h-[30px] inline-flex shrink-0 items-center justify-center gap-1.5 px-2.5 bg-[#4b4396] rounded-[6px] text-white text-[11px] font-bold shadow-sm select-all whitespace-nowrap">
                <PhoneCall weight="fill" className="size-[12px] opacity-90" />
                7669878282
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[12px] font-bold text-[#9496ab] uppercase tracking-wider mb-2 px-1">
        Or request a callback
      </div>

      <div className="flex flex-col gap-[9px]">
        {reasons.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r.label)}
            className="group flex shrink-0 items-center gap-[13px] p-[13px_12px] rounded-[14px] border border-[#e9e9f3] bg-white cursor-pointer transition-all duration-150 ease-out hover:bg-[rgba(75,67,150,0.03)] hover:border-[#4b4396]/30 hover:translate-x-0.5"
          >
            <div className="flex items-center justify-center shrink-0 size-[38px] rounded-[11px] bg-[rgba(75,67,150,0.06)] text-[#4b4396]">
              <r.icon weight="bold" className="size-[19px]" />
            </div>
            <strong className="flex-1 text-left block text-[14.5px] font-bold text-[#15162c] leading-tight mb-0.5">{r.label}</strong>
            <div className="shrink-0 text-[#9496ab] group-hover:text-[#4b4396] transition-colors">
              <CaretRight weight="bold" className="size-4" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
