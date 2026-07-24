import {
  CaretRight,
  Question,
  CurrencyInr,
  Books,
  PhoneCall,
  type Icon,
} from '@phosphor-icons/react'

interface CallbackReasonSelectorProps {
  reasons: Array<string>
  contact?: { text: string | null; phone: string | null } | null
  onSelect: (reason: string) => void
}

function reasonIcon(value: string): Icon {
  const normalized = value.toLowerCase()
  if (normalized.includes('fee') || normalized.includes('kit') || normalized.includes('₹')) {
    return CurrencyInr
  }
  if (normalized.includes('learn') || normalized.includes('support')) {
    return Books
  }
  return Question
}

export function CallbackReasonSelector({
  reasons,
  contact,
  onSelect,
}: CallbackReasonSelectorProps) {
  const showContact = Boolean(contact?.text || contact?.phone)

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
      {showContact && (
        <div className="mb-4 p-4 rounded-[16px] bg-[#f8f8fc] border border-[#e3e3fb] shadow-sm">
          <div className="flex items-start gap-[14px]">
            <div className="flex items-center justify-center shrink-0 size-[42px] rounded-full bg-[#f0f0fd] text-[#4b4396]">
              <PhoneCall weight="fill" className="size-[22px]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[12.5px] font-extrabold text-[#4338ca] uppercase tracking-[0.03em]">
                  Need quicker resolution?
                </span>
              </div>
              <p className="text-[12.5px] text-[#4b4396] font-medium leading-[1.4] mb-2">
                Reach out to our support team directly for help.
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {contact?.text && (
                  <div className="h-[30px] inline-flex shrink-0 items-center px-2 bg-[#f0f0fd] rounded-[6px] text-[#4b4396] font-bold text-[11px] border border-[#e3e3fb] whitespace-nowrap">
                    {contact.text}
                  </div>
                )}
                {contact?.phone && (
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    className="h-[30px] inline-flex shrink-0 items-center justify-center gap-1.5 px-2.5 bg-[#4b4396] rounded-[6px] text-white text-[11px] font-bold shadow-sm select-all whitespace-nowrap hover:opacity-90 transition-opacity"
                  >
                    <PhoneCall weight="fill" className="size-[12px] opacity-90" />
                    {contact.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-[12px] font-bold text-[#9496ab] uppercase tracking-wider mb-2 px-1">
        Or request a callback
      </div>

      {reasons.length === 0 ? (
        <p className="px-1 text-[13px] text-[#62647d]">No callback reasons are available right now.</p>
      ) : (
        <div className="flex flex-col gap-[9px]">
          {reasons.map((reason) => {
            const IconComponent = reasonIcon(reason)
            return (
              <button
                key={reason}
                type="button"
                onClick={() => onSelect(reason)}
                className="group flex shrink-0 items-center gap-[13px] p-[13px_12px] rounded-[14px] border border-[#e9e9f3] bg-white text-left cursor-pointer transition-all duration-150 ease-out hover:bg-[rgba(75,67,150,0.03)] hover:border-[#4b4396]/30 hover:translate-x-0.5"
              >
                <div className="flex items-center justify-center shrink-0 size-[38px] rounded-[11px] bg-[rgba(75,67,150,0.06)] text-[#4b4396]">
                  <IconComponent weight="bold" className="size-[19px]" />
                </div>
                <span className="flex-1 block text-[12.5px] font-semibold text-[#15162c] leading-snug">
                  {reason}
                </span>
                <div className="shrink-0 text-[#9496ab] group-hover:text-[#4b4396] transition-colors">
                  <CaretRight weight="bold" className="size-4" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
