export type QuestionGenCase = {
  name: string
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  subtopics: Array<string>
  numQuestions: number
}

/** Pulled straight from src/server/api/interviews/catalog/interviewTopicCatalog.ts
 * so the eval judges against the same rubric/subtopic wording production uses. */
export const QUESTION_GEN_CASES: Array<QuestionGenCase> = [
  {
    name: 'frontend-react',
    topicLabel: 'React',
    domain: 'frontend',
    rubricFocus: [
      'JSX & functional components',
      'Props vs state',
      'Controlled vs uncontrolled components',
      'useState & useEffect',
    ],
    subtopics: [
      'JSX & functional components',
      'Props vs state',
      'Controlled vs uncontrolled components',
      'useState & useEffect',
      'useEffect dependency pitfalls',
      'Conditional rendering',
      'Lists keys & list-rendering bugs',
      'Controlled forms',
      'Component composition & reusability',
      'Virtual DOM & reconciliation intuition',
      'Component re-render intuition',
      'Lifting state up',
      'Custom hooks basics',
      'React Router (routes navigation)',
      'Context API basics',
      'Fetching data in React (loading error empty states)',
      'localStorage with React',
      'Reusable UI / container-presentational patterns',
      'Building CRUD UI from scratch',
    ],
    numQuestions: 5,
  },
  {
    name: 'backend-http-rest-apis',
    topicLabel: 'HTTP & REST APIs',
    domain: 'backend',
    rubricFocus: [
      'Client-server architecture',
      'HTTP methods',
      'Status codes & status-code selection',
      'Headers & body',
    ],
    subtopics: [
      'Client-server architecture',
      'HTTP methods (GET POST PUT PATCH DELETE)',
      'Status codes & status-code selection',
      'Headers & body',
      'REST resources & endpoints',
      'API contracts (request response errors)',
      'Pagination filtering sorting',
      'Idempotency & safe methods intuition',
      'REST design trade-offs',
      'Testing APIs with Postman or Swagger',
      'Debugging failing endpoints',
    ],
    numQuestions: 5,
  },
  {
    name: 'data-analytics-sql',
    topicLabel: 'SQL',
    domain: 'data-analytics',
    rubricFocus: [
      'RDBMS concepts',
      'SELECT & DISTINCT',
      'WHERE filtering',
      'Comparison & logical operators',
    ],
    subtopics: [
      'RDBMS concepts (tables, rows, columns, schema, primary & foreign keys)',
      'SELECT & DISTINCT',
      'WHERE filtering',
      'Comparison & logical operators (AND, OR, NOT, IN, BETWEEN, LIKE, IS NULL)',
      'ORDER BY & LIMIT',
      'Aliases',
      'Aggregate functions (COUNT, SUM, AVG, MIN, MAX)',
      'GROUP BY & HAVING (vs WHERE)',
      'CASE WHEN',
      'String & date functions',
      'Joins (Inner, Left, Right, Full Outer, Self, Cross)',
      'Predicting & diagnosing join row counts',
      'Set operations (UNION, INTERSECT, EXCEPT)',
      'Subqueries (in WHERE/SELECT/FROM, correlated vs uncorrelated)',
      'CTEs (incl. chaining multiple CTEs)',
      'Window functions (ROW_NUMBER, RANK, DENSE_RANK, PARTITION BY, LAG, LEAD , running totals, moving averages)',
      'Indexes & query performance',
      'Query execution plans & diagnosing slow queries',
      'Mapping SQL operations to Pandas equivalents',
    ],
    numQuestions: 5,
  },
]
