import { Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { LearnTab } from '../shared/types'

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
    <section className="flex flex-row items-start justify-between gap-4 rounded-lg border bg-card p-4 md:items-center">
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as LearnTab)}>
        <TabsList variant="line">
          <TabsTrigger value="lectures">Lectures</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
      </Tabs>

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

        <Button variant="outline" size="icon" onClick={onOpenFilters} aria-label="Open filters">
          <Filter className="size-4" />
        </Button>
      </div>
    </section>
  )
}
