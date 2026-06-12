import { cn } from '@/lib/utils'

export const chatbotBtnClass = 'cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs'

export const chatbotBtnPrimaryClass = cn(
  chatbotBtnClass,
  'border-teal-700 bg-teal-700 text-white',
)

export const chatbotErrorBannerClass =
  'rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700'

export const chatbotInfoBannerClass =
  'mt-2 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-2 text-xs text-teal-800'

export const chatbotMutedTextClass = 'text-gray-500'

export const chatbotShellClass = 'flex h-full min-h-0 flex-col'

export const chatbotMainClass = cn(
  'flex min-h-0 flex-col overflow-hidden bg-white',
  'flex-1 rounded-none border-0',
)
