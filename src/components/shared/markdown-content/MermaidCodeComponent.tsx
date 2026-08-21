import { useEffect, useMemo, useRef, useState } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import mermaid from 'mermaid'

import { useTheme } from '@/lib/theme'

type MermaidCodeProps = {
  inline?: boolean
  className?: string
  children?: ReactNode
  node?: unknown
} & HTMLAttributes<HTMLElement>

let initializedTheme: 'default' | 'dark' | null = null

/** Re-initializes when the app theme flips so diagrams render dark-legible. */
const ensureMermaidInitialized = (theme: 'default' | 'dark') => {
  if (initializedTheme === theme) return
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme,
  })
  initializedTheme = theme
}

const readNodeText = (value: ReactNode): string => {
  if (typeof value === 'string' || typeof value === 'number')
    return String(value)
  if (Array.isArray(value)) return value.map(readNodeText).join('')
  if (value && typeof value === 'object' && 'props' in value) {
    const element = value as { props?: { children?: ReactNode } }
    return readNodeText(element.props?.children ?? '')
  }
  return ''
}

export function MermaidCodeComponent({
  inline,
  className,
  children,
  node,
  ...restProps
}: MermaidCodeProps) {
  const { resolvedTheme } = useTheme()
  const [svg, setSvg] = useState('')
  const [hasError, setHasError] = useState(false)
  const renderIdRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const codeValue = useMemo(() => readNodeText(children).trim(), [children])
  const isMermaidCodeBlock = Boolean(
    !inline && className?.toLowerCase().includes('language-mermaid'),
  )

  useEffect(() => {
    if (!isMermaidCodeBlock || !codeValue) return
    let isMounted = true

    const renderMermaid = async () => {
      try {
        ensureMermaidInitialized(resolvedTheme === 'dark' ? 'dark' : 'default')
        const { svg: renderedSvg } = await mermaid.render(
          renderIdRef.current,
          codeValue,
        )
        if (!isMounted) return
        setHasError(false)
        setSvg(renderedSvg)
      } catch {
        if (!isMounted) return
        setHasError(true)
      }
    }

    renderMermaid()
    return () => {
      isMounted = false
    }
  }, [codeValue, isMermaidCodeBlock, resolvedTheme])

  useEffect(() => {
    if (!containerRef.current || !svg) return
    containerRef.current.innerHTML = svg
  }, [svg])

  if (isMermaidCodeBlock && !hasError && svg) {
    return (
      <div
        ref={containerRef}
        className="my-3 overflow-x-auto rounded-md border border-border bg-surface p-3"
      />
    )
  }

  return (
    <code className={className} {...restProps}>
      {children}
    </code>
  )
}
