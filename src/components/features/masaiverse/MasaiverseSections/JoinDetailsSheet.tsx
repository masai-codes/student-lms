import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { ClubType } from "@/server/masaiverse/fetchClubs"
import type { EventType } from "@/server/masaiverse/fetchEvents"

export type JoinableItem =
  | { type: "club"; data: ClubType }
  | { type: "event"; data: EventType }
  | null

type JoinDetailsSheetProps = {
  selectedItem: JoinableItem
  onClose: () => void
}

const formatDateTime = (dateTime?: string | null) => {
  if (!dateTime) return "TBD"
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateTime))
}

export default function JoinDetailsSheet({ selectedItem, onClose }: JoinDetailsSheetProps) {
  return (
    <Sheet open={Boolean(selectedItem)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {selectedItem ? (
          <>
            <SheetHeader className="px-6 pt-8 pb-4">
              <SheetTitle className="text-xl">
                {selectedItem.type === "club" ? selectedItem.data.name : selectedItem.data.title}
              </SheetTitle>
              <SheetDescription>
                {selectedItem.type === "club"
                  ? "Club details and community info"
                  : "Event details and participation info"}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-6 pb-2">
              {selectedItem.type === "club" ? (
                <>
                  <img
                    src={selectedItem.data.image || "/Masaiverse.svg"}
                    alt={selectedItem.data.name}
                    className="h-44 w-full rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm text-[#6B7280]">Domain</p>
                    <p className="text-sm font-medium text-[#111827]">{selectedItem.data.domain || "General"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">About</p>
                    <p className="mt-1 text-sm leading-6 text-[#111827]">
                      {selectedItem.data.meta?.mini_description || "No description available."}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-[#6B7280]">Category</p>
                    <p className="text-sm font-medium capitalize text-[#111827]">
                      {selectedItem.data.category || "event"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Mode</p>
                    <p className="text-sm font-medium capitalize text-[#111827]">
                      {selectedItem.data.mode || "TBD"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Starts</p>
                    <p className="text-sm font-medium text-[#111827]">
                      {formatDateTime(selectedItem.data.startTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Location</p>
                    <p className="text-sm font-medium text-[#111827]">
                      {selectedItem.data.locationTitle || selectedItem.data.platform || "TBD"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Description</p>
                    <p className="mt-1 text-sm leading-6 text-[#111827]">
                      {selectedItem.data.description || "No description available."}
                    </p>
                  </div>
                </>
              )}
            </div>

            <SheetFooter className="px-6 pb-8">
              <Button className="w-full" onClick={onClose}>
                Join {selectedItem.type === "club" ? "Club" : "Event"}
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
