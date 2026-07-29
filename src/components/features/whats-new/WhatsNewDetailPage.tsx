import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { MarkdownContent } from '@/components/shared/markdown-content'
import type { WhatsNewDetail } from '@/server/api/whats-new/getWhatsNewById.service'

interface WhatsNewDetailPageProps {
  detail: WhatsNewDetail
}

export function WhatsNewDetailPage({ detail }: WhatsNewDetailPageProps) {
  const breadcrumbTitle =
    detail.title.length > 30 ? `${detail.title.slice(0, 30)}…` : detail.title

  return (
    <div className="mx-4 mb-6 mt-4 md:mx-8 flex flex-col gap-5">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/"
                className="text-sm text-foreground-muted hover:text-foreground"
              >
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/whats-new"
                search={{ page: 1 }}
                className="text-sm text-foreground-muted hover:text-foreground"
              >
                Whats New
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm text-foreground-muted">
              {breadcrumbTitle}
            </span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title + date */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-foreground leading-snug break-words">
          {detail.title}
        </h1>
        {detail.createdAt ? (
          <p className="text-sm text-foreground-muted">{detail.createdAt}</p>
        ) : null}
      </div>

      {/* Body content card */}
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <MarkdownContent value={detail.body} variant="detail" />
      </div>
    </div>
  )
}
