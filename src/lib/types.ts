export type TaskType = 'overall' | 'code generation' | 'code translation' | 'code summarization' | 'input prediction' | 'output prediction' | 'vulnerability detection' | 'code review';

export type LLMJudgeScores = {
  [judge: string]: number | number[];
};

export type Metrics = {
  'pass@1'?: number;
  'pass@3'?: number;
  'pass@5'?: number;
  'CodeBLEU'?: number;
  'LLMJudge'?: LLMJudgeScores | number;
  'gpt-4o'?: number;
  'ExecutionAccuracy'?: number;
  [key: string]: any; // Allow any additional string indices
};

export type Ability = {
  modality: string[];  // Common values might include: 'code', 'text', 'image', 'audio', 'multimodal'
  knowledge: string[];
  reasoning: string[];
  dataset: string[];
  robustness: string[];
  privacy: string[];
  llmJudges?: string[];
};

export type ResultEntry = {
  id: string;
  model_name: string;
  dataset: string;
  task: string;
  source_lang?: string;
  lang: string;
  language?: string;
  target_lang?: string;
  metrics: Metrics;
  difficulty?: string;
  url?: string;
};

export type ProcessedResult = {
  modelId: string;
  modelName: string;
  dataset: string;
  task: string;
  sourceLang: string | null;
  lang: string;
  targetLang: string | null;
  pass1: number | null;
  pass3: number | null;
  pass5: number | null;
  // Difficulty-based metrics
  easyPass1: number | null;
  mediumPass1: number | null;
  hardPass1: number | null;
  easyPass3: number | null;
  mediumPass3: number | null;
  hardPass3: number | null;
  easyPass5: number | null;
  mediumPass5: number | null;
  hardPass5: number | null;
  // Other metrics
  codebleu: number | null;
  llmjudge: number | null;
  executionAccuracy: number | null;
  difficulty?: string | null;
  // 漏洞检测特定指标
  'P-C'?: number | null;
  'P-V'?: number | null;
  'P-B'?: number | null;
  'P-R'?: number | null;
  'Accuracy'?: number | null;
  'Precision'?: number | null;
  'Recall'?: number | null;
  'F1 Score'?: number | null;
};

export type FilterOptions = {
  tasks: string[];
  datasets: string[];
  langs: string[];
  modalities: string[];
  knowledge: string[];
  reasoning: string[];
  robustness: string[];
  security: string[];
  llmJudges?: string[];
  showByDifficulty?: boolean;
};