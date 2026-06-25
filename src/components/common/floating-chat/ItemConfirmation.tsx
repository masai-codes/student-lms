import { ArrowUpRight, ChatCircle } from '@phosphor-icons/react'
import type { Category, Item } from './types'

interface ItemConfirmationProps {
  categoryObj: Category
  itemObj: Item
  onConfirm: () => void
}

export function ItemConfirmation({ categoryObj, itemObj, onConfirm }: ItemConfirmationProps) {
  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

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

      <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center justify-center gap-1.5 mb-1.5 p-[9px_14px] rounded-[10px] text-[13px] font-bold text-[#4338ca] bg-white border-[1.5px] border-[#e3e3fb] hover:bg-[#e3e3fb] hover:border-[#4b4396] hover:text-[#4b4396] transition-colors no-underline">
        <categoryObj.icon weight="fill" className="size-[14px] shrink-0" />
        Open {categoryObj.label} to review it
        <ArrowUpRight weight="bold" className="size-[14px] shrink-0 ml-auto" />
      </a>

      <div className="text-[12.5px] text-[#62647d] leading-[1.5] p-[11px_13px] bg-[#f6f6fb] rounded-[10px] border border-dashed border-[#e9e9f3] mb-3">
        Still have a doubt after checking? <strong className="text-[#15162c]">Raise a ticket below</strong>
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
  )
}
