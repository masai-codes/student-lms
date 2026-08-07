import {
  Brain,
  Briefcase,
  ChartLine,
  ChatCircle,
  Code,
  Cube,
  Database,
  Layout,
  Lightbulb,
  ListChecks,
  Network,
  Sigma,
  Sparkle,
  BookOpen,
  type IconProps,
} from '@phosphor-icons/react'
import type { ComponentType } from 'react'

const TOPIC_ICONS: Record<string, ComponentType<IconProps>> = {
  sigma: Sigma,
  network: Network,
  'layout-template': Layout,
  code: Code,
  database: Database,
  cube: Cube,
  brain: Brain,
  sparkle: Sparkle,
  lightbulb: Lightbulb,
  'chart-line': ChartLine,
  briefcase: Briefcase,
  'list-checks': ListChecks,
  'chat-circle': ChatCircle,
}

const FALLBACK_ICON: ComponentType<IconProps> = BookOpen

export function getTopicIcon(iconKey: string): ComponentType<IconProps> {
  return TOPIC_ICONS[iconKey] ?? FALLBACK_ICON
}
