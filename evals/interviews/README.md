# Interview session evals

Model-comparison evals for the two OpenRouter calls the interview feature
makes (see `src/server/api/interviews/constants.ts`), built on
[Braintrust](https://www.braintrust.dev)'s open-source `Eval()` framework.

Both eval files call the _real_ production prompt-builders and API clients
(`buildTurnSystemPrompt`, `buildTurnMessages`, `requestInterviewTurnAudioStream`,
`generateAllInterviewQuestions`) with an explicit `model` override, so results
reflect the exact prompts shipped in production, not a re-implementation.

## What's covered

- **`turnDecision.eval.ts`** — the per-answer decision call (follow-up vs.
  `move_to_next_question`), across every model in
  `TURN_DECISION_MODEL_VARIANTS`:
  - "moving on" must be a silent tool call, never just said out loud
  - the interviewer shouldn't keep asking follow-ups once an answer is
    already complete ("swelling"/dwelling)
  - the interviewer must never hand over the answer when a candidate is
    stuck or asks for it directly
- **`questionRelevance.eval.ts`** — question generation, across every model
  in `TEXT_GENERATION_MODEL_VARIANTS`: generated questions must target the
  topic's rubric focus / subtopics, come back as the right count, and not
  duplicate each other.

Candidate answers are mocked as plain text (`fixtures/turnCases.ts`,
`fixtures/questionGenCases.ts`) — voice answers are always live-transcribed
to text before reaching the turn-decision call in production anyway, so a
text-only harness exercises the same decision logic real sessions hit. No
real audio is generated or inspected; only the tool-call/transcript outcome
matters for these checks.

Model lists live in `models.ts` — every id was checked against OpenRouter's
live `/api/v1/models` catalog, not guessed. Edit that file to add/remove
variants.

## Running

```bash
npm run eval:interviews                              # both files, every model
npm run eval:interviews -- turnDecision.eval.ts       # one file
npm run eval:interviews -- --filter 'metadata.model=^openai/gpt-audio$'
npm run eval:interviews -- --jsonl                    # machine-readable per-model summary
```

Requires `OPENROUTER_API_KEY` in `.env` (used both for the models under test
and, by default, for the LLM-judge scorers). Runs fully locally — no
Braintrust account needed. If you do have `BRAINTRUST_API_KEY` set, drop
`--no-send-logs` from the `eval:interviews` script (or run `npx braintrust
eval evals/interviews` directly) to push results to a hosted experiment with
a diffable UI instead of just a console summary.

`EVAL_JUDGE_MODEL` overrides the judge model (default
`anthropic/claude-sonnet-5`) — deliberately not one of the models under test,
so a model never grades its own output family.

## Caveats

- Small, hand-written fixture sets (6 turn-decision cases, 3 topics for
  question generation) — enough to catch clear regressions and directionally
  compare models, not a statistically rigorous sample. LLM outputs are
  non-deterministic, so scores will drift a few points run to run; treat
  differences under ~10-15 points as noise, not a verdict.
- `advance_matches_expectation` and `follow_up_was_warranted` encode a
  judgment call about what "complete enough to move on" means for each fixed
  scenario — reasonable interviewers could disagree at the margin.
