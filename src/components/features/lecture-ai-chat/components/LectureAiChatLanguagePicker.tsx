'use client'

import { Check, ChevronDown, Globe } from 'lucide-react'

import {
  AI_LECTURE_CHAT_LANGUAGES,
  AI_LECTURE_CHAT_LANGUAGE_NATIVE_LABELS,
} from '../languages'
import type {AiLectureChatLanguage} from '../languages';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type LectureAiChatLanguagePickerProps = {
  value: AiLectureChatLanguage
  onChange: (language: AiLectureChatLanguage) => void
  disabled?: boolean
}

/**
 * Compact reply-language selector shown in the composer's action row. Renders a
 * pill trigger (globe icon + English name) and a scrollable menu of
 * every language
 * in {@link AI_LECTURE_CHAT_LANGUAGES}, each showing its native script.
 */
export function LectureAiChatLanguagePicker({
  value,
  onChange,
  disabled = false,
}: LectureAiChatLanguagePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label={`Reply language: ${value}`}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-full border border-input bg-background px-2.5 text-xs font-medium text-foreground shadow-none outline-none transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent',
        )}
      >
        <Globe className="size-3.5 text-muted-foreground" aria-hidden />
        <span className="max-w-24 truncate">{value}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="max-h-64 w-52 overflow-y-auto"
      >
        {AI_LECTURE_CHAT_LANGUAGES.map((language) => {
          const isSelected = language === value
          return (
            <DropdownMenuItem
              key={language}
              onSelect={() => onChange(language)}
              className="justify-between gap-3"
            >
              <span className="flex flex-col">
                <span className="text-sm text-foreground">
                  {AI_LECTURE_CHAT_LANGUAGE_NATIVE_LABELS[language]}
                </span>
                {language !==
                AI_LECTURE_CHAT_LANGUAGE_NATIVE_LABELS[language] ? (
                  <span className="text-xs text-muted-foreground">
                    {language}
                  </span>
                ) : null}
              </span>
              <Check
                className={cn(
                  'size-4 shrink-0 text-primary',
                  isSelected ? 'opacity-100' : 'opacity-0',
                )}
              />
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
