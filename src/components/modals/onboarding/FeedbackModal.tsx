import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

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

        {/* Q1 */}
        <div className="mb-8">
          <p className="text-sm text-gray-800 leading-relaxed">
            1. Kindly rate your learning experience with Master Dr. Tarachand Amgoth Sir during this course.
          </p>
          <EmojiRating value={q1} onChange={setQ1} />
        </div>

        {/* Q2 */}
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

        {/* Q3 */}
        <div className="mb-8">
          <p className="text-sm text-gray-800">
            3. How satisfied are you with the support given by the TA Support
          </p>
          <EmojiRating value={q3} onChange={setQ3} />
        </div>

        {/* Q4 */}
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

      {/* Footer */}
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
