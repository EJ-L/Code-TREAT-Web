// Model URL mappings for the leaderboard
export const MODEL_URLS: Record<string, string> = {
  // Meta models
  "Meta-Llama-3.1-8B-Instruct": "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct",
  "Meta-Llama-3.1-70B-Instruct": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct",
  "Llama-3.3-70B-Instruct": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct",
  "Llama-4-Scout-17B-16E": "https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct",
  "Llama-3.1-70B": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct",
  "Llama-3.1-8B": "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct",
  "Llama3.3-70B-Instruct": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct",
  "LLaMA-3.1-405B-Instruct": "https://huggingface.co/meta-llama/Llama-3.1-405B-Instruct",
  "Llama-3.2-90B-Vision": "https://huggingface.co/meta-llama/Llama-3.2-90B-Vision",
  "Llama-3.2-11B-Vision": "https://huggingface.co/meta-llama/Llama-3.2-11B-Vision",

  // OpenAI models
  "gpt-4-turbo": "https://openai.com/index/new-models-and-developer-products-announced-at-devday/",
  "gpt-4o": "https://openai.com/index/hello-gpt-4o/",
  "gpt-3.5": "https://openai.com/index/gpt-3-5-turbo-fine-tuning-and-api-updates/",
  "o3": "https://openai.com/index/openai-o3-mini/",
  "o4-mini": "https://openai.com/index/introducing-o3-and-o4-mini/",
  "gpt-4.1": "https://openai.com/index/gpt-4-1/",
  "GPT-5": "https://openai.com/index/introducing-gpt-5/",
  "GPT-OSS-120B": "https://openai.com/index/introducing-gpt-oss/",

  // Anthropic models
  "claude-3.5-sonnet": "https://www.anthropic.com/news/claude-3-5-sonnet",
  "claude-3-5-sonnet": "https://www.anthropic.com/news/claude-3-5-sonnet",
  "claude-3.5-haiku": "https://www.anthropic.com/news/3-5-models-and-computer-use",
  "claude-3-5-haiku": "https://www.anthropic.com/news/3-5-models-and-computer-use",
  "claude-3.7-sonnet": "https://www.anthropic.com/news/claude-3-7-sonnet",
  "claude-3.7": "https://www.anthropic.com/news/claude-3-7-sonnet",
  "Claude-4-Sonnet": "https://www.anthropic.com/news/claude-4",

  // DeepSeek models
  "deepseek-v3": "https://github.com/deepseek-ai/DeepSeek-V3",
  "deepseek-r1": "https://github.com/deepseek-ai/DeepSeek-R1",
  "deepseek-chat": "https://chat.deepseek.com/",

  // Gemini models
  "gemini-1.5-pro": "https://developers.googleblog.com/zh-hans/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/",
  "gemini-1.5-flash": "https://developers.googleblog.com/en/gemini-15-pro-and-15-flash-now-available/",
  "Gemini-2.0-flash": "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-0-flash",
  "gemini-2.0": "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-0-flash",
  "Gemini-2.5-Pro": "https://deepmind.google/models/gemini/pro/",
  "Gemini-2.5-Flash": "https://deepmind.google/models/gemini/flash/",

  // Gemma models
  "gemma-2-27b-it": "https://huggingface.co/google/gemma-2-27b-it",
  "gemma-2-9b-it": "https://huggingface.co/google/gemma-2-9b-it",
  "gemma-3-27b": "https://huggingface.co/google/gemma-3-27b-it",

  // Qwen models
  "Qwen-2.5-72B-Instruct": "https://huggingface.co/Qwen/Qwen2.5-72B-Instruct",
  "Qwen-2.5-Coder-32B-Instruct": "https://qwenlm.github.io/zh/blog/qwen2.5-coder-family/",
  "QwQ-32B": "https://qwenlm.github.io/zh/blog/qwq-32b/",
  "Qwen-2.5-32B": "https://huggingface.co/Qwen/Qwen2.5-32B-Instruct",
  "Qwen-3-32B": "https://huggingface.co/Qwen/Qwen3-32B",
  "Qwen-3-30B-A3B": "https://huggingface.co/Qwen/Qwen3-30B-A3B",
  "Qwen-3-235B-A22B": "https://huggingface.co/Qwen/Qwen3-235B-A22B",
  "Qwen-2.5-vl-72B": "https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct",
  "Qwen-2.5-vl-7B": "https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct",
  "Qwen-2.5-vl-32B": "https://huggingface.co/Qwen/Qwen2.5-VL-32B-Instruct",
  "Qwen-7B": "https://huggingface.co/Qwen/Qwen-7B",
  "Qwen-72B": "https://huggingface.co/Qwen/Qwen-72B",
  "Qwen-2.5-7B-Instruct": "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct",
  "Qwen-2.5-14B-Instruct": "https://huggingface.co/Qwen/Qwen2.5-14B-Instruct",
  "Qwen-2.5-VL-3B-Instruct": "https://huggingface.co/Qwen/Qwen2.5-VL-3B-Instruct",

  // Grok models
  "grok-3-mini": "https://x.ai/news/grok-3",

  // Pixtral models
  "Pixtral-12B": "https://huggingface.co/mistralai/Pixtral-12B-2409",
  "Pixtral-Large-Instruct-124B": "https://huggingface.co/mistralai/Pixtral-Large-Instruct-2411",

  // Other models - add more as needed
  "baseline": "#"
};

/**
 * Helper function to get the URL for a model based on partial matching
 * @param modelName The full model name (e.g., "gpt-4o-2024-11-20")
 * @returns The URL for the model or undefined if no match found
 */
export function getModelUrl(modelName: string): string | undefined {
  if (!modelName) return undefined;
  
  const lowerModelName = modelName.toLowerCase();
  
  // Check for exact matches first
  if (MODEL_URLS[lowerModelName]) {
    return MODEL_URLS[lowerModelName];
  }
  
  // Then check for partial matches
  for (const [baseModel, url] of Object.entries(MODEL_URLS)) {
    if (lowerModelName.includes(baseModel.toLowerCase())) {
      return url;
    }
  }
  
  return undefined;
}


/**
 * Get the base model name by stripping (CoT) suffix if present
 * Used for looking up publish dates when CoT variant dates aren't available
 */
export function getBaseModelName(modelName: string): string {
  if (!modelName) return modelName;
  // Remove (CoT) suffix if present
  return modelName.replace(/\s*\(CoT\)$/, '');
}

// Model publish dates (YYYY-MM-DD format)
export const MODEL_PUBLISH_DATES: Record<string, string> = {
  // OpenAI Models
  'GPT-3.5-turbo-0125': '2024-01-25',
  'GPT-4-turbo-2024-04-09': '2024-04-09',
  'GPT-4o-2024-11-20': '2024-11-20',
  'GPT-4.1-2025-04-14': '2025-04-14', // Future model for testing
  'GPT-4o-20240806': '2024-08-06',
  'o3-mini (Med)': '2025-04-16',
  'o3-mini (High)': '2025-04-16',
  'o3-mini (Low)': '2025-04-16',
  'o4-mini (Med)': '2025-04-16',
  'o4-mini (High)': '2025-04-16',
  'o4-mini (Low)': '2025-04-16',
  'GPT-4o': '2023-04-11',
  'Gpt-4o-mini': '2024-07-18',
  'GPT-4o-Mini': '2024-07-18',
  'GPT-5': '2025-08-07',
  'GPT-4.1': '2025-04-14',
  'GPT-OSS-120B': '2025-08-25',
  
  // Claude Models
  'Claude-3.5-Sonnet-20241022': '2024-10-22',
  'Claude-3.5-Sonnet': '2024-10-22',
  'Claude-3.5-Sonnet-20240620': '2024-06-20',
  'Claude-4-Sonnet': '2025-05-22',
  'Claude-3.7-Sonnet': '2025-02-24',
  'Claude-3.5-Haiku-20241022': '2024-10-22',

  // Llama Models
  'Llama-3.3-70B-Instruct': '2024-12-06',
  'Llama3.3-70B-Instruct': '2024-12-06',
  'LLaMA-3.3-70B-Instruct': '2024-12-06',
  'Llama-3.1-70B-Instruct': '2024-07-23',
  'LLaMA-3.1-70B-Instruct': '2024-07-23',
  'LLaMA-3.1-8B-Instruct': '2024-07-23',
  'Llama-3.1-405B-Instruct': '2024-07-23',
  'Llama-3.1-8B-Instruct': '2024-07-23',
  'Llama-4-Scout-17B-16E-Instruct': '2025-04-05',
  'Llama-3.2-90B-Vision': '2025-09-25',
  'Llama-3.2-11B-Vision': '2025-09-25',

  // Qwen Models
  'Qwen-3-235B-A22B': '2025-04-29',
  'Qwen-3-30B-A3B': '2025-04-29',
  'Qwen-3-32B': '2025-04-29',
  'Qwen-2.5-72B-Instruct': '2024-09-19',
  'Qwen-2.5-7B-Instruct': '2024-09-19',
  'Qwen-2.5-32B-Instruct': '2024-09-19',
  'Qwen-2.5-14B-Instruct': '2024-09-19',
  'Qwen-2.5-Coder-32B-Instruct': '2024-09-19',
  'Qwen-2.5-32B-Coder-Instruct': '2024-09-19',
  'QwQ-32B': '2025-03-10',
  'Qwen-72B': '2023-11-30',
  'Qwen-7B': '2023-11-30',
  'Qwen-2.5-VL-72B-Instruct': '2025-01-28',
  'Qwen-2.5-VL-7B-Instruct': '2025-01-28',
  'Qwen-2.5-VL-3B-Instruct': '2025-01-28',

  // Grok Models
  'Grok-3-Mini (High)': '2025-02-17',

  // DeepSeek Models
  'DeepSeek-R1': '2025-01-20',
  'DeepSeek-R1 (0528)': '2025-05-28',
  'DeepSeek-V3': '2024-12-26',

  // Gemini Models
  'Gemma-3-27B-Instruct': '2025-03-12',
  'Gemini-2.5-Pro-Preview-05-06': '2024-05-06',
  'Gemini-2.5-Pro': '2024-05-06',
  'Gemini-2.5-Flash': '2025-08-26',
  'Gemini-2.0-Flash': '2024-11-20',
  'Gemini-2.0-Pro': '2025-02-25',
  'Gemini-1.5-Pro': '2024-09-24',
  'Gemini-1.5-Flash': '2024-09-24',
  
  // Pixtral Models
  'Pixtral-Large-Instruct-124B': '2024-11-18',
  'Pixtral-12B-2409': '2024-09-17',

  // CoT (Chain-of-Thought) model variants - same dates as base models
  'GPT-4o (CoT)': '2023-04-11',
  'GPT-4o-mini (CoT)': '2024-07-18',
  'Claude-3.5-Sonnet-20241022 (CoT)': '2024-10-22',
  'Claude-3.5-Haiku-20241022 (CoT)': '2024-10-22',
  'Llama-3.3-70B-Instruct (CoT)': '2024-12-06',
  'Llama-3.1-70B-Instruct (CoT)': '2024-07-23',
  'Llama-3.1-405B-Instruct (CoT)': '2024-07-23',
  'Llama-3.1-8B-Instruct (CoT)': '2024-07-23',
  'Qwen2.5-72B-Instruct (CoT)': '2024-09-19',
  'Qwen2.5-7B-Instruct (CoT)': '2024-09-19',
  'Qwen2.5-32B-Instruct (CoT)': '2024-09-19',
  'Qwen2.5-14B-Instruct (CoT)': '2024-09-19',
  'Qwen2.5-Coder-32B-Instruct (CoT)': '2024-09-19',
  'DeepSeek-V3 (CoT)': '2024-12-26',
  'Gemini-2.0-Flash (CoT)': '2024-11-20',
  'Gemini-1.5-Pro-002 (CoT)': '2024-09-24',
  'Gemini-1.5-Flash (CoT)': '2024-09-24',

  // Models from renewed precomputed datasets (exact naming)
  'o3-mini': '2025-04-16',
  'o4-mini': '2025-04-16',
  'gpt-4.1-2025-04-14': '2025-04-14',
  'gpt-4o-2024-11-20': '2024-11-20',
  'gpt-4-turbo-2024-04-09': '2024-04-09',
  'claude-3-5-sonnet-20241022': '2024-10-22',
  'deepseek-chat': '2024-12-26',
  'deepseek/deepseek-r1:free': '2025-01-20',
  'grok-3-mini-beta': '2025-02-17',
  'meta-llama/Llama-3.3-70B-Instruct': '2024-12-06'

};

// Model sizes (parameter count)
export const MODEL_SIZES: Record<string, string> = {
  // Llama Models
  'Llama-3.1-8B-Instruct': '8B',
  'Llama-3.1-70B-Instruct': '70B',
  'Llama-3.1-405B-Instruct': '405B',
  'Llama-3.3-70B-Instruct': '70B',
  'Llama3.3-70B-Instruct': '70B',
  'Llama-4-Scout-17B-16E-Instruct': '17B',
  'Llama-3.2-90B-Vision': '90B',
  'Llama-3.2-11B-Vision': '11B',
  
  // Qwen Models
  'Qwen-7B': '7B',
  'Qwen-72B': '72B',
  'Qwen2.5-7B-Instruct': '7B',
  'Qwen2.5-14B-Instruct': '14B',
  'Qwen2.5-32B-Instruct': '32B',
  'Qwen2.5-72B-Instruct': '72B',
  'Qwen2.5-Coder-32B-Instruct': '32B',
  'Qwen2.5-VL-3B-Instruct': '3B',
  'Qwen2.5-VL-7B-Instruct': '7B',
  'Qwen2.5-VL-72B-Instruct': '72B',
  'QwQ-32B': '32B',
  'Qwen3-30B-A3B': '30B',
  'Qwen3-32B': '32B',
  'Qwen3-235B-A22B': '235B',
  
  // Gemma Models
  'Gemma-3-27B-Instruct': '27B',
  
  // Pixtral Models
  'Pixtral-12B-2409': '12B',
  'Pixtral-Large-Instruct-124B': '124B',
  
  // CoT (Chain-of-Thought) model variants - same sizes as base models
  'Llama-3.1-8B-Instruct (CoT)': '8B',
  'Llama-3.1-70B-Instruct (CoT)': '70B',
  'Llama-3.1-405B-Instruct (CoT)': '405B',
  'Llama-3.3-70B-Instruct (CoT)': '70B',
  'Qwen2.5-7B-Instruct (CoT)': '7B',
  'Qwen2.5-14B-Instruct (CoT)': '14B',
  'Qwen2.5-32B-Instruct (CoT)': '32B',
  'Qwen2.5-72B-Instruct (CoT)': '72B',
  'Qwen2.5-Coder-32B-Instruct (CoT)': '32B',

  // DeepSeek Models
  'DeepSeek-R1': '671B',
  'DeepSeek-R1 (0528)': '671B',
  'DeepSeek-V3': '685B',
  'DeepSeek-V3 (CoT)': '685B',
};

/**
 * Helper function to get the model size for a model
 * @param modelName The model name
 * @returns The model size string (e.g., "7B") or undefined if not available
 */
export function getModelSize(modelName: string): string | undefined {
  if (!modelName) return undefined;
  
  // Check for exact match first
  if (MODEL_SIZES[modelName]) {
    return MODEL_SIZES[modelName];
  }
  
  // For CoT models, try to find the base model size
  const baseModelName = getBaseModelName(modelName);
  if (baseModelName !== modelName && MODEL_SIZES[baseModelName]) {
    return MODEL_SIZES[baseModelName];
  }
  
  return undefined;
}

// Dataset release dates (YYYY-MM-DD format)
export const DATASET_RELEASE_DATES: Record<string, string> = {
  'vulnerability detection': '2024-03-27', // PrimeVul dataset release date
  // 'code generation': '2021-07-07', // HumanEval release date
  // 'code translation': '2021-07-07', // Based on HumanEval
  // 'code summarization': '2023-12-01', // GitHub dataset collection date
  // 'code review': '2023-12-01', // GitHub dataset collection date
  // 'input prediction': '2021-07-07', // Based on HumanEval
  // 'output prediction': '2021-07-07', // Based on HumanEval
  // 'code-robustness': '2023-06-15', // CodeCrash dataset
  // 'code-web': '2024-09-15', // DesignBench dataset
  // 'interaction-2-code': '2024-11-03', // Interaction2Code dataset
  // 'mr-web': '2024-12-13', // MR-Web dataset
  // 'overall': '2021-07-07', // Based on oldest dataset
};

// Dataset-specific release dates for code translation
export const CODE_TRANSLATION_DATASET_RELEASE_DATES: Record<string, string> = {
  'polyhumaneval': '2024-10-24', // PolyHumanEval dataset release date
  // 'hackerrank': No data leakage checking
};

// Helper function to check if data leakage detection should be enabled for code translation
export function shouldEnableCodeTranslationDataLeakage(selectedDatasets: string[]): boolean {
  console.log('DEBUG: shouldEnableCodeTranslationDataLeakage called with:', selectedDatasets);
  
  // If no datasets selected or empty array, check all datasets (default behavior)
  if (!selectedDatasets || selectedDatasets.length === 0) {
    console.log('DEBUG: No datasets selected, returning false');
    return false; // When all datasets are shown, don't enable data leakage detection
  }
  
  // Data leakage detection is enabled only if:
  // 1. PolyHumanEval is selected AND HackerRank is NOT selected
  // 2. OR only PolyHumanEval is selected
  const hasPolyHumanEval = selectedDatasets.some(dataset => dataset.toLowerCase() === 'polyhumaneval');
  const hasHackerRank = selectedDatasets.some(dataset => {
    const lower = dataset.toLowerCase();
    return lower === 'hackerrank' || lower === 'hr';
  });
  
  console.log('DEBUG: hasPolyHumanEval:', hasPolyHumanEval, 'hasHackerRank:', hasHackerRank);
  
  // Enable data leakage detection only if PolyHumanEval is selected and HackerRank is not
  const result = hasPolyHumanEval && !hasHackerRank;
  console.log('DEBUG: shouldEnableCodeTranslationDataLeakage result:', result);
  return result;
}

// Helper function to check if a model has data leakage
export function hasDataLeakage(modelName: string, taskName: string, datasetName?: string): boolean {
  const modelPublishDate = MODEL_PUBLISH_DATES[modelName];
  
  // Skip data leak checking if model publish date is missing
  if (!modelPublishDate) {
    return false;
  }
  
  let datasetReleaseDate: string | undefined;
  
  // For code translation, use dataset-specific release dates
  if (taskName === 'code translation' && datasetName) {
    datasetReleaseDate = CODE_TRANSLATION_DATASET_RELEASE_DATES[datasetName];
  } else {
    datasetReleaseDate = DATASET_RELEASE_DATES[taskName];
  }
  
  // Skip data leak checking if dataset release date is not available
  if (!datasetReleaseDate) {
    return false;
  }
  
  // Convert dates to Date objects for comparison
  const modelDate = new Date(modelPublishDate);
  const datasetDate = new Date(datasetReleaseDate);
  
  // Model is potentially leaked if published after dataset release
  return modelDate > datasetDate;
} 