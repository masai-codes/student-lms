/**
 * Evaluates question generation (generateAllInterviewQuestions) across every
 * model in TEXT_GENERATION_MODEL_VARIANTS — one Braintrust experiment per
 * model. Covers case 2: generated questions must actually target the
 * topic's rubric focus / subtopics, not read as generic filler.
 *
 * Run: npm run eval:interviews -- questionRelevance.eval.ts
 * Requires OPENROUTER_API_KEY (and EVAL_JUDGE_MODEL/BRAINTRUST_API_KEY optionally).
 */
import { Eval } from 'braintrust'
import { generateAllInterviewQuestions } from '@/server/api/interviews/services/generateInterviewQuestions.service'
import {
  QUESTION_GEN_CASES,
  type QuestionGenCase,
} from './fixtures/questionGenCases'
import { TEXT_GENERATION_MODEL_VARIANTS } from './models'
import { QUESTION_RELEVANCE_SCORERS } from './scorers'

for (const model of TEXT_GENERATION_MODEL_VARIANTS) {
  void Eval('interview-question-relevance', {
    experimentName: model,
    data: () =>
      QUESTION_GEN_CASES.map((testCase) => ({
        input: testCase,
        metadata: { model, caseName: testCase.name },
      })),
    task: (testCase: QuestionGenCase) =>
      generateAllInterviewQuestions({ ...testCase, model }),
    scores: QUESTION_RELEVANCE_SCORERS,
  })
}
