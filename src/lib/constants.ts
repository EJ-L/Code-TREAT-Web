// Model URL mappings for the leaderboard
export const MODEL_URLS: Record<string, string> = {
  // Meta models
  "Meta-Llama-3.1-8B-Instruct": "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct",
  "Meta-Llama-3.1-70B-Instruct": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct",
  "Llama-3.3-70B-Instruct": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct",
  "Llama-4-Scout-17B-16E": "https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct",

  // OpenAI models
  "gpt-4-turbo": "https://openai.com/index/new-models-and-developer-products-announced-at-devday/",
  "gpt-4o": "https://openai.com/index/hello-gpt-4o/",
  "gpt-3.5": "https://openai.com/index/gpt-3-5-turbo-fine-tuning-and-api-updates/",
  "o3": "https://openai.com/index/openai-o3-mini/",
  "o4-mini": "https://openai.com/index/introducing-o3-and-o4-mini/",
  "gpt-4.1": "https://openai.com/index/gpt-4-1/",

  // Anthropic models
  "claude-3.5-sonnet": "https://www.anthropic.com/news/claude-3-5-sonnet",
  "claude-3-5-sonnet": "https://www.anthropic.com/news/claude-3-5-sonnet",
  "claude-3.5-haiku": "https://www.anthropic.com/news/3-5-models-and-computer-use",
  "claude-3-5-haiku": "https://www.anthropic.com/news/3-5-models-and-computer-use",
  "claude-3.7-sonnet": "https://www.anthropic.com/news/claude-3-7-sonnet",
  
  // DeepSeek models
  "deepseek-v3": "https://github.com/deepseek-ai/DeepSeek-V3",
  "deepseek-r1": "https://github.com/deepseek-ai/DeepSeek-R1",
  
  // Gemini models
  "gemini-1.5-pro": "https://developers.googleblog.com/zh-hans/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/",
  "gemini-1.5-flash": "https://developers.googleblog.com/en/gemini-15-pro-and-15-flash-now-available/",
  
  // Gemma models
  "gemma-2-27b-it": "https://huggingface.co/google/gemma-2-27b-it",
  "gemma-2-9b-it": "https://huggingface.co/google/gemma-2-9b-it",
  "gemma-3-27b": "https://huggingface.co/google/gemma-3-27b-it",

  // Qwen models
  "Qwen2.5-72B-Instruct": "https://huggingface.co/papers/2407.10671",
  "Qwen2.5-Coder-32B-Instruct": "https://qwenlm.github.io/zh/blog/qwen2.5-coder-family/",
  "QwQ-32B": "https://qwenlm.github.io/zh/blog/qwq-32b/",
  "Qwen2.5-32B": "https://huggingface.co/Qwen/Qwen2.5-32B-Instruct",
  "Qwen3-32B": "https://huggingface.co/Qwen/Qwen3-32B",
  "Qwen3-30B-A3B": "https://huggingface.co/Qwen/Qwen3-30B-A3B",
  "Qwen3-235B-A22B": "https://huggingface.co/Qwen/Qwen3-235B-A22B",

  // Grok models
  "grok-3-mini": "https://x.ai/news/grok-3",

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