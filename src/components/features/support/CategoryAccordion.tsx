/**
 * CategoryAccordion — Help-tab category → subcategory browser.
 *
 * Ported verbatim from the legacy `experience-ui` component (same markup, class
 * names, and behaviour): a single-column accordion on mobile and a two-column
 * (categories | subcategories) layout on desktop. Selecting a subcategory calls
 * `onSubcategoryClick`, which opens the create-ticket modal.
 */

import type { SupportCategory } from '@/server/api/support/support.types'

type CategoryAccordionProps = {
  expandedItem: string | null
  setExpandedItem: (item: string | null) => void
  /** Called with the category + subcategory *slugs* when a subcategory is picked. */
  onSubcategoryClick: (categorySlug: string, subcategorySlug: string) => void
  categories: Array<SupportCategory>
}

export function CategoryAccordion({
  expandedItem,
  setExpandedItem,
  onSubcategoryClick,
  categories,
}: CategoryAccordionProps) {
  const toggleExpanded = (value: string) => {
    setExpandedItem(expandedItem === value ? null : value)
  }

  return (
    <div className="bg-surface overflow-hidden md:flex md:flex-row">
      {/* Mobile View: Accordion (default) */}
      <div className="md:hidden">
        {categories.map((category, index) => (
          <div key={category.value}>
            <button
              type="button"
              className={`flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-surface-muted ${
                expandedItem === category.value ? 'bg-[#EBF5FF] dark:bg-info-subtle' : ''
              }`}
              onClick={() => toggleExpanded(category.value)}
            >
              <span
                className={`font-poppins text-[12px] font-[500] ${
                  expandedItem === category.value
                    ? 'font-semibold text-foreground'
                    : 'text-foreground'
                }`}
              >
                {category.label}
              </span>
              <svg
                className={`w-4 h-4 text-foreground-subtle transition-transform ${
                  expandedItem === category.value ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {index < categories.length - 1 && (
              <div className="border-b border-border mx-4" />
            )}

            {expandedItem === category.value && (
              <div className="space-y-2 bg-surface-muted px-3 pb-3">
                {category.subcategories.map((sub) => (
                  <button
                    key={sub.value}
                    type="button"
                    className="font-poppins flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left text-[13px] text-foreground transition-colors hover:border-border-strong hover:bg-surface-muted"
                    onClick={() =>
                      onSubcategoryClick(category.value, sub.value)
                    }
                  >
                    <span>{sub.label}</span>
                    <svg
                      className="h-4 w-4 shrink-0 text-foreground-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View: Two-column layout */}
      <div className="hidden md:flex md:w-full">
        {/* Left Column: Categories */}
        <div className="min-h-[480px] w-[32%] min-w-[220px] border-r border-border bg-surface">
          {categories.map((category, index) => (
            <div key={category.value}>
              <button
                type="button"
                className={`font-poppins flex w-full items-center justify-between p-5 text-left text-[14px] transition-colors ${
                  expandedItem === category.value
                    ? 'bg-[#EBF5FF] font-semibold text-foreground dark:bg-info-subtle'
                    : 'font-medium text-foreground hover:bg-surface-muted'
                }`}
                onClick={() => setExpandedItem(category.value)}
              >
                <span>{category.label}</span>
              </button>
              {index < categories.length - 1 && (
                <div className="mx-3 border-b border-border" />
              )}
            </div>
          ))}
        </div>

        {/* Right Column: Subcategories */}
        <div className="box-border min-h-[480px] w-[68%] bg-surface p-5 md:p-6">
          {expandedItem ? (
            <div className="flex h-full flex-col gap-3">
              {(
                categories.find((c) => c.value === expandedItem)
                  ?.subcategories ?? []
              ).map((sub) => (
                <button
                  key={sub.value}
                  type="button"
                  className="font-poppins flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3.5 text-left text-[14px] text-foreground transition-colors hover:border-border-strong hover:bg-surface-muted"
                  onClick={() => onSubcategoryClick(expandedItem, sub.value)}
                >
                  <span>{sub.label}</span>
                  <svg
                    className="h-4 w-4 shrink-0 text-foreground-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center p-8">
              <p className="font-poppins text-sm text-foreground-subtle">
                Select a category to continue
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
