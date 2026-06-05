import type { ReactNode } from 'react'

type PagePlaceholderProps = {
  title: string
  description?: string
  children?: ReactNode
}

/**
 * Generic empty-canvas placeholder for v2 content routes that don't have
 * their real UI yet. Replace per-page as features are built.
 */
export default function PagePlaceholder({
  title,
  description,
  children,
}: PagePlaceholderProps) {
  return (
    <div>
      <h2 className="text-[20px] font-bold leading-7 text-[#111827]">{title}</h2>
      {description ? (
        <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">{description}</p>
      ) : null}
      {children}
    </div>
  )
}
