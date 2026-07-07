import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import type { MasaiBreadcrumbRenderLinkProps } from '@/components/ui/masai-breadcrumb'
import { MasaiBreadcrumb } from '@/components/ui/masai-breadcrumb'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

function renderSpaLink({ href, className, children }: MasaiBreadcrumbRenderLinkProps) {
  return (
    <Link
      to={href}
      className={className}
      onClick={() =>
        pushLearnEvent('l_learn_breadcrumb_click', {
          target: href === '/learn' ? 'learn' : 'dashboard',
        })
      }
    >
      {children}
    </Link>
  )
}

type LearningDetailMasaiBreadcrumbProps = {
  currentLabel: ReactNode
}

export function LearningDetailMasaiBreadcrumb({
  currentLabel,
}: LearningDetailMasaiBreadcrumbProps) {
  return (
    <MasaiBreadcrumb
      renderLink={renderSpaLink}
      className="mb-6"
      items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Learn', href: '/learn' },
        { label: currentLabel },
      ]}
    />
  )
}
