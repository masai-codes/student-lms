"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  createEmptyLearnModalFilters,
  type LearnModalFiltersState,
  type LearnPriority,
} from "../../shared/types";

import { Button } from "@/components/ui/button";
import { MasaiCheckbox } from "@/components/ui/masai-checkbox";
import { MasaiDateSelection } from "@/components/ui/masai-date-selection";
import { MasaiInput } from "@/components/ui/masai-input";
import { MasaiRadioGroup } from "@/components/ui/masai-radio-group";

const PRIORITY_ANY_VALUE = "any";

export type FilterNavKey =
  | "module"
  | "category"
  | "type"
  | "date"
  | "priority"
  | "instructor";

type NavItem = { key: FilterNavKey; label: string };

const NAV_ITEMS: Array<NavItem> = [
  { key: "module", label: "Module" },
  { key: "category", label: "Category" },
  { key: "type", label: "Type" },
  { key: "date", label: "Date" },
  { key: "priority", label: "Priority" },
  { key: "instructor", label: "Instructor" },
];

function toggleString(values: Array<string>, value: string): Array<string> {
  if (values.includes(value)) return values.filter((item) => item !== value);
  return [...values, value];
}

export interface LearnFiltersPanelProps {
  filtersOpen: boolean;
  moduleOptions: Array<string>;
  categoryOptions: Array<string>;
  typeOptions: Array<string>;
  instructorOptions: Array<string>;
  selectedFilters: LearnModalFiltersState;
  onApply: (next: LearnModalFiltersState) => void;
  onRequestClose: () => void;
}

export function LearnFiltersPanel({
  filtersOpen,
  moduleOptions,
  categoryOptions,
  typeOptions,
  instructorOptions,
  selectedFilters,
  onApply,
  onRequestClose,
}: LearnFiltersPanelProps) {
  const [draft, setDraft] = useState<LearnModalFiltersState>(selectedFilters);
  const [activeNav, setActiveNav] = useState<FilterNavKey>("module");
  const [listSearch, setListSearch] = useState("");
  const prevFiltersOpen = useRef(false);

  useEffect(() => {
    if (filtersOpen && !prevFiltersOpen.current) {
      setDraft(structuredClone(selectedFilters));
      setListSearch("");
      setActiveNav("module");
    }
    prevFiltersOpen.current = filtersOpen;
  }, [filtersOpen, selectedFilters]);

  useEffect(() => {
    setListSearch("");
  }, [activeNav]);

  const activeNavLabel = useMemo(
    () => NAV_ITEMS.find((n) => n.key === activeNav)?.label ?? "",
    [activeNav],
  );

  const searchPlaceholder = useMemo(() => {
    switch (activeNav) {
      case "module":
        return "Search module";
      case "category":
        return "Search category";
      case "type":
        return "Search type";
      case "instructor":
        return "Search instructor";
      default:
        return "Search";
    }
  }, [activeNav]);

  const priorityRadioValue =
    draft.priorities.length === 0
      ? PRIORITY_ANY_VALUE
      : (draft.priorities[0] ?? PRIORITY_ANY_VALUE);

  const filteredOptions = useMemo(() => {
    const raw =
      activeNav === "module"
        ? moduleOptions
        : activeNav === "category"
          ? categoryOptions
          : activeNav === "type"
            ? typeOptions
            : activeNav === "instructor"
              ? instructorOptions
              : [];

    const q = listSearch.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((option) => option.toLowerCase().includes(q));
  }, [
    activeNav,
    categoryOptions,
    instructorOptions,
    listSearch,
    moduleOptions,
    typeOptions,
  ]);

  const showListSearch =
    activeNav === "module" ||
    activeNav === "category" ||
    activeNav === "type" ||
    activeNav === "instructor";

  return (
    <div className="-m-4 flex min-h-[min(560px,calc(100svh-10rem))] flex-col">
      <div className="flex min-h-0 flex-1">
        <nav
          className="flex w-[148px] shrink-0 flex-col gap-1 border-r border-slate-200 py-4 pl-4 pr-2"
          aria-label="Filter categories"
        >
          {NAV_ITEMS.map(({ key, label }) => {
            const active = activeNav === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveNav(key)}
                className="flex items-center justify-between gap-2 rounded-lg py-2 text-left text-sm transition-colors hover:bg-slate-50"
              >
                <span
                  className={active ? "font-medium" : "text-slate-800"}
                  style={active ? { color: "#6962AC" } : undefined}
                >
                  {label}
                </span>
                {active ? (
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "#6962AC" }}
                    aria-hidden
                  />
                ) : (
                  <span className="size-1.5 shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900">{activeNavLabel}</h3>

            {showListSearch ? (
              <MasaiInput
                type="search"
                value={listSearch}
                onChange={(event) => setListSearch(event.target.value)}
                placeholder={searchPlaceholder}
                iconLeft={<Search className="size-4 shrink-0" strokeWidth={2} />}
                className="w-full max-w-none"
              />
            ) : null}

            {activeNav === "module" ? (
              <CheckboxColumn
                options={filteredOptions}
                selected={draft.modules}
                onToggle={(option) =>
                  setDraft((prev) => ({
                    ...prev,
                    modules: toggleString(prev.modules, option),
                  }))
                }
              />
            ) : null}

            {activeNav === "category" ? (
              <CheckboxColumn
                options={filteredOptions}
                selected={draft.categories}
                onToggle={(option) =>
                  setDraft((prev) => ({
                    ...prev,
                    categories: toggleString(prev.categories, option),
                  }))
                }
              />
            ) : null}

            {activeNav === "type" ? (
              <CheckboxColumn
                options={filteredOptions}
                selected={draft.types}
                onToggle={(option) =>
                  setDraft((prev) => ({
                    ...prev,
                    types: toggleString(prev.types, option),
                  }))
                }
              />
            ) : null}

            {activeNav === "instructor" ? (
              <CheckboxColumn
                options={filteredOptions}
                selected={draft.instructors}
                onToggle={(option) =>
                  setDraft((prev) => ({
                    ...prev,
                    instructors: toggleString(prev.instructors, option),
                  }))
                }
              />
            ) : null}

            {activeNav === "priority" ? (
              <MasaiRadioGroup
                value={priorityRadioValue}
                onValueChange={(value) => {
                  if (value === PRIORITY_ANY_VALUE) {
                    setDraft((prev) => ({ ...prev, priorities: [] }));
                    return;
                  }
                  setDraft((prev) => ({
                    ...prev,
                    priorities: [value as LearnPriority],
                  }));
                }}
                options={[
                  { value: PRIORITY_ANY_VALUE, label: "Any" },
                  { value: "recommended", label: "Recommended" },
                  { value: "mandatory", label: "Mandatory" },
                ]}
              />
            ) : null}

            {activeNav === "date" ? (
              <div className="space-y-4">
                <p className="type-b2-regular text-gray-600">
                  Filter by lecture or resource schedule dates. Items without a scheduled
                  date are hidden when either bound is set.
                </p>
                <MasaiDateSelection
                  label="Start date"
                  value={draft.scheduleStartDate ?? ""}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      scheduleStartDate: event.target.value || null,
                    }))
                  }
                />
                <MasaiDateSelection
                  label="End date"
                  value={draft.scheduleEndDate ?? ""}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      scheduleEndDate: event.target.value || null,
                    }))
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          className="text-slate-700"
          onClick={() => setDraft(createEmptyLearnModalFilters())}
        >
          Clear filters
        </Button>
        <Button
          type="button"
          onClick={() => {
            onApply(draft);
            onRequestClose();
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

function CheckboxColumn({
  options,
  selected,
  onToggle,
}: {
  options: Array<string>
  selected: Array<string>
  onToggle: (value: string) => void
}) {
  return (
    <ul className="flex flex-col gap-3 pt-1">
      {options.map((option) => (
        <li key={option}>
          <MasaiCheckbox
            label={option}
            isSelected={selected.includes(option)}
            onSelect={() => onToggle(option)}
          />
        </li>
      ))}
      {options.length === 0 ? (
        <li className="text-sm text-slate-500">No matches.</li>
      ) : null}
    </ul>
  )
}
