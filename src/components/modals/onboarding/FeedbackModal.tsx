import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, X } from 'lucide-react'
import type { NpsFormData, NpsQuestion } from '@/server/api/dashboard/getNpsForm.service'
import { fetchNpsForm, startNpsSubmission, saveNpsResponse, completeNpsSubmission } from '@/lib/api/dashboard/dashboardApi'

// ── Individual question inputs ────────────────────────────────────────────────

function McqSingleInput({
  question,
  value,
  onChange,
}: {
  question: NpsQuestion
  value: string
  onChange: (v: string) => void
}) {
  const options = question.config?.options ?? []
  return (
    <div className="relative mt-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:border-[#6962AC] focus:ring-1 focus:ring-[#6962AC] transition-colors appearance-none"
        style={{ color: value === '' ? '#9CA3AF' : '#111928' }}
      >
        <option value="">Choose an option here.</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

function McqMultipleInput({
  question,
  value,
  onChange,
}: {
  question: NpsQuestion
  value: Array<string>
  onChange: (v: Array<string>) => void
}) {
  const options = question.config?.options ?? []
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }
  return (
    <div className="mt-3 flex flex-col gap-2">
      {options.map((opt) => {
        const checked = value.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="flex items-center gap-3 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-left hover:border-[#6962AC] transition-colors focus-visible:outline-none"
          >
            <span
              className="shrink-0 size-4 rounded border-2 flex items-center justify-center transition-colors"
              style={{
                borderColor: checked ? '#6962AC' : '#D1D5DB',
                background: checked ? '#6962AC' : 'white',
              }}
            >
              {checked && (
                <svg viewBox="0 0 10 8" className="size-2.5" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span style={{ color: '#111928' }}>{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

function DescriptionInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter Your Feedback here."
      rows={4}
      className="mt-3 w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6962AC] focus:ring-1 focus:ring-[#6962AC] transition-colors resize-none"
    />
  )
}

function numericStepColors(ratio: number, selected: boolean): { bg: string; border: string; color: string } {
  if (ratio <= 0.35) {
    return selected
      ? { bg: '#EF4444', border: '#B91C1C', color: '#fff' }
      : { bg: '#FECACA', border: '#FECACA', color: '#fff' }
  }
  if (ratio <= 0.65) {
    return selected
      ? { bg: '#F59E0B', border: '#B45309', color: '#fff' }
      : { bg: '#FDE68A', border: '#FDE68A', color: '#92400E' }
  }
  return selected
    ? { bg: '#10B981', border: '#065F46', color: '#fff' }
    : { bg: '#A7F3D0', border: '#A7F3D0', color: '#065F46' }
}

function RatingScaleInput({
  question,
  value,
  onChange,
}: {
  question: NpsQuestion
  value: number | null
  onChange: (v: number) => void
}) {
  const cfg = question.config
  const scaleType = cfg?.scaleType ?? 'numeric'
  const min = cfg?.numericRange?.min ?? cfg?.minValue ?? 1
  const max = cfg?.numericRange?.max ?? cfg?.maxValue ?? 10
  const minLabel = cfg?.minLabel ?? ''
  const maxLabel = cfg?.maxLabel ?? ''
  const emojis = cfg?.emojis ?? []

  const EMOJI_LABEL_MAP: Record<string, string | undefined> = {
    // Poor
    '😠': 'Poor', '😤': 'Poor', '😡': 'Poor', '🤬': 'Poor',
    // Below Average
    '😞': 'Below Average', '😔': 'Below Average', '😕': 'Below Average', '🙁': 'Below Average',
    // Average
    '😐': 'Average', '😑': 'Average', '😶': 'Average',
    // Good
    '🙂': 'Good', '😊': 'Good',
    // Excellent
    '😄': 'Excellent', '🤩': 'Excellent', '😁': 'Excellent', '🌟': 'Excellent', '⭐': 'Excellent',
  }

  // labels: hardcoded map first, then emojiLabels, then options
  const emojiLabels = cfg?.emojiLabels ?? cfg?.options ?? []
  const hasLabels = emojiLabels.length > 0 || emojis.some((e) => EMOJI_LABEL_MAP[e])

  // ── Emoji scale ──────────────────────────────────────────────────────────────
  if (scaleType === 'emoji') {
    // Use emojis array length when provided; otherwise derive from numericRange
    const emojiSteps = emojis.length > 0
      ? emojis.map((emoji, idx) => ({ n: min + idx, emoji }))
      : Array.from({ length: max - min + 1 }, (_, i) => ({ n: min + i, emoji: String(min + i) }))

    // If any element spans multiple codepoints (e.g. "⭐⭐⭐"), render stacked
    const isStacked = emojiSteps.some(({ emoji }) => [...emoji].length > 1)

    if (isStacked) {
      return (
        <div className="mt-3 rounded-2xl bg-[#F3F4F6] px-5 py-4 flex flex-col gap-3">
          {emojiSteps.map(({ n, emoji }) => {
            const selected = value === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="flex items-center gap-1 focus-visible:outline-none w-fit transition-all duration-150"
                style={{
                  transform: selected ? 'scale(1.05)' : 'scale(1)',
                  opacity: selected ? 1 : 0.75,
                }}
              >
                <span className="text-3xl leading-none">{emoji}</span>
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <div className="mt-3 rounded-2xl bg-[#F3F4F6] px-6 py-5">
        <div className="flex gap-6 justify-center">
          {emojiSteps.map(({ n, emoji }, idx) => {
            const label = EMOJI_LABEL_MAP[emoji] ?? emojiLabels[idx] ?? String(n)
            const selected = value === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="flex flex-col items-center gap-2 focus-visible:outline-none"
              >
                <span
                  className="text-5xl leading-none"
                  style={{
                    display: 'inline-block',
                    filter: selected ? 'none' : 'grayscale(70%)',
                    opacity: selected ? 1 : 0.55,
                    transform: selected ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.15s, opacity 0.15s, filter 0.15s',
                  }}
                >
                  {emoji}
                </span>
                <span
                  className="text-sm font-medium leading-tight text-center"
                  style={{ color: selected ? '#374151' : '#6B7280' }}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        {!hasLabels && (minLabel || maxLabel) && (
          <div className="flex justify-between mt-3 text-xs text-gray-400">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>
    )
  }

  // ── Numeric scale ─────────────────────────────────────────────────────────────
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div className="mt-3">
      <div className="flex gap-2 flex-wrap justify-center">
        {steps.map((n) => {
          const ratio = steps.length === 1 ? 1 : (n - min) / (max - min)
          const selected = value === n
          const { bg, border, color } = numericStepColors(ratio, selected)
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="size-12 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none"
              style={{
                background: bg,
                border: `3px solid ${selected ? border : 'transparent'}`,
                color,
                boxShadow: selected ? `0 0 0 2px ${border}40` : 'none',
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}

function DatePickerInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-3 w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#6962AC] focus:ring-1 focus:ring-[#6962AC] transition-colors"
    />
  )
}

function TrueFalseInput({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="mt-3 flex gap-3">
      {([true, false] as const).map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => onChange(opt)}
          className="flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors focus-visible:outline-none"
          style={{
            borderColor: value === opt ? '#6962AC' : '#E5E7EB',
            background: value === opt ? '#6962AC' : 'white',
            color: value === opt ? 'white' : '#374151',
          }}
        >
          {opt ? 'True' : 'False'}
        </button>
      ))}
    </div>
  )
}

// ── Answer store ──────────────────────────────────────────────────────────────

type AnswerValue = string | Array<string> | number | boolean | null

function isAnswered(_question: NpsQuestion, answer: AnswerValue): boolean {
  if (answer === null) return false
  if (typeof answer === 'string') return answer.trim() !== ''
  if (Array.isArray(answer)) return answer.length > 0
  return true
}

// ── Shared form content (used both in the standalone modal and OnboardingModal) ─

interface FeedbackFormContentProps {
  formId: number
  isOnlyStep?: boolean
  onSubmitted?: () => void
}

export function FeedbackFormContent({ formId, isOnlyStep = false, onSubmitted }: FeedbackFormContentProps) {
  const [form, setForm] = useState<NpsFormData | null>(null)
  const [submissionId, setSubmissionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [validationBanner, setValidationBanner] = useState(false)
  const onSubmittedRef = useRef(onSubmitted)
  onSubmittedRef.current = onSubmitted

  useEffect(() => {
    let cancelled = false
    setError('')
    setLoading(true)
    Promise.all([fetchNpsForm(formId), startNpsSubmission(formId)])
      .then(([formData, submission]) => {
        if (cancelled) return
        setError('')
        setForm(formData)
        setSubmissionId(submission.submissionId)
        if (submission.existingResponses.length > 0) {
          const preloaded: Record<number, AnswerValue> = {}
          for (const r of submission.existingResponses) {
            preloaded[r.questionId] = r.response as AnswerValue
          }
          setAnswers(preloaded)
        }
        if (submission.status === 'SUBMITTED') setSubmitted(true)
      })
      .catch(() => { if (!cancelled) setError('Failed to load feedback form.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [formId])

  // Start countdown when only step and submitted
  useEffect(() => {
    if (submitted && isOnlyStep) setCountdown(5)
  }, [submitted, isOnlyStep])

  // Tick the countdown; fire onSubmitted at 0
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      onSubmittedRef.current?.()
      return
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function setAnswer(questionId: number, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setValidationBanner(false)
    if (submissionId !== null) {
      void saveNpsResponse(formId, submissionId, questionId, value).catch(() => undefined)
    }
  }

  const questions = form?.questions ?? []
  const total = questions.length
  const answered = questions.filter((q) => isAnswered(q, answers[q.id] ?? null)).length

  async function handleSubmit() {
    if (!form || submissionId === null) return
    const unansweredRequired = questions.filter((q) => q.isRequired && !isAnswered(q, answers[q.id] ?? null))
    if (unansweredRequired.length > 0) {
      setValidationBanner(true)
      return
    }
    setValidationBanner(false)
    setSubmitting(true)
    try {
      await completeNpsSubmission(formId, submissionId)
      setSubmitted(true)
      if (!isOnlyStep) onSubmitted?.()
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-10 text-center">
        <div className="size-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-500" strokeWidth={2} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>
          Submission Recorded!
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
          Your feedback has been successfully recorded. Thank you for taking the time to share your experience.
        </p>
        {isOnlyStep && countdown !== null && (
          <p className="text-sm text-gray-400 mt-1">Closing in {countdown}s…</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        {form?.title && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>
              {form.title}
            </h3>
            {form.description && (
              <p className="mt-1 text-sm text-gray-500">{form.description}</p>
            )}
          </div>
        )}

        {validationBanner && (
          <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-lg border border-orange-200 bg-orange-50">
            <AlertCircle size={18} className="text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700 leading-snug">
              Please fill in all required fields before submitting.
            </p>
            <button
              type="button"
              onClick={() => setValidationBanner(false)}
              className="ml-auto text-orange-400 hover:text-orange-600 transition-colors focus-visible:outline-none shrink-0"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-lg border border-red-200 bg-red-50">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 leading-snug">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading questions…</div>
        )}

        {!loading && !submitted && form && questions.map((q, idx) => (
          <div key={q.id} className="mb-7">
            <p className="text-sm text-gray-800 leading-relaxed">
              {idx + 1}. {q.questionText}
              {q.isRequired && <span className="text-red-500 ml-1">*</span>}
            </p>
            {q.questionType === 'MCQ_SINGLE' && (
              <McqSingleInput question={q} value={(answers[q.id] as string | undefined) ?? ''} onChange={(v) => setAnswer(q.id, v)} />
            )}
            {q.questionType === 'MCQ_MULTIPLE' && (
              <McqMultipleInput question={q} value={(answers[q.id] as Array<string> | undefined) ?? []} onChange={(v) => setAnswer(q.id, v)} />
            )}
            {q.questionType === 'DESCRIPTION' && (
              <DescriptionInput value={(answers[q.id] as string | undefined) ?? ''} onChange={(v) => setAnswer(q.id, v)} />
            )}
            {q.questionType === 'RATING_SCALE' && (
              <RatingScaleInput question={q} value={(answers[q.id] as number | null) ?? null} onChange={(v) => setAnswer(q.id, v)} />
            )}
            {q.questionType === 'DATE_PICKER' && (
              <DatePickerInput value={(answers[q.id] as string | undefined) ?? ''} onChange={(v) => setAnswer(q.id, v)} />
            )}
            {q.questionType === 'TRUE_FALSE' && (
              <TrueFalseInput value={(answers[q.id] as boolean | null) ?? null} onChange={(v) => setAnswer(q.id, v)} />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {!submitted && (
        <div className="shrink-0 flex items-center justify-between px-8 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-36 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: total > 0 ? `${(answered / total) * 100}%` : '0%', background: '#6962AC' }}
              />
            </div>
            <span className="text-sm font-medium text-gray-500">{answered}/{total} Completed</span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="flex items-center justify-center text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ height: 40, padding: '0 24px', background: '#6962AC', fontFamily: 'Poppins', fontSize: 16 }}
          >
            {submitting ? 'Submitting…' : 'SUBMIT'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Standalone modal wrapper ───────────────────────────────────────────────────

interface FeedbackModalProps {
  formId: number
  onClose: () => void
  onSubmitted?: () => void
}

export function FeedbackModal({ formId, onClose, onSubmitted }: FeedbackModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div
        className="relative bg-white rounded-2xl flex flex-col overflow-hidden"
        style={{ width: 672, maxHeight: '90vh' }}
      >
        <div className="shrink-0 flex items-center justify-end px-6 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none"
          >
            <X size={22} />
          </button>
        </div>
        <FeedbackFormContent formId={formId} onSubmitted={() => { onSubmitted?.(); onClose() }} />
      </div>
    </div>
  )
}

// ── Legacy form used inside OnboardingModal ───────────────────────────────────

const EMOJIS = ['😤', '😞', '😑', '🙂', '🤩']

const TA_OPTIONS = [
  'Aakash Verma',
  'Divya Nair',
  'Rajesh Mehta',
  'Sunita Rao',
  'Pooja Iyer',
]

const inputClass =
  'w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6962AC] focus:ring-1 focus:ring-[#6962AC] transition-colors appearance-none'

export function FeedbackForm({ onSubmit }: { onSubmit: () => void }) {
  const [q1, setQ1] = useState<number | null>(null)
  const [ta, setTa] = useState('')
  const [q3, setQ3] = useState<number | null>(null)
  const [q4, setQ4] = useState('')

  const total = 4
  const answered = [q1 !== null, ta !== '', q3 !== null, q4.trim() !== ''].filter(Boolean).length

  function EmojiRating({ value, onChange }: { value: number | null; onChange: (i: number) => void }) {
    return (
      <div className="flex gap-4 mt-3">
        {EMOJIS.map((emoji, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`text-4xl transition-all rounded-xl p-1 focus-visible:outline-none ${
              value === i ? 'scale-125' : value === null ? 'grayscale opacity-60 hover:opacity-100 hover:grayscale-0' : i < value ? 'opacity-80' : 'grayscale opacity-40 hover:opacity-80 hover:grayscale-0'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <h2
          className="text-xl font-semibold text-center mb-8"
          style={{ fontFamily: 'Poppins', color: '#111928' }}
        >
          LMS Feedback
        </h2>

        <div className="mb-8">
          <p className="text-sm text-gray-800 leading-relaxed">
            1. Kindly rate your learning experience with Master Dr. Tarachand Amgoth Sir during this course.
          </p>
          <EmojiRating value={q1} onChange={setQ1} />
        </div>

        <div className="mb-8">
          <p className="text-sm text-gray-800 mb-3">
            2. Please Choose your (Teaching Assistant)
          </p>
          <div className="relative">
            <select
              value={ta}
              onChange={(e) => setTa(e.target.value)}
              className={inputClass}
              style={{ color: ta === '' ? '#9CA3AF' : '#111928' }}
            >
              <option value="">Choose your Teaching Assistant here</option>
              {TA_OPTIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm text-gray-800">
            3. How satisfied are you with the support given by the TA Support
          </p>
          <EmojiRating value={q3} onChange={setQ3} />
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-800 mb-3">
            4. One thing that you appreciate in this program.
          </p>
          <textarea
            value={q4}
            onChange={(e) => setQ4(e.target.value)}
            placeholder="Enter Your Feedback here"
            rows={4}
            className="w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6962AC] focus:ring-1 focus:ring-[#6962AC] transition-colors resize-none"
          />
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-between px-8 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-36 h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(answered / total) * 100}%`, background: '#6962AC' }}
            />
          </div>
          <span className="text-sm font-medium text-gray-500">{answered}/{total} Completed</span>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="flex items-center justify-center text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none"
          style={{ height: 40, padding: '0 24px', background: '#6962AC', fontFamily: 'Poppins', fontSize: 16 }}
        >
          Save &amp; Submit
        </button>
      </div>
    </div>
  )
}
