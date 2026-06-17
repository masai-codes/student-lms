import type { Icon } from '@phosphor-icons/react'
import { ChatCircle, ClipboardText, Lightbulb, Question } from '@phosphor-icons/react'

export type SamplePromptIcon = Icon

export type SamplePrompt = {
  id: string
  label: string
  prompt: string
  icon: SamplePromptIcon
  iconClassName?: string
}

export const CHATBOT_SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'summary',
    label: 'Summarize the key points',
    prompt: 'Can you summarize the key concepts covered in this lecture?',
    icon: ClipboardText,
  },
  {
    id: 'explain',
    label: 'Explain the main concept',
    prompt: 'What was the most difficult concept in this lecture? Explain it in simple terms.',
    icon: ChatCircle,
  },
  {
    id: 'takeaways',
    label: 'What are the takeaways?',
    prompt: 'What is the main takeaway from this lecture?',
    icon: Question,
    iconClassName: 'text-red-500',
  },
  {
    id: 'quiz',
    label: 'Quiz me on this lecture',
    prompt: 'Quiz me on what was covered in this lecture with a few short questions.',
    icon: Lightbulb,
  },
]
