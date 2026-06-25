import { MagnifyingGlass, CaretRight } from '@phosphor-icons/react'
import type { Category, Item } from './types'

interface ItemSelectorProps {
  categoryObj: Category
  items: Item[]
  onSelect: (itemTitle: string) => void
}

export function ItemSelector({ categoryObj, items, onSelect }: ItemSelectorProps) {
  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center gap-2 bg-[#f1f1f7] rounded-[10px] p-[10px_12px] shrink-0 mb-1">
        <MagnifyingGlass weight="bold" className="size-4 text-[#9496ab] shrink-0" />
        <input 
          type="text" 
          placeholder={`Search ${categoryObj.label.toLowerCase()}s...`}
          className="flex-1 bg-transparent outline-none border-none text-[13.6px] text-[#15162c] placeholder:text-[#9496ab] font-[inherit]"
        />
      </div>
      <div className="flex flex-col">
        {items.map(item => (
          <div
            key={item.title}
            onClick={() => onSelect(item.title)}
            className="flex items-center gap-3 p-[11px_10px] rounded-[10px] cursor-pointer transition-colors hover:bg-[#f0f0fd] mb-[3px] group"
          >
            <div className="flex items-center justify-center shrink-0 size-[34px] rounded-[9px] bg-[#f1f1f7] text-[#62647d] group-hover:bg-[#e3e3fb] group-hover:text-[#4b4396] transition-colors">
              <categoryObj.icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <strong className="block text-[13.6px] font-semibold text-[#15162c] truncate">{item.title}</strong>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-[#62647d] bg-[#f1f1f7] px-2 py-[2.5px] rounded-full group-hover:bg-white transition-colors">{item.meta}</span>
                <span className="text-[11.5px] text-[#9496ab]">{item.date}</span>
              </div>
            </div>
            <div className="shrink-0 text-[#9496ab] group-hover:text-[#4b4396] transition-colors">
              <CaretRight weight="bold" className="size-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
