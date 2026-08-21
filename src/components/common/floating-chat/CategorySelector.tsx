import { CaretRight, PhoneCall } from '@phosphor-icons/react'
import type { Category } from './types'

interface CategorySelectorProps {
  categories: Category[]
  onSelect: (categoryId: string) => void
  onRequestCallback?: () => void
}

export function CategorySelector({
  categories,
  onSelect,
  onRequestCallback,
}: CategorySelectorProps) {
  return (
    <div className="flex flex-col gap-[9px]">
      {categories.map((cat) => (
        <div
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="group flex shrink-0 items-center gap-[13px] p-[13px_12px] rounded-[14px] border border-[#e9e9f3] dark:border-border bg-surface cursor-pointer transition-all duration-150 ease-out hover:bg-[rgba(75,67,150,0.03)] dark:hover:bg-brand/10 hover:border-[#4b4396]/30 dark:hover:border-brand/40 hover:translate-x-0.5"
        >
          <div className="flex items-center justify-center shrink-0 size-[38px] rounded-[11px] bg-[rgba(75,67,150,0.06)] dark:bg-brand/15 text-[#4b4396] dark:text-brand">
            <cat.icon className="size-[19px]" />
          </div>
          <div className="flex-1 min-w-0">
            <strong className="block text-[14.5px] font-bold text-[#15162c] dark:text-foreground leading-tight mb-0.5">
              {cat.label}
            </strong>
            <small className="block text-[12.3px] text-[#9496ab] dark:text-foreground-subtle leading-tight">
              {cat.desc}
            </small>
          </div>
          <div className="shrink-0 text-[#9496ab] dark:text-foreground-subtle group-hover:text-[#4b4396] dark:group-hover:text-brand transition-colors">
            <CaretRight weight="bold" className="size-4" />
          </div>
        </div>
      ))}

      {onRequestCallback && (
        <div
          onClick={onRequestCallback}
          className="group flex shrink-0 items-center gap-[13px] p-[14px_12px] mt-1 rounded-[14px] border-[1.5px] border-dashed border-[#4b4396]/30 dark:border-brand/40 bg-[#f8f8fc] dark:bg-brand/10 cursor-pointer transition-all duration-150 ease-out hover:bg-[rgba(75,67,150,0.05)] dark:hover:bg-brand/15 hover:border-[#4b4396]/60 dark:hover:border-brand/60 hover:translate-y-[-1px] shadow-sm"
        >
          <div className="flex items-center justify-center shrink-0 size-[38px] rounded-full bg-gradient-to-br from-[#4b4396] to-[#6962ac] text-white shadow-md dark:bg-none dark:bg-brand dark:text-brand-foreground">
            <PhoneCall weight="fill" className="size-[18px]" />
          </div>
          <div className="flex-1 min-w-0">
            <strong className="block text-[14.5px] font-bold text-[#4b4396] dark:text-brand leading-tight mb-0.5">
              Request a Callback
            </strong>
            <small className="block text-[12.3px] text-[#62647d] dark:text-foreground-muted leading-tight">
              Speak directly with our support team
            </small>
          </div>
          <div className="shrink-0 text-[#4b4396] dark:text-brand opacity-70 group-hover:opacity-100 transition-opacity">
            <CaretRight weight="bold" className="size-4" />
          </div>
        </div>
      )}
    </div>
  )
}
