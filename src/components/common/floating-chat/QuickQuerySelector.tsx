import { CaretRight, Question } from '@phosphor-icons/react'

interface QuickQuerySelectorProps {
  queries: string[]
  onSelect: (query: string) => void
}

export function QuickQuerySelector({ queries, onSelect }: QuickQuerySelectorProps) {
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">


      <div className="flex flex-col gap-[9px]">
        {queries.map((query, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(query)}
            className="group flex shrink-0 items-center gap-[13px] p-[13px_12px] bg-white border border-[#e9e9f3] rounded-[14px] text-left hover:bg-[rgba(75,67,150,0.03)] hover:border-[#4b4396]/30 hover:translate-x-0.5 transition-all duration-150 ease-out"
          >
            <div className="flex items-center justify-center shrink-0 size-[38px] rounded-[11px] bg-[rgba(75,67,150,0.06)] text-[#4b4396]">
              <Question weight="fill" className="size-[19px]" />
            </div>
            <span className="flex-1 block text-[12.5px] font-semibold text-[#15162c] leading-snug">{query}</span>
            <div className="shrink-0 text-[#9496ab] group-hover:text-[#4b4396] transition-colors">
              <CaretRight weight="bold" className="size-4" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
