import { CaretRight } from '@phosphor-icons/react'
import type { Category } from './types'

interface CategorySelectorProps {
  categories: Category[]
  onSelect: (categoryId: string) => void
}

export function CategorySelector({ categories, onSelect }: CategorySelectorProps) {
  return (
    <>
      {categories.map(cat => (
        <div
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="group flex shrink-0 items-center gap-[13px] p-[13px_12px] rounded-[14px] border border-[#e9e9f3] bg-white cursor-pointer transition-all duration-150 ease-out hover:bg-[rgba(75,67,150,0.03)] hover:border-[#4b4396]/30 hover:translate-x-0.5"
        >
          <div className="flex items-center justify-center shrink-0 size-[38px] rounded-[11px] bg-[rgba(75,67,150,0.06)] text-[#4b4396]">
            <cat.icon className="size-[19px]" />
          </div>
          <div className="flex-1 min-w-0">
            <strong className="block text-[14.5px] font-bold text-[#15162c] leading-tight mb-0.5">{cat.label}</strong>
            <small className="block text-[12.3px] text-[#9496ab] leading-tight">{cat.desc}</small>
          </div>
          <div className="shrink-0 text-[#9496ab] group-hover:text-[#4b4396] transition-colors">
            <CaretRight weight="bold" className="size-4" />
          </div>
        </div>
      ))}
    </>
  )
}
