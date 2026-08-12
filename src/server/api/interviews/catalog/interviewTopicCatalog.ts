import type {
  InterviewDomain,
  InterviewTopic,
} from '@/server/api/interviews/types/interviewSession'

const INTERVIEW_TOPIC_CATALOG: Record<
  InterviewDomain,
  Array<InterviewTopic>
> = {
  'software-development': [
    {
      id: 'dsa',
      label: 'Data Structures & Algorithms',
      iconKey: 'sigma',
      blurb: 'Arrays, trees, graphs, and complexity trade-offs.',
      rubricFocus: [
        'Problem breakdown',
        'Time & space complexity',
        'Edge-case handling',
      ],
    },
    {
      id: 'system-design',
      label: 'System Design',
      iconKey: 'network',
      blurb: 'Scalable architecture, trade-offs, and reliability.',
      rubricFocus: [
        'Requirements clarification',
        'Trade-off reasoning',
        'Scalability',
      ],
    },
    {
      id: 'frontend',
      label: 'Frontend Development',
      iconKey: 'layout-template',
      blurb: 'UI architecture, state management, and performance.',
      rubricFocus: [
        'Component design',
        'State management',
        'Performance awareness',
      ],
    },
    {
      id: 'backend',
      label: 'Backend Development',
      iconKey: 'code',
      blurb: 'APIs, services, and data flow.',
      rubricFocus: ['API design', 'Data modeling', 'Error handling'],
    },
    {
      id: 'databases',
      label: 'Databases',
      iconKey: 'database',
      blurb: 'Schema design, indexing, and query performance.',
      rubricFocus: [
        'Schema design',
        'Indexing & performance',
        'Consistency trade-offs',
      ],
    },
    {
      id: 'oop',
      label: 'Object-Oriented Design',
      iconKey: 'cube',
      blurb: 'Class design, SOLID principles, and design patterns.',
      rubricFocus: ['Design principles', 'Class structure', 'Pattern usage'],
    },
  ],
  'data-ai-ml': [
    {
      id: 'ml-fundamentals',
      label: 'ML Fundamentals',
      iconKey: 'brain',
      blurb: 'Core algorithms, evaluation, and bias-variance trade-offs.',
      rubricFocus: [
        'Algorithm selection',
        'Evaluation metrics',
        'Bias & overfitting',
      ],
    },
    {
      id: 'deep-learning',
      label: 'Deep Learning',
      iconKey: 'network',
      blurb: 'Neural network architectures and training dynamics.',
      rubricFocus: [
        'Architecture choice',
        'Training dynamics',
        'Regularization',
      ],
    },
    {
      id: 'genai-llms',
      label: 'GenAI & LLMs',
      iconKey: 'sparkle',
      blurb: 'Prompting, fine-tuning, and applied LLM systems.',
      rubricFocus: ['Prompt design', 'System trade-offs', 'Applied reasoning'],
    },
    {
      id: 'data-analytics-sql',
      label: 'Data Analytics with SQL',
      iconKey: 'database',
      blurb: 'Querying, aggregation, and data storytelling.',
      rubricFocus: [
        'Query correctness',
        'Analytical reasoning',
        'Communication',
      ],
    },
  ],
  'product-management': [
    {
      id: 'product-sense',
      label: 'Product Sense',
      iconKey: 'lightbulb',
      blurb: 'Identifying user problems and evaluating solutions.',
      rubricFocus: [
        'User empathy',
        'Solution evaluation',
        'Structured thinking',
      ],
    },
    {
      id: 'metrics-analytics',
      label: 'Metrics & Analytics',
      iconKey: 'chart-line',
      blurb: 'Defining and interpreting product metrics.',
      rubricFocus: ['Metric selection', 'Data interpretation', 'Actionability'],
    },
    {
      id: 'product-case-studies',
      label: 'Product Case Studies',
      iconKey: 'briefcase',
      blurb: 'End-to-end product design and strategy scenarios.',
      rubricFocus: [
        'Structured approach',
        'Trade-off reasoning',
        'Business awareness',
      ],
    },
    {
      id: 'prioritization',
      label: 'Prioritization',
      iconKey: 'list-checks',
      blurb: 'Roadmap trade-offs and stakeholder alignment.',
      rubricFocus: [
        'Framework usage',
        'Trade-off clarity',
        'Stakeholder awareness',
      ],
    },
  ],
  general: [
    {
      id: 'behavioral-hr',
      label: 'Behavioral / HR Round',
      iconKey: 'chat-circle',
      blurb: 'Communication, teamwork, and past-experience questions.',
      rubricFocus: [
        'Clarity of communication',
        'Structured storytelling',
        'Self-awareness',
      ],
    },
  ],
}

export function getCatalogTopicsForDomain(
  domain: InterviewDomain,
): Array<InterviewTopic> {
  return INTERVIEW_TOPIC_CATALOG[domain]
}

export function findCatalogTopicById(
  topicId: string,
): InterviewTopic | undefined {
  for (const topics of Object.values(INTERVIEW_TOPIC_CATALOG)) {
    const found = topics.find((topic) => topic.id === topicId)
    if (found) return found
  }
  return undefined
}
