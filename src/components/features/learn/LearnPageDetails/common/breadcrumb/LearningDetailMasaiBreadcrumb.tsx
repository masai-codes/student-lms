import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import type { MasaiBreadcrumbRenderLinkProps } from '@/components/ui/masai-breadcrumb'
import { MasaiBreadcrumb } from '@/components/ui/masai-breadcrumb'

function renderSpaLink({ href, className, children }: MasaiBreadcrumbRenderLinkProps) {
  return (
    <Link to={href} className={className}>
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
