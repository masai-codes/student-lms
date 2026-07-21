import { layoutMainClasses } from '@/lib/layout'

export function LearnPageDetailError() {
  return (
    <div className={layoutMainClasses}>
      <p className="type-b1-md text-muted-foreground">
        This item isn&apos;t available or you don&apos;t have access.
      </p>
    </div>
  )
}
