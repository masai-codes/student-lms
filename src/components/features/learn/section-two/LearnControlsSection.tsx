import { Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MasaiTab } from '@/components/ui/masai-tab'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LearnTab } from '../shared/types'

const LEARN_TAB_ITEMS: ReadonlyArray<{ value: LearnTab; label: string }> = [
  { value: 'lectures', label: 'Lectures' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'resources', label: 'Resources' },
]

interface LearnControlsSectionProps {
  activeTab: LearnTab
  onTabChange: (tab: LearnTab) => void
  searchValue: string
  onSearchChange: (value: string) => void
  selectedModule: string
  modules: string[]
  onModuleChange: (module: string) => void
  onOpenFilters: () => void
}

export function LearnControlsSection({
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  selectedModule,
  modules,
  onModuleChange,
  onOpenFilters,
}: LearnControlsSectionProps) {
  return (
    <section className="py-5 flex flex-row items-start justify-between gap-4 md:items-center">
      <div
        role="tablist"
        aria-label="Learning content type"
        className="flex flex-wrap items-center gap-4"
      >
        {LEARN_TAB_ITEMS.map((tab) => (
          <MasaiTab
            key={tab.value}
            label={tab.label}
            selected={activeTab === tab.value}
            onClick={() => onTabChange(tab.value)}
          />
        ))}
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        <div className="relative w-[220px]">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search"
            className="pl-9"
          />
        </div>

        <Select value={selectedModule} onValueChange={onModuleChange}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Select module" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((module) => (
              <SelectItem key={module} value={module}>
                {module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={onOpenFilters}
          aria-label="Open filters"
        >
          <Filter className="size-4" />
        </Button>
      </div>
    </section>
  )
}
