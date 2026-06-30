/**
 * ContextSubcategoryList — the scoped "What can we help you with?" list shown
 * when raising a ticket from a lecture / resource / assignment page.
 *
 * Faithful port of the legacy `SubcategoryTicketModal`: the category is fixed by
 * the page, so the student only picks a subcategory from this flat list. Falls
 * back to a "General" option when the category has no subcategories configured.
 */

import { useQuery } from '@tanstack/react-query'
import { CaretRight } from '@phosphor-icons/react'

import { supportSubcategoriesQuery } from '@/query/support/supportQueries'

type ContextSubcategoryListProps = {
  category: string
  onSelect: (subcategoryValue: string) => void
}

export function ContextSubcategoryList({ category, onSelect }: ContextSubcategoryListProps) {
  const { data, isLoading } = useQuery(supportSubcategoriesQuery(category))
  const subcategories = data?.subcategories ?? []

  return (
    <div className="overflow-y-auto p-5">
      <p className="mb-3 font-poppins text-[12px] text-gray-500">What can we help you with?</p>

      {isLoading && (
        <div className="py-6 font-poppins text-[14px] text-gray-500">Loading subcategories…</div>
      )}

      {!isLoading && subcategories.length === 0 && (
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-[8px] border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50"
          onClick={() => onSelect('General')}
        >
          <span className="font-poppins text-[14px] font-medium capitalize text-gray-800">
            General
          </span>
          <CaretRight className="size-5 text-gray-400" />
        </button>
      )}

      {!isLoading &&
        subcategories.map((sub) => (
          <button
            key={sub.value}
            type="button"
            className="mb-3 flex w-full items-center justify-between rounded-[8px] border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50"
            onClick={() => onSelect(sub.value)}
          >
            <span className="font-poppins text-[14px] font-medium capitalize text-gray-800">
              {sub.label}
            </span>
            <CaretRight className="size-5 text-gray-400" />
          </button>
        ))}
    </div>
  )
}
