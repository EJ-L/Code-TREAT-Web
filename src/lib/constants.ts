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
  "Llama-90B": "https://huggingface.co/meta-llama/Llama-3.2-90B-Vision",
  "Llama-11B": "https://huggingface.co/meta-llama/Llama-3.2-11B-Vision",

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
  "claude-3.7": "https://www.anthropic.com/news/claude-3-7-sonnet",
  "Claude-Sonnet-4": "https://www.anthropic.com/news/claude-4",

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

  // Gemma models
  "gemma-2-27b-it": "https://huggingface.co/google/gemma-2-27b-it",
  "gemma-2-9b-it": "https://huggingface.co/google/gemma-2-9b-it",
  "gemma-3-27b": "https://huggingface.co/google/gemma-3-27b-it",

  // Qwen models
  "Qwen2.5-72B-Instruct": "https://huggingface.co/Qwen/Qwen2.5-72B-Instruct",
  "Qwen2.5-Coder-32B-Instruct": "https://qwenlm.github.io/zh/blog/qwen2.5-coder-family/",
  "QwQ-32B": "https://qwenlm.github.io/zh/blog/qwq-32b/",
  "Qwen2.5-32B": "https://huggingface.co/Qwen/Qwen2.5-32B-Instruct",
  "Qwen3-32B": "https://huggingface.co/Qwen/Qwen3-32B",
  "Qwen3-30B-A3B": "https://huggingface.co/Qwen/Qwen3-30B-A3B",
  "Qwen3-235B-A22B": "https://huggingface.co/Qwen/Qwen3-235B-A22B",
  "Qwen2.5-vl-72B": "https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct",
  "Qwen2.5-vl-7B": "https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct",
  "Qwen2.5-vl-32B": "https://huggingface.co/Qwen/Qwen2.5-VL-32B-Instruct",
  "Qwen-7B": "https://huggingface.co/Qwen/Qwen-7B",
  "Qwen-72B": "https://huggingface.co/Qwen/Qwen-72B",
  "Qwen2.5-7B-Instruct": "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct",
  "Qwen2.5-14B-Instruct": "https://huggingface.co/Qwen/Qwen2.5-14B-Instruct",

  // Grok models
  "grok-3-mini": "https://x.ai/news/grok-3",

  // Pixtral models
  "Pixtral-12B": "https://huggingface.co/mistralai/Pixtral-12B-2409",
  "Pixtral-124B": "https://huggingface.co/mistralai/Pixtral-Large-Instruct-2411",

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