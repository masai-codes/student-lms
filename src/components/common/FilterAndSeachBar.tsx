import { useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { routeApiMap } from "@/utils/routerApiMap"

type FilterAndSearchBarProps = {
  referer: string
}


const filterOptions: Record<string, Array<string>> = {
  Modules: ["Module 1", "Module 2", "Module 3", "Module 4", "Module 5"],
  Category: ["Category 1", "Category 2", "Category 3"],
  Type: ["Lecture", "Assignment", "Quiz"],
  "Progress Status": ["Not Started", "In Progress", "Completed"],
  "Attendance Status": ["All", "Absent", "Present"],
  Date: ["Today", "This Week", "This Month"],
  Instructor: ["Instructor 1", "Instructor 2", "Instructor 3"],
}



export default function FilterAndSearchBar({ referer }: FilterAndSearchBarProps) {


const routeApi = routeApiMap[referer as keyof typeof routeApiMap]

  console.log(routeApi,"😩")

    const navigate = routeApi.useNavigate()

  const [activeTab, setActiveTab] = useState("Modules")

  return (
    <div className="flex items-center gap-3">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${referer.split('_')[0]}`}
          // defaultValue={search.q ?? ""}
          defaultValue={""}
          className="pl-9"
          onChange={(e) => {
            navigate({
              search: (prev) => ({
                ...prev,
                q: e.target.value || undefined,
                page: 1, // reset pagination on new search
              }),
              replace: true,
            })
          }}

        />
      </div>

      {/* Filters Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-[400px] sm:w-[420px] p-0">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
          </SheetHeader>

          {/* Body */}
          <div className="flex h-full">
            {/* Left menu */}
            <div className="w-40 border-r p-4 space-y-4 text-sm font-medium text-muted-foreground">
              {Object.keys(filterOptions).map((key) => (
                <p
                  key={key}
                  className={`cursor-pointer ${
                    activeTab === key ? "text-primary font-semibold" : ""
                  }`}
                  onClick={() => setActiveTab(key)}
                >
                  {key}
                </p>
              ))}
            </div>

            {/* Right content */}
            <div className="flex-1 p-4 space-y-4">
              <Input placeholder={`Search ${activeTab.toLowerCase()}`} />

              {filterOptions[activeTab].map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-primary" />
                  {item}
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="border-t px-6 py-4 flex justify-between">
            <Button variant="ghost">Clear Filters</Button>
            <Button>Apply</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
