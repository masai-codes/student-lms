import { useEffect, useRef } from 'react'
import CodeMirror from 'codemirror'
import type { Editor } from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material-darker.css'
import 'codemirror/mode/sql/sql'
import './sql-playground.css'

type SqlCodeMirrorProps = {
  value: string
  onChange: (value: string) => void
  onRun: () => void
  theme: 'light' | 'dark'
  /** Receives the CodeMirror instance so the parent can read selection/cursor. */
  editorRef?: React.RefObject<Editor | null>
}

/** CodeMirror 5 wrapper with SQL keyword highlighting. */
export function SqlCodeMirror({
  value,
  onChange,
  onRun,
  theme,
  editorRef,
}: SqlCodeMirrorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const cmRef = useRef<Editor | null>(null)
  // Keep latest callbacks/value without re-creating the editor
  const onChangeRef = useRef(onChange)
  const onRunRef = useRef(onRun)
  const initialValueRef = useRef(value)

  useEffect(() => {
    onChangeRef.current = onChange
    onRunRef.current = onRun
  }, [onChange, onRun])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const cm = CodeMirror(host, {
      value: initialValueRef.current,
      mode: 'text/x-sql',
      lineNumbers: true,
      indentUnit: 2,
      extraKeys: {
        'Cmd-Enter': () => onRunRef.current(),
        'Ctrl-Enter': () => onRunRef.current(),
      },
    })
    cm.on('change', (instance) => onChangeRef.current(instance.getValue()))
    cmRef.current = cm
    if (editorRef) editorRef.current = cm

    // The tab panel can be resized by the surrounding layout — keep
    // CodeMirror's internal layout in sync.
    const observer = new ResizeObserver(() => cm.refresh())
    observer.observe(host)

    return () => {
      observer.disconnect()
      cm.getWrapperElement().remove()
      cmRef.current = null
      if (editorRef) editorRef.current = null
    }
  }, [editorRef])

  useEffect(() => {
    const cm = cmRef.current
    if (cm && value !== cm.getValue()) {
      cm.setValue(value)
    }
  }, [value])

  useEffect(() => {
    cmRef.current?.setOption(
      'theme',
      theme === 'dark' ? 'material-darker' : 'default',
    )
  }, [theme])

  return (
    <div
      ref={hostRef}
      data-testid="sql-playground-editor"
      className="sql-playground-cm"
    />
  )
}
