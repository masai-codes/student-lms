'use client'

type LearnDetailBodyGridProps = {
  mainPlaceholder: string
  asidePlaceholder: string
}

/** 70 / 10-cols main + 30% aside shell; entity pages pass copy for placeholders. */
export function LearnDetailBodyGrid({
  mainPlaceholder,
  asidePlaceholder,
}: LearnDetailBodyGridProps) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-10">
      <div className="min-h-[200px] rounded-lg border border-dashed border-gray-300 bg-gray-50/80 p-4 lg:col-span-7">
        <p className="type-b2-regular text-muted-foreground">{mainPlaceholder}</p>
      </div>
      <div className="min-h-[200px] rounded-lg border border-dashed border-gray-300 bg-gray-50/80 p-4 lg:col-span-3">
        <p className="type-b2-regular text-muted-foreground">{asidePlaceholder}</p>
      </div>
    </section>
  )
}
