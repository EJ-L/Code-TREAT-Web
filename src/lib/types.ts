export type TaskType = 'overall' | 'code generation' | 'code translation' | 'code summarization' | 'code execution';

export type LLMJudgeScores = {
  [judge: string]: number;
};

export type Metrics = {
  'pass@1'?: number;
  'pass@3'?: number;
  'pass@5'?: number;
  'CodeBLEU'?: number;
  'LLMJudge'?: LLMJudgeScores | number;
  'ExecutionAccuracy'?: number;
};

export type Ability = {
  modality: string[];
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
  target_lang?: string;
  metrics: Metrics;
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
  codebleu: number | null;
  llmjudge: number | null;
  executionAccuracy: number | null;
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
};