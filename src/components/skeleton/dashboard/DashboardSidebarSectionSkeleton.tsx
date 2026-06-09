import { Skeleton } from '@/components/ui/skeleton'

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F9FAFB] rounded-[16px] border border-gray-200 p-4 flex flex-col gap-3">
      {children}
    </div>
  )
}

function PanelHeader() {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32 rounded" />
      <Skeleton className="h-4 w-14 rounded" />
    </div>
  )
}

// Matches: rounded-[8px] border border-gray-200 bg-white px-3 py-2.5 flex flex-col gap-1
function AnnouncementCardSkeleton() {
  return (
    <div className="rounded-[8px] border border-gray-200 bg-white px-3 py-2.5 flex flex-col gap-1 shadow-sm">
      <Skeleton className="h-3.5 w-4/5 rounded" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-1/3 rounded" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}

// Matches: rounded-[8px] border border-gray-200 bg-white px-3 py-2.5 flex items-center gap-3
function ProductUpdateCardSkeleton() {
  return (
    <div className="rounded-[8px] border border-gray-200 bg-white px-3 py-2.5 flex items-center gap-3 shadow-sm">
      <Skeleton className="size-5 rounded shrink-0" />
      <Skeleton className="h-3.5 flex-1 rounded" />
      <Skeleton className="size-4 rounded shrink-0" />
    </div>
  )
}

// Matches AnnouncementsPanel: max-h-[144px] with 2 cards and gap-2
function AnnouncementsPanelSkeleton() {
  return (
    <PanelShell>
      <PanelHeader />
      <div className="flex flex-col gap-2">
        <AnnouncementCardSkeleton />
        <AnnouncementCardSkeleton />
      </div>
    </PanelShell>
  )
}

// Matches ProductUpdatesPanel: flex flex-col gap-2 with 3 cards
function ProductUpdatesPanelSkeleton() {
  return (
    <PanelShell>
      <PanelHeader />
      <div className="flex flex-col gap-2">
        <ProductUpdateCardSkeleton />
        <ProductUpdateCardSkeleton />
        <ProductUpdateCardSkeleton />
      </div>
    </PanelShell>
  )
}

// Matches ProgressCard: grid grid-cols-2 gap-3 with inner bg-white rounded-[12px] p-3
function YourProgressPanelSkeleton() {
  return (
    <PanelShell>
      <Skeleton className="h-4 w-28 rounded" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-[12px] border border-gray-200 p-3 flex flex-col gap-2">
            <Skeleton className="size-10 rounded-md" />
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-7 w-2/3 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

// Matches LMS support cards: rounded-[16px] border bg-white flex items-center with w-[120px] image + text block
function LmsSupportPanelSkeleton() {
  return (
    <div className="rounded-[16px] border border-gray-200 bg-white overflow-hidden flex items-center gap-0">
      <Skeleton className="w-[120px] self-stretch shrink-0 rounded-none" />
      <div className="flex flex-col gap-2 px-3 py-4 flex-1 min-w-0">
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-3/5 rounded" />
        <Skeleton className="h-7 w-28 rounded-full mt-1" />
      </div>
    </div>
  )
}

export function DashboardSidebarSectionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <AnnouncementsPanelSkeleton />
      <ProductUpdatesPanelSkeleton />
      <YourProgressPanelSkeleton />
      <LmsSupportPanelSkeleton />
    </div>
  )
}
