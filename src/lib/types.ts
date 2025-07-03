export type TaskType = 'overall' | 'code generation' | 'code translation' | 'code summarization' | 'input prediction' | 'output prediction' | 'vulnerability detection' | 'code review' | 'code-web' | 'interaction-2-code' | 'code-robustness' | 'mr-web';

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
  framework?: string[];  // For code-web task
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
  domain?: string;  // Knowledge domain field (math, alg, ds, etc.)
  url?: string;
  framework?: string;  // For code-web task
  category?: string;   // For code-robustness task
  subtask?: string;    // For mr-web task (Visual/RER)
  method?: string;     // For mr-web task (CoT/ZS/SR)
  prompt_category?: string[];  // For reasoning type filtering (direct/cot)
};

export type ProcessedResult = {
  modelId: string;
  modelName: string;
  dataset: string;
  task: string;
  sourceLang: string | null;
  lang: string;
  targetLang: string | null;
  domain?: string; // Knowledge domain field (math, alg, ds, etc.)
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
  // Custom metrics for new tasks
  // code-web and interaction-2-code metrics
  'CLIP'?: number | null;
  'Compilation'?: number | null;
  'SSIM'?: number | null;
  'Text'?: number | null;
  'Position'?: number | null;
  'Implement Rate'?: number | null;
  // code-robustness metrics
  'VAN'?: number | null;
  'REN'?: number | null;
  'RTF'?: number | null;
  'GBC'?: number | null;
  'ALL'?: number | null;
  'MDC'?: number | null;
  'MPS'?: number | null;
  'MHC'?: number | null;
  // mr-web metrics
  'MAE'?: number | null;
  'NEMD'?: number | null;
  'RER'?: number | null;
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
  framework?: string[];  // Add framework for code-web filtering
  showByDifficulty?: boolean;
};