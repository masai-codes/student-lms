'use client'

import * as React from 'react'
import { Questionnaire as QuestionnairePrimitive } from '@shadcn/react/questionnaire'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

function Questionnaire({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return (
    <QuestionnairePrimitive.Root
      data-slot="questionnaire"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

function QuestionnaireProgress({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  return (
    <QuestionnairePrimitive.Progress
      data-slot="questionnaire-progress"
      className={cn('text-xs font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}

function QuestionnaireItem({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return (
    <QuestionnairePrimitive.Item
      data-slot="questionnaire-item"
      className={cn('m-0 flex flex-col gap-3 border-0 p-0', className)}
      {...props}
    />
  )
}

function QuestionnaireTitle({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-slot="questionnaire-title"
      className={cn('p-0 text-sm font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function QuestionnaireDescription({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description
      data-slot="questionnaire-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

function QuestionnaireChoices({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      data-slot="questionnaire-choices"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function QuestionnaireChoiceInput({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.ChoiceInput>) {
  return (
    <QuestionnairePrimitive.ChoiceInput
      data-slot="questionnaire-choice-input"
      className={cn('sr-only', className)}
      {...props}
    />
  )
}

function QuestionnaireChoiceLabel({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.ChoiceLabel>) {
  return (
    <QuestionnairePrimitive.ChoiceLabel
      data-slot="questionnaire-choice-label"
      className={cn('flex-1 text-sm', className)}
      {...props}
    />
  )
}

function QuestionnaireChoice({
  className,
  children,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice
      data-slot="questionnaire-choice"
      className={cn(
        'group flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent',
        'data-[checked]:border-primary data-[checked]:bg-primary/5',
        className,
      )}
      {...props}
    >
      <QuestionnaireChoiceInput />
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border group-data-[checked]:border-primary"
      >
        <span className="hidden size-2 rounded-full bg-primary group-data-[checked]:block" />
      </span>
      <QuestionnaireChoiceLabel>{children}</QuestionnaireChoiceLabel>
    </QuestionnairePrimitive.Choice>
  )
}

function QuestionnaireInput({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Input>) {
  return (
    <QuestionnairePrimitive.Input
      data-slot="questionnaire-input"
      className={cn(
        'h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  )
}

function QuestionnaireError({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return (
    <QuestionnairePrimitive.Error
      data-slot="questionnaire-error"
      className={cn('text-xs font-medium text-destructive', className)}
      {...props}
    />
  )
}

function QuestionnaireActions({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn('flex items-center justify-between gap-2', className)}
      {...props}
    />
  )
}

function QuestionnairePrevious({
  className,
  children,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous>) {
  return (
    <QuestionnairePrimitive.Previous
      data-slot="questionnaire-previous"
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <ChevronLeft className="size-3.5" />
          Previous
        </>
      )}
    </QuestionnairePrimitive.Previous>
  )
}

function QuestionnaireSkip({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip>) {
  return (
    <QuestionnairePrimitive.Skip
      data-slot="questionnaire-skip"
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        className,
      )}
      {...props}
    />
  )
}

function QuestionnaireNext({
  className,
  children,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next>) {
  return (
    <QuestionnairePrimitive.Next
      data-slot="questionnaire-next"
      className={cn(
        buttonVariants({ variant: 'default', size: 'sm' }),
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          Next
          <ChevronRight className="size-3.5" />
        </>
      )}
    </QuestionnairePrimitive.Next>
  )
}

function QuestionnaireSubmit({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit>) {
  return (
    <QuestionnairePrimitive.Submit
      data-slot="questionnaire-submit"
      className={cn(
        buttonVariants({ variant: 'default', size: 'sm' }),
        className,
      )}
      {...props}
    />
  )
}

export {
  Questionnaire,
  QuestionnaireProgress,
  QuestionnaireItem,
  QuestionnaireTitle,
  QuestionnaireDescription,
  QuestionnaireChoices,
  QuestionnaireChoice,
  QuestionnaireChoiceInput,
  QuestionnaireChoiceLabel,
  QuestionnaireInput,
  QuestionnaireError,
  QuestionnaireActions,
  QuestionnairePrevious,
  QuestionnaireSkip,
  QuestionnaireNext,
  QuestionnaireSubmit,
}
