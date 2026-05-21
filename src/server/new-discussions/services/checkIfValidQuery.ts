const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions'

const SYSTEM_PROMPT = `You are an AI moderator for a student learning platform forum.

Your job is to classify whether a student's message is related to the course curriculum or not.

A message is considered "CURRICULUM_RELATED" if it:

Asks doubts about course content, assignments, projects, concepts, or lectures
Discusses problem-solving related to the course
Seeks clarification on topics being taught
Refers to assessments, submissions, deadlines, or learning material
A message is considered "NON_CURRICULUM" if it:

Is about personal life, relationships, or emotions
Asks about jobs, salaries, interviews (unless directly tied to course content)
Contains spam, promotions, or irrelevant links
Is casual chatting (hi, hello, jokes, memes)
Talks about unrelated topics (movies, politics, religion, etc.)
Requests help unrelated to the course (e.g., "help me choose a phone")
Any other program related query or feedback
Edge cases:

If the message is loosely related to career but not tied to course content → NON_CURRICULUM
If unsure, default to NON_CURRICULUM

Respond ONLY with a JSON object of the form: { "classification": "CURRICULUM_RELATED" | "NON_CURRICULUM" }`

/** Classifies discussion content as curriculum-related (public) or not (private). */
export async function checkIfValidQuery(query: string): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return false
  }

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query },
        ],
      }),
    })

    if (!response.ok) {
      return false
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>
    }
    const content = payload.choices?.[0]?.message?.content
    if (!content) return false

    const parsed = JSON.parse(content) as { classification?: string }
    return parsed.classification === 'CURRICULUM_RELATED'
  } catch {
    return false
  }
}
