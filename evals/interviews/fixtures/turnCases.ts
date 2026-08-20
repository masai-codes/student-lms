import type { ConversationExchange } from '@/server/api/interviews/services/buildInterviewPrompt'

export type TurnCase = {
  name: string
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  questionNumber: number
  totalQuestions: number
  followUpCount: number
  priorExchanges: Array<ConversationExchange>
  currentPrompt: string
  answerText: string
  /** null when there's no single correct call and only the LLM-judge scorers apply. */
  expectAdvance: boolean | null
  /** True for scenarios where the candidate is fishing for the solution — the
   * interviewer must never hand it over. */
  checkNoSelfAnswer: boolean
}

const REACT_RUBRIC = [
  'JSX & functional components',
  'Props vs state',
  'Controlled vs uncontrolled components',
  'useState & useEffect',
]

const REST_RUBRIC = [
  'Client-server architecture',
  'HTTP methods',
  'Status codes & status-code selection',
  'Headers & body',
]

const SQL_RUBRIC = [
  'RDBMS concepts',
  'SELECT & DISTINCT',
  'WHERE filtering',
  'Comparison & logical operators',
]

const PYTHON_RUBRIC = [
  'Variables & data types',
  'Operators',
  'Conditionals',
  'Loops',
]

const CSS_RUBRIC = [
  'Selectors',
  'Box model',
  'Colors & typography',
  'Backgrounds & borders',
]

const PM_RUBRIC = [
  'Product Management Ecosystem & PM Archetypes',
  'PM Toolkit',
  'Product Health Frameworks',
  'Product Lifecycle Management',
]

export const TURN_CASES: Array<TurnCase> = [
  {
    name: 'react-strong-first-answer',
    topicLabel: 'React',
    domain: 'frontend',
    rubricFocus: REACT_RUBRIC,
    questionNumber: 2,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt:
      'Walk me through what happens when you call useEffect with an empty dependency array versus no dependency array at all, and how each affects renders.',
    answerText:
      "With an empty array, the effect runs once after the first render, and its cleanup function — if there is one — only runs on unmount. With no array at all, the effect runs after every single render, since there's nothing telling React to skip it. A bug I've hit from this: if you leave a value out of the dependency array that the effect actually reads — like a prop or piece of state — the effect closes over the stale version of it from the render it was created in, so it keeps acting on old data even after that value changes. That's why the exhaustive-deps lint rule flags it. And if the effect sets up something like a subscription or interval without a cleanup function, you'll get duplicates piling up across renders or a leak after unmount.",
    expectAdvance: true,
    checkNoSelfAnswer: false,
  },
  {
    name: 'react-thin-first-answer',
    topicLabel: 'React',
    domain: 'frontend',
    rubricFocus: REACT_RUBRIC,
    questionNumber: 2,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt:
      'Walk me through what happens when you call useEffect with an empty dependency array versus no dependency array at all, and how each affects renders.',
    answerText: 'It just runs the effect once I think, not totally sure when.',
    expectAdvance: false,
    checkNoSelfAnswer: false,
  },
  {
    name: 'rest-strong-first-answer',
    topicLabel: 'HTTP & REST APIs',
    domain: 'backend',
    rubricFocus: REST_RUBRIC,
    questionNumber: 3,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt:
      "What's the difference between PUT and PATCH, and when would you choose one over the other?",
    answerText:
      "PUT replaces the entire resource with whatever you send — if you leave a field out of the body, the server is supposed to treat it as cleared or reset to default, and calling it twice with the same body leaves the resource in the same state, so it's idempotent. PATCH only applies a partial update — you send just the fields that changed, and the server merges them into the existing resource. I'd use PUT when the client always has and sends the full representation of the resource, like replacing a whole config object. I'd use PATCH when the client is only editing one or two fields, like updating just a user's display name, since sending the whole object every time would be wasteful and risk overwriting fields the client didn't mean to touch.",
    expectAdvance: true,
    checkNoSelfAnswer: false,
  },
  {
    name: 'rest-adequate-answer-past-min-followups',
    topicLabel: 'HTTP & REST APIs',
    domain: 'backend',
    rubricFocus: REST_RUBRIC,
    questionNumber: 3,
    totalQuestions: 5,
    followUpCount: 3,
    priorExchanges: [
      {
        prompt: 'Is GET ever expected to change data on the server?',
        transcript: "No, GET should be read-only, it's a safe method.",
      },
      {
        prompt: 'What does idempotent mean, in your own words?',
        transcript:
          'Calling it once or many times with the same input leaves the server in the same end state.',
      },
      {
        prompt: 'Is POST idempotent?',
        transcript:
          "No, POST usually isn't — calling it twice can create two separate resources.",
      },
    ],
    currentPrompt:
      "What's the difference between PUT and PATCH, and when would you choose one over the other?",
    answerText:
      "PUT replaces the whole resource, PATCH only updates the fields you send. I'd use PUT for a full replace and PATCH for a small partial edit, like updating one field.",
    expectAdvance: true,
    checkNoSelfAnswer: false,
  },
  {
    name: 'react-candidate-asks-for-the-answer',
    topicLabel: 'React',
    domain: 'frontend',
    rubricFocus: REACT_RUBRIC,
    questionNumber: 2,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt:
      'How would you lift state up between two sibling components that both need to react to the same piece of data?',
    answerText:
      "Honestly I'm blanking on this one, can you just tell me the answer?",
    expectAdvance: false,
    checkNoSelfAnswer: true,
  },
  {
    name: 'rest-candidate-gives-up-mid-answer',
    topicLabel: 'HTTP & REST APIs',
    domain: 'backend',
    rubricFocus: REST_RUBRIC,
    questionNumber: 3,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt: 'Why is idempotency important for PUT and DELETE requests?',
    answerText:
      "I don't really remember... is it something to do with retries? What's the actual definition?",
    expectAdvance: false,
    checkNoSelfAnswer: true,
  },
  {
    name: 'sql-strong-answer-with-transcription-noise',
    topicLabel: 'SQL',
    domain: 'data-analytics',
    rubricFocus: SQL_RUBRIC,
    questionNumber: 3,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt:
      "What's the difference between INNER JOIN and LEFT JOIN, and when would you use each?",
    answerText:
      "So basically in sequel, um, an inner join only returns rows where there's a match in both tables — like if a customer has no orders, they just won't show up. A left join, though, keeps all the rows from the left table no matter what, and if there's no match on the right side you just get nulls for those columns. I'd use inner join when I only care about rows that actually have a match, like showing orders with their customer info, and left join when I want to see everything from the main table, like listing all customers even the ones who haven't ordered anything yet.",
    expectAdvance: true,
    checkNoSelfAnswer: false,
  },
  {
    name: 'sql-thin-answer-name-only',
    topicLabel: 'SQL',
    domain: 'data-analytics',
    rubricFocus: SQL_RUBRIC,
    questionNumber: 2,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt:
      'What does the GROUP BY clause do, and how is it different from WHERE?',
    answerText: 'GROUP BY groups stuff together I think.',
    expectAdvance: false,
    checkNoSelfAnswer: false,
  },
  {
    name: 'python-decorator-term-definition-trap',
    topicLabel: 'Python',
    domain: 'backend',
    rubricFocus: PYTHON_RUBRIC,
    questionNumber: 4,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt:
      "What's a decorator in Python, and can you give an example of when you'd use one?",
    answerText: "Umm, I don't remember... what does decorator actually mean?",
    expectAdvance: false,
    checkNoSelfAnswer: true,
  },
  {
    name: 'css-flexbox-thin-one-word-answer',
    topicLabel: 'CSS',
    domain: 'frontend',
    rubricFocus: CSS_RUBRIC,
    questionNumber: 2,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt:
      "What's the difference between justify-content and align-items in a flex container?",
    answerText: 'Flexbox is for layout.',
    expectAdvance: false,
    checkNoSelfAnswer: false,
  },
  {
    name: 'react-rambling-disfluent-but-correct',
    topicLabel: 'React',
    domain: 'frontend',
    rubricFocus: REACT_RUBRIC,
    questionNumber: 1,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt: "What's the difference between props and state in React?",
    answerText:
      "Okay so, um, props are like — you know — the stuff a parent component passes down to a child, right, and the child can't like change them itself, they're read-only from the child's side. And state is, um, kind of the opposite, it's data that a component owns and manages internally, and when you update it with something like the state setter function, the component just, like, re-renders itself. So yeah, basically props flow down from parent to child and state lives inside a component and changing it triggers a re-render.",
    expectAdvance: true,
    checkNoSelfAnswer: false,
  },
  {
    name: 'rest-status-codes-misconception',
    topicLabel: 'HTTP & REST APIs',
    domain: 'backend',
    rubricFocus: REST_RUBRIC,
    questionNumber: 2,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt: "What's the difference between a 404 and a 500 status code?",
    answerText:
      'A 404 means the server ran into an unexpected error while processing the request, and a 500 means the specific resource you asked for does not exist.',
    expectAdvance: false,
    checkNoSelfAnswer: false,
  },
  {
    name: 'product-management-vague-buzzwords',
    topicLabel: 'Product Management Foundations & PM Mindset',
    domain: 'product-management',
    rubricFocus: PM_RUBRIC,
    questionNumber: 3,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt:
      'How would you decide whether a new feature request from a big customer should actually be built?',
    answerText:
      "It's really about understanding the user and iterating fast, staying agile, and always keeping the customer at the center of everything we do.",
    expectAdvance: false,
    checkNoSelfAnswer: false,
  },
  {
    name: 'rest-candidate-asks-clarifying-scope-question',
    topicLabel: 'HTTP & REST APIs',
    domain: 'backend',
    rubricFocus: REST_RUBRIC,
    questionNumber: 4,
    totalQuestions: 5,
    followUpCount: 0,
    priorExchanges: [],
    currentPrompt:
      'How would you design pagination for an endpoint that returns a large list of orders?',
    answerText:
      'Are we assuming the client is a mobile app with limited bandwidth, or could it also be an internal admin dashboard? That might change my answer.',
    expectAdvance: false,
    checkNoSelfAnswer: true,
  },
]
