import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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
              <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
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
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Whats New
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm text-gray-500">{breadcrumbTitle}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title + date */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-gray-900 leading-snug break-words">
          {detail.title}
        </h1>
        {detail.createdAt ? (
          <p className="text-sm text-gray-500">{detail.createdAt}</p>
        ) : null}
      </div>

      {/* Body content card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
        <div
          className="prose prose-sm md:prose-base max-w-none text-gray-800 leading-relaxed
            prose-a:text-blue-600 prose-a:underline
            prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: detail.body }}
        />
      </div>

    </div>
  )
}
