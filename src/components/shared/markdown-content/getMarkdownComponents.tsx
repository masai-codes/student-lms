import type { ReactNode } from 'react'
import type { Components } from 'react-markdown'

export type MarkdownContentVariant = 'card' | 'detail'

function externalLinkProps() {
  return { target: '_blank' as const, rel: 'noopener noreferrer' }
}

function createDetailComponents(): Components {
  return {
    p: ({ children }: { children?: ReactNode }) => (
      <p className="mb-3 last:mb-0 text-gray-700">{children}</p>
    ),
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => (
      <li className="text-gray-700">{children}</li>
    ),
    strong: ({ children }: { children?: ReactNode }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    a: ({ children, href }: { children?: ReactNode; href?: string }) => (
      <a
        href={href}
        className="text-primary-500 underline-offset-2 hover:underline"
        {...externalLinkProps()}
      >
        {children}
      </a>
    ),
  }
}

function createCardComponents(): Components {
  return {
    h1: ({ node, ...props }) => (
      <h1 className="mt-6 mb-3 text-[28px] leading-[34px] font-semibold text-gray-900" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="mt-6 mb-3 text-[24px] leading-[30px] font-semibold text-gray-900" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="mt-5 mb-2 text-[38px] leading-[46px] font-semibold text-gray-900" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="mt-4 mb-2 text-[18px] leading-[24px] font-semibold text-gray-900" {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className="mt-4 mb-2 text-[16px] leading-[22px] font-semibold text-gray-900" {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className="mt-3 mb-2 text-[14px] leading-[20px] font-semibold text-gray-900" {...props} />
    ),
    hr: ({ node, ...props }) => <hr className="my-4 border-0 border-t border-gray-300" {...props} />,
    a: ({ node, ...props }) => <a {...props} {...externalLinkProps()} />,
  }
}

export function getMarkdownComponents(variant: MarkdownContentVariant): Components {
  if (variant === 'detail') {
    return createDetailComponents()
  }

  return createCardComponents()
}
