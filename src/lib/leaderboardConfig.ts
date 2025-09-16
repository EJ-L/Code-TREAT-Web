import { TaskType, Ability } from './types';

// Header definition interface
export interface HeaderConfig {
  key: string;
  label: string;
  width: string; // Tailwind width class
  description: string;
  defaultWidth?: number; // Pixel width for dynamic sizing
  minWidth?: number; // Minimum pixel width
}

// Column width configuration interface
export interface ColumnWidthConfig {
  default: number;
  taskSpecific?: Partial<Record<TaskType, number>>;
  minWidth?: number;
  maxWidth?: number;
}

// Base header definitions (reusable across tasks)
export const BASE_HEADERS: Record<string, HeaderConfig> = {
  rank: {
    key: 'rank',
    label: 'Rank',
    width: 'w-32',
    description: '',
    defaultWidth: 150,
    minWidth: 100
  },
  model: {
    key: 'model',
    label: 'Model Name',
    width: 'w-192',
    description: '',
    defaultWidth: 300,
    minWidth: 300
  },
  // Pass metrics
  'pass@1': {
    key: 'pass@1',
    label: 'Pass@1',
    width: 'w-24',
    description: 'Pass@1 is the probability of passing a given problem in one attempt.',
    defaultWidth: 100,
    minWidth: 90
  },
  'pass@3': {
    key: 'pass@3',
    label: 'Pass@3',
    width: 'w-24',
    description: 'Pass@3 is the probability of passing a given problem in three attempts.',
    defaultWidth: 100,
    minWidth: 90
  },
  'pass@5': {
    key: 'pass@5',
    label: 'Pass@5',
    width: 'w-24',
    description: 'Pass@5 is the probability of passing a given problem in five attempts.',
    defaultWidth: 100,
    minWidth: 90
  },
  // Difficulty-based pass metrics (more compact for main leaderboard)
  'easy_pass@1': {
    key: 'easy_pass@1',
    label: 'Easy Pass@1',
    width: 'w-28',
    description: 'Easy Pass@1 on problems with easy difficulty.',
    defaultWidth: 120,
    minWidth: 110
  },
  'medium_pass@1': {
    key: 'medium_pass@1',
    label: 'Medium Pass@1',
    width: 'w-28',
    description: 'Medium Pass@1 on problems with medium difficulty.',
    defaultWidth: 120,
    minWidth: 110
  },
  'hard_pass@1': {
    key: 'hard_pass@1',
    label: 'Hard Pass@1',
    width: 'w-28',
    description: 'Hard Pass@1 on problems with hard difficulty.',
    defaultWidth: 120,
    minWidth: 110
  },
  'easy_pass@3': {
    key: 'easy_pass@3',
    label: 'Easy Pass@3',
    width: 'w-28',
    description: 'Easy Pass@3 on problems with easy difficulty.',
    defaultWidth: 120,
    minWidth: 110
  },
  'medium_pass@3': {
    key: 'medium_pass@3',
    label: 'Medium Pass@3',
    width: 'w-28',
    description: 'Medium Pass@3 on problems with medium difficulty.',
    defaultWidth: 120,
    minWidth: 110
  },
  'hard_pass@3': {
    key: 'hard_pass@3',
    label: 'Hard Pass@3',
    width: 'w-28',
    description: 'Hard Pass@3 on problems with hard difficulty.',
    defaultWidth: 120,
    minWidth: 110
  },
  'easy_pass@5': {
    key: 'easy_pass@5',
    label: 'Easy Pass@5',
    width: 'w-28',
    description: 'Easy Pass@5 on problems with easy difficulty.',
    defaultWidth: 120,
    minWidth: 110
  },
  'medium_pass@5': {
    key: 'medium_pass@5',
    label: 'Medium Pass@5',
    width: 'w-28',
    description: 'Medium Pass@5 on problems with medium difficulty.',
    defaultWidth: 120,
    minWidth: 110
  },
  'hard_pass@5': {
    key: 'hard_pass@5',
    label: 'Hard Pass@5',
    width: 'w-28',
    description: 'Hard Pass@5 on problems with hard difficulty.',
    defaultWidth: 120,
    minWidth: 110
  },
  // Other metrics
  'CodeBLEU': {
    key: 'CodeBLEU',
    label: 'CodeBLEU',
    width: 'w-32',
    description: '',
    defaultWidth: 140,
    minWidth: 90
  },
  'LLM Judge': {
    key: 'LLM Judge',
    label: 'LLM Judge',
    width: 'w-28',
    description: '',
    defaultWidth: 160,
    minWidth: 100
  },
  // Vulnerability detection metrics
  'Accuracy': {
    key: 'Accuracy',
    label: 'Accuracy',
    width: 'w-24',
    description: '',
    defaultWidth: 200,
    minWidth: 80
  },
  'Precision': {
    key: 'Precision',
    label: 'Precision',
    width: 'w-24',
    description: '',
    defaultWidth: 210,
    minWidth: 80
  },
  'Recall': {
    key: 'Recall',
    label: 'Recall',
    width: 'w-24',
    description: '',
    defaultWidth: 180,
    minWidth: 80
  },
  'F1 Score': {
    key: 'F1 Score',
    label: 'F1 Score',
    width: 'w-24',
    description: '',
    defaultWidth: 200,
    minWidth: 80
  },
  'P-C': {
    key: 'P-C',
    label: 'P-C',
    width: 'w-16',
    description: 'Correctly predicts both elements',
    defaultWidth: 140,
    minWidth: 60
  },
  'P-V': {
    key: 'P-V',
    label: 'P-V',
    width: 'w-16',
    description: 'Both predicted as vulnerable',
    defaultWidth: 140,
    minWidth: 60
  },
  'P-B': {
    key: 'P-B',
    label: 'P-B',
    width: 'w-16',
    description: 'Both predicted as benign',
    defaultWidth: 140,
    minWidth: 60
  },
  'P-R': {
    key: 'P-R',
    label: 'P-R',
    width: 'w-16',
    description: 'Inversely predicted labels',
    defaultWidth: 140,
    minWidth: 60
  },
  // Code-web metrics
  'CLIP': {
    key: 'CLIP',
    label: 'CLIP',
    width: 'w-24',
    description: 'CLIP score for image similarity',
    defaultWidth: 130,
    minWidth: 80
  },
  'Compilation': {
    key: 'Compilation',
    label: 'Compilation',
    width: 'w-28',
    description: 'Code compilation success rate',
    defaultWidth: 220,
    minWidth: 100
  },
  // Interaction-2-code metrics
  'SSIM': {
    key: 'SSIM',
    label: 'SSIM',
    width: 'w-24',
    description: 'Structural similarity index',
    defaultWidth: 110,
    minWidth: 80
  },
  'Text': {
    key: 'Text',
    label: 'Text',
    width: 'w-24',
    description: 'Text accuracy score',
    defaultWidth: 110,
    minWidth: 80
  },
  'Position': {
    key: 'Position',
    label: 'Position',
    width: 'w-24',
    description: 'Position accuracy score',
    defaultWidth: 150,
    minWidth: 100
  },
  'Implement Rate': {
    key: 'Implement Rate',
    label: 'Implement Rate',
    width: 'w-36',
    description: 'Implementation success rate',
    defaultWidth: 230,
    minWidth: 150
  },
  // Code-robustness metrics
  'VAN': {
    key: 'VAN',
    label: 'VAN',
    width: 'w-24',
    description: 'Variable Name robustness score',
    defaultWidth: 145,
    minWidth: 80
  },
  'ALL': {
    key: 'ALL',
    label: 'ALL',
    width: 'w-24',
    description: 'All transformations robustness score',
    defaultWidth: 145,
    minWidth: 80
  },
  'MDC': {
    key: 'MDC',
    label: 'MDC',
    width: 'w-24',
    description: 'Missing Docstring Comment robustness score',
    defaultWidth: 145,
    minWidth: 80
  },
  'MPS': {
    key: 'MPS',
    label: 'MPS',
    width: 'w-24',
    description: 'Missing Parameter Specification robustness score',
    defaultWidth: 145,
    minWidth: 80
  },
  'MHC': {
    key: 'MHC',
    label: 'MHC',
    width: 'w-26',
    description: 'Missing Header Comment robustness score',
    defaultWidth: 145,
    minWidth: 80
  },
  // MR-Web metrics
  'MAE': {
    key: 'MAE',
    label: 'MAE',
    width: 'w-24',
    description: 'Mean Absolute Error',
    defaultWidth: 115,
    minWidth: 80
  },
  'NEMD': {
    key: 'NEMD',
    label: 'NEMD',
    width: 'w-24',
    description: 'Normalized Edit Distance',
    defaultWidth: 130,
    minWidth: 80
  },
  'RER': {
    key: 'RER',
    label: 'RER',
    width: 'w-24',
    description: 'Request Element Recognition',
    defaultWidth: 115,
    minWidth: 80
  },
  // Overall leaderboard metrics
  'score': {
    key: 'score',
    label: 'Average Score',
    width: 'w-32',
    description: 'Average score across all tasks',
    defaultWidth: 140,
    minWidth: 120
  },
  'tasks': {
    key: 'tasks',
    label: 'Tasks',
    width: 'w-24',
    description: 'Number of tasks completed',
    defaultWidth: 100,
    minWidth: 80
  },
  // Unit Test Generation metrics
  'Vanilla': {
    key: 'Vanilla',
    label: 'Vanilla',
    width: 'w-24',
    description: 'Vanilla baseline performance metric',
    defaultWidth: 180,
    minWidth: 140
  },
  'PSC-ALL': {
    key: 'PSC-ALL',
    label: 'PSC-ALL',
    width: 'w-28',
    description: 'Aggregated Program Structure-Consistent Perturbation',
    defaultWidth: 180,
    minWidth: 120
  },
  'MCC': {
    key: 'MCC',
    label: 'MCC',
    width: 'w-24',
    description: 'Contextual-Level Misleading Code Comments',
    defaultWidth: 160,
    minWidth: 100
  }
};

// Column width configurations with task-specific overrides
export const COLUMN_WIDTH_CONFIG: Record<string, ColumnWidthConfig> = {
  rank: {
    default: 150,
    minWidth: 100,
    maxWidth: 200
  },
  model: {
    default: 300,
    taskSpecific: {
      'overall': 600,
      'code summarization': 300,
      'code review': 300,
      'code generation': 300,
      'code translation': 300,
      'input prediction': 300,
      'output prediction': 300,
      'vulnerability detection': 350,
      'code-web': 360,
      'interaction-2-code': 220,
      'code-robustness': 400,
      'mr-web': 300
    },
    minWidth: 300,
    maxWidth: 600
  },
  'LLM Judge': {
    default: 160,
    taskSpecific: {
      'code summarization': 370,
      'code review': 370
    },
    minWidth: 100,
    maxWidth: 500
  },
  'pass@1': {
    default: 130,
    taskSpecific: {
      'code generation': 130,
      'code translation': 130,
      'input prediction': 130,
      'output prediction': 130
    },
    minWidth: 90,
    maxWidth: 150
  },
  'pass@3': {
    default: 100,
    taskSpecific: {
      'code generation': 100,
      'code translation': 100,
      'input prediction': 100,
      'output prediction': 100
    },
    minWidth: 90,
    maxWidth: 150
  },
  'pass@5': {
    default: 100,
    taskSpecific: {
      'code generation': 100,
      'code translation': 100,
      'input prediction': 100,
      'output prediction': 100
    },
    minWidth: 90,
    maxWidth: 150
  },
  'Compilation': {
    default: 200,
    taskSpecific: {
      'code-web': 180
    },
    minWidth: 100,
    maxWidth: 300
  },
  'CLIP': {
    default: 130,
    taskSpecific: {
      'interaction-2-code': 150
    },
    minWidth: 80,
    maxWidth: 250
  },
  'SSIM': {
    default: 110,
    taskSpecific: {
      'interaction-2-code': 150
    },
    minWidth: 80,
    maxWidth: 250
  },
  'Text': {
    default: 110,
    taskSpecific: {
      'interaction-2-code': 150
    },
    minWidth: 80,
    maxWidth: 250
  },
  'Position': {
    default: 150,
    taskSpecific: {
      'interaction-2-code': 210
    },
    minWidth: 100,
    maxWidth: 300
  },
  'Implement Rate': {
    default: 230,
    taskSpecific: {
      'interaction-2-code': 270
    },
    minWidth: 150,
    maxWidth: 400
  },
  // Difficulty metric configurations (more compact)
  'easy_pass@1': { default: 120, minWidth: 110, maxWidth: 180 },
  'medium_pass@1': { default: 120, minWidth: 110, maxWidth: 180 },
  'hard_pass@1': { default: 120, minWidth: 110, maxWidth: 180 },
  'easy_pass@3': { default: 120, minWidth: 110, maxWidth: 180 },
  'medium_pass@3': { default: 120, minWidth: 110, maxWidth: 180 },
  'hard_pass@3': { default: 120, minWidth: 110, maxWidth: 180 },
  'easy_pass@5': { default: 120, minWidth: 110, maxWidth: 180 },
  'medium_pass@5': { default: 120, minWidth: 110, maxWidth: 180 },
  'hard_pass@5': { default: 120, minWidth: 110, maxWidth: 180 }
};

// Task-specific header configurations
export const TASK_HEADERS: Record<TaskType, string[]> = {
  'overall': [],
  'code generation': [
    'pass@1', 'pass@3', 'pass@5',
    'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
    'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
    'easy_pass@5', 'medium_pass@5', 'hard_pass@5'
  ],
  'code translation': [
    'pass@1', 'pass@3', 'pass@5', 'CodeBLEU',
    'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
    'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
    'easy_pass@5', 'medium_pass@5', 'hard_pass@5'
  ],
  'code summarization': ['LLM Judge'],
  'code review': ['LLM Judge'],
  'input prediction': [
    'pass@1', 'pass@3', 'pass@5',
    'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
    'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
    'easy_pass@5', 'medium_pass@5', 'hard_pass@5'
  ],
  'output prediction': [
    'pass@1', 'pass@3', 'pass@5',
    'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
    'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
    'easy_pass@5', 'medium_pass@5', 'hard_pass@5'
  ],
  'vulnerability detection': ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'P-C', 'P-V', 'P-B', 'P-R'],
  'code-web': ['CLIP', 'Compilation'],
  'interaction-2-code': ['CLIP', 'SSIM', 'Text', 'Position', 'Implement Rate'],
  'code-robustness': ['VAN', 'ALL', 'MDC', 'MPS', 'MHC'],
  'mr-web': ['MAE', 'NEMD', 'CLIP', 'RER'],
  'unit test generation': ['Vanilla', 'PSC-ALL', 'MCC', 'MPS', 'MHC']
};

// Difficulty-based header configurations
export const DIFFICULTY_HEADERS: Record<TaskType, string[]> = {
  'overall': [],
  'code generation': [
    'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
    'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
    'easy_pass@5', 'medium_pass@5', 'hard_pass@5'
  ],
  'code translation': [
    'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
    'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
    'easy_pass@5', 'medium_pass@5', 'hard_pass@5',
    'CodeBLEU'
  ],
  'code summarization': ['LLM Judge'],
  'code review': ['LLM Judge'],
  'input prediction': [
    'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
    'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
    'easy_pass@5', 'medium_pass@5', 'hard_pass@5'
  ],
  'output prediction': [
    'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
    'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
    'easy_pass@5', 'medium_pass@5', 'hard_pass@5'
  ],
  'vulnerability detection': ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'P-C', 'P-V', 'P-B', 'P-R'],
  'code-web': ['CLIP', 'Compilation'],
  'interaction-2-code': ['CLIP', 'SSIM', 'Text', 'Position', 'Implement Rate'],
  'code-robustness': ['VAN', 'ALL', 'MDC', 'MPS', 'MHC'],
  'mr-web': ['MAE', 'NEMD', 'CLIP', 'RER'],
  'unit test generation': ['Vanilla', 'PSC-ALL', 'MCC', 'MPS', 'MHC']
};

// Tasks that support difficulty-based results
export const TASKS_WITH_DIFFICULTY = [
  'overall', 'code generation', 'code translation', 'input prediction', 'output prediction'
];

// Multi-leaderboard configuration
export interface MultiLeaderboardConfig {
  extractedFilter: keyof Ability | 'dataset' | 'framework' | 'task';
  overallTab: string;
  tabs: string[];
}

export const MULTI_LEADERBOARD_CONFIG: Partial<Record<TaskType, MultiLeaderboardConfig>> = {
  'code generation': {
    extractedFilter: 'modality',
    overallTab: 'All',
    tabs: ['All', 'Python', 'Java']
  },
  'code translation': {
    extractedFilter: 'modality',
    overallTab: 'All',
    tabs: ['All', 'Python', 'Java']
  },
  'code summarization': {
    extractedFilter: 'modality',
    overallTab: 'All',
    tabs: ['All', 'Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go']
  },
  'code review': {
    extractedFilter: 'modality',
    overallTab: 'All',
    tabs: ['All', 'Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go']
  },
  'input prediction': {
    extractedFilter: 'modality',
    overallTab: 'All',
    tabs: ['All', 'Python', 'Java']
  },
  'output prediction': {
    extractedFilter: 'modality',
    overallTab: 'All',
    tabs: ['All', 'Python', 'Java']
  },
  'vulnerability detection': {
    extractedFilter: 'dataset',
    overallTab: 'All',
    tabs: ['All', 'PrimeVul', 'PrimeVulPairs']
  },
  'code-web': {
    extractedFilter: 'framework',
    overallTab: 'All',
    tabs: ['All', 'React', 'Vue', 'Angular', 'Vanilla']
  },
  'mr-web': {
    extractedFilter: 'knowledge',
    overallTab: 'All',
    tabs: ['All', 'Visual', 'RER']
  },
  'code-robustness': {
    extractedFilter: 'dataset',
    overallTab: 'All',
    tabs: ['All', 'Merge', 'CRUXEval', 'LiveCodeBench (CE)']
  },
  'unit test generation': {
    extractedFilter: 'dataset',
    overallTab: 'All',
    tabs: ['All', 'HackerRank', 'GeeksforGeeks', 'Merged']
  }
};

// Helper function to check if a task supports multi-leaderboard
export function isMultiLeaderboardTask(task: TaskType): boolean {
  return task in MULTI_LEADERBOARD_CONFIG;
}

// Helper function to get multi-leaderboard config for a task
export function getMultiLeaderboardConfig(task: TaskType): MultiLeaderboardConfig | null {
  return MULTI_LEADERBOARD_CONFIG[task] || null;
}

// Helper functions
export function getTaskHeaders(task: TaskType): HeaderConfig[] {
  const commonHeaders = ['rank', 'model'];
  
  // Always use the standard task headers (which now include difficulty metrics for relevant tasks)
  const headerKeys = [...commonHeaders, ...(TASK_HEADERS[task] || [])];
  
  return headerKeys.map(key => BASE_HEADERS[key]).filter(Boolean);
}

export function getColumnWidth(task: TaskType, headerKey: string): number {
  const config = COLUMN_WIDTH_CONFIG[headerKey];
  if (config) {
    return config.taskSpecific?.[task] || config.default;
  }
  
  const baseHeader = BASE_HEADERS[headerKey];
  if (baseHeader?.defaultWidth) {
    return baseHeader.defaultWidth;
  }
  
  // Fallback calculation
  return Math.max(100, (baseHeader?.label.length || 4) * 12 + 40);
}

export function getMinColumnWidth(task: TaskType, headerKey: string): number {
  const config = COLUMN_WIDTH_CONFIG[headerKey];
  if (config?.minWidth) {
    return config.minWidth;
  }
  
  const baseHeader = BASE_HEADERS[headerKey];
  if (baseHeader?.minWidth) {
    return baseHeader.minWidth;
  }
  
  // Special cases
  if (headerKey === 'model') {
    if (task === 'overall') return 800;
    if (task === 'code-web') return 320;
    if (task === 'output prediction' || task === 'input prediction') return 350;
    return 300;
  }
  
  // Fallback calculation
  return Math.max(40, (baseHeader?.label.length || 4) * 8 + 24);
}

export function getMaxColumnWidth(task: TaskType, headerKey: string): number {
  const config = COLUMN_WIDTH_CONFIG[headerKey];
  if (config?.maxWidth) {
    return config.maxWidth;
  }
  
  // Special cases for model column
  if (headerKey === 'model') {
    if (task === 'overall') return 1200; // Allow larger width for overall
    return 600; // Default max for model column
  }
  
  // Default maximum widths based on column types
  if (['pass@1', 'pass@3', 'pass@5', 'LLM Judge', 'CodeBLEU', 'Execution'].includes(headerKey)) {
    return 500;
  }
  
  if (['Accuracy', 'Precision', 'Recall', 'F1 Score'].includes(headerKey)) {
    return 300;
  }
  
  // Fallback: generous max width
  return 400;
}

export function getStickyColumnTasks(): TaskType[] {
  return [
    'vulnerability detection', 'code-robustness',
    'interaction-2-code'
  ];
}

export function shouldUseSticky(task: TaskType): boolean {
  return !getStickyColumnTasks().includes(task);
}

// Sorting configuration
export const HIGH_TO_LOW_METRICS = [
  'pass@1', 'pass@3', 'pass@5', 
  'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
  'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
  'easy_pass@5', 'medium_pass@5', 'hard_pass@5',
  'CodeBLEU', 'LLMJudge', 'llmjudge', 'LLM Judge', 'Execution',
  'Accuracy', 'Precision', 'Recall', 'F1 Score',
  'P-C', 'P-V', 'P-B', 'P-R',
  'CLIP', 'Compilation',
  'SSIM', 'Text', 'Position', 'Implement Rate',
  'VAN', 'REN', 'RTF', 'GBC', 'ALL', 'MDC', 'MPS', 'MHC',
  'MAE', 'NEMD', 'RER',
  'Vanilla', 'PSC-ALL', 'MCC'
];

export function getDefaultSortDirection(key: string): 'asc' | 'desc' {
  if (key === 'rank' || key === 'model') {
    return 'asc';
  }
  return HIGH_TO_LOW_METRICS.includes(key) ? 'desc' : 'asc';
} 