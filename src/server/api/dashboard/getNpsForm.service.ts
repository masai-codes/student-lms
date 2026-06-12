import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { npsForms, npsQuestions } from '@/db/schema'

export type NpsQuestionType = 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'DESCRIPTION' | 'RATING_SCALE' | 'DATE_PICKER' | 'TRUE_FALSE'

export interface NpsQuestionConfig {
  options?: Array<string>
  minValue?: number
  maxValue?: number
  minLabel?: string
  maxLabel?: string
  scaleType?: 'numeric' | 'emoji' | 'star'
  emojis?: Array<string>
  emojiLabels?: Array<string>
  numericRange?: { min: number; max: number }
}

export interface NpsQuestion {
  id: number
  questionText: string
  questionType: NpsQuestionType
  sequence: number
  isRequired: boolean
  isScored: boolean
  config: NpsQuestionConfig | null
}

export interface NpsFormData {
  id: number
  title: string
  description: string | null
  questions: Array<NpsQuestion>
}

export async function getNpsForm(formId: number): Promise<NpsFormData | null> {
  const [form] = await db
    .select({ id: npsForms.id, title: npsForms.title, description: npsForms.description })
    .from(npsForms)
    .where(and(eq(npsForms.id, formId), isNull(npsForms.deletedAt), eq(npsForms.isActive, 1)))
    .limit(1)

  if (!form) return null

  const questions = await db
    .select({
      id: npsQuestions.id,
      questionText: npsQuestions.questionText,
      questionType: npsQuestions.questionType,
      sequence: npsQuestions.sequence,
      isRequired: npsQuestions.isRequired,
      isScored: npsQuestions.isScored,
      config: npsQuestions.config,
    })
    .from(npsQuestions)
    .where(and(eq(npsQuestions.npsFormId, formId), isNull(npsQuestions.deletedAt)))
    .orderBy(npsQuestions.sequence)

  return {
    id: form.id,
    title: form.title,
    description: form.description ?? null,
    questions: questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType as NpsQuestionType,
      sequence: q.sequence,
      isRequired: q.isRequired === 1,
      isScored: q.isScored === 1,
      config: (q.config as NpsQuestionConfig | null) ?? null,
    })),
  }
}
