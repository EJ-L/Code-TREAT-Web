import { ResultEntry, ProcessedResult, TaskType, FilterOptions } from './types';
import { DataLoaderManager, DataLoaderConfig } from './dataSources/DataLoaderManager';

// Global instance of the data loader manager
const dataLoaderManager = DataLoaderManager.getInstance();

// Export types for external use
export type { DataLoaderConfig } from './dataSources/DataLoaderManager';

/**
 * Initialize the data loading system
 */
export async function initializeDataLoader(config?: DataLoaderConfig): Promise<void> {
  await dataLoaderManager.initialize(config);
}

/**
 * Load all available data
 */
export async function loadAllData(config?: DataLoaderConfig): Promise<ResultEntry[]> {
  try {
    const result = await dataLoaderManager.loadAll(config);
    return result.data;
  } catch (error) {
    console.error('Failed to load all data:', error);
    return getMockData(); // Fallback to mock data
  }
}

/**
 * Load data for a specific task
 */
export async function loadTaskData(task: TaskType, config?: DataLoaderConfig): Promise<ResultEntry[]> {
  try {
    const result = await dataLoaderManager.loadByTask(task, config);
    return result.data;
  } catch (error) {
    console.error(`Failed to load data for task ${task}:`, error);
    return [];
  }
}

/**
 * Load data with filters
 */
export async function loadFilteredData(filters: FilterOptions, config?: DataLoaderConfig): Promise<ResultEntry[]> {
  try {
    const result = await dataLoaderManager.loadByFilters(filters, config);
    return result.data;
  } catch (error) {
    console.error('Failed to load filtered data:', error);
    return [];
  }
}

/**
 * Get precomputed results for specific filters (optimized)
 */
export async function getPrecomputedResults(task: TaskType, filters: FilterOptions): Promise<any[]> {
  try {
    return await dataLoaderManager.getPrecomputedResults(task, filters);
  } catch (error) {
    console.error('Failed to get precomputed results:', error);
    return [];
  }
}

/**
 * Get available filter combinations for a task
 */
export async function getAvailableFilterCombinations(task: TaskType): Promise<Record<string, any>> {
  try {
    return await dataLoaderManager.getAvailableFilterCombinations(task);
  } catch (error) {
    console.error('Failed to get available filter combinations:', error);
    return {};
  }
}

/**
 * Get health status of all data sources
 */
export async function getDataSourceHealthStatus() {
  try {
    return await dataLoaderManager.getHealthStatus();
  } catch (error) {
    console.error('Failed to get health status:', error);
    return {};
  }
}

/**
 * Get statistics about the data loading system
 */
export function getDataLoaderStats() {
  return dataLoaderManager.getDataSourceStats();
}

/**
 * Clear all caches in the data loading system
 */
export async function clearAllCaches(): Promise<void> {
  try {
    await dataLoaderManager.clearAllCaches();
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

// Legacy API compatibility functions - these maintain the same interface as the old system

/**
 * @deprecated Use loadTaskData instead
 */
export function getTaskData(taskType: string): ResultEntry[] {
  // This is now async, but we maintain sync interface for compatibility
  // In practice, this should be replaced with async calls
  console.warn('getTaskData is deprecated and now async. Use loadTaskData instead.');
  return [];
}

/**
 * @deprecated Use loadFilteredData instead
 */
export function getDatasetData(dataset: string): ResultEntry[] {
  console.warn('getDatasetData is deprecated. Use loadFilteredData with dataset filter instead.');
  return [];
}

/**
 * @deprecated Use loadFilteredData instead
 */
export function getModelData(modelName: string): ResultEntry[] {
  console.warn('getModelData is deprecated. Use loadFilteredData instead.');
  return [];
}

/**
 * Clear cache - maintained for compatibility
 */
export function clearCache(): void {
  clearAllCaches().catch(error => {
    console.error('Failed to clear cache:', error);
  });
}

/**
 * Process a result entry into the expected format
 */
export function processResult(entry: ResultEntry): ProcessedResult {
  const processedResult: ProcessedResult = {
    modelId: entry.id,
    modelName: entry.model_name,
    dataset: entry.dataset,
    task: entry.task,
    sourceLang: entry.source_lang || null,
    lang: entry.lang,
    targetLang: entry.target_lang || null,
    domain: entry.domain,
    
    // Basic metrics
    pass1: entry.metrics['pass@1'] || null,
    pass3: entry.metrics['pass@3'] || null,
    pass5: entry.metrics['pass@5'] || null,
    
    // Difficulty-based metrics (if available)
    easyPass1: entry.metrics['easy_pass@1'] || null,
    mediumPass1: entry.metrics['medium_pass@1'] || null,
    hardPass1: entry.metrics['hard_pass@1'] || null,
    easyPass3: entry.metrics['easy_pass@3'] || null,
    mediumPass3: entry.metrics['medium_pass@3'] || null,
    hardPass3: entry.metrics['hard_pass@3'] || null,
    easyPass5: entry.metrics['easy_pass@5'] || null,
    mediumPass5: entry.metrics['medium_pass@5'] || null,
    hardPass5: entry.metrics['hard_pass@5'] || null,
    
    // Other metrics
    codebleu: entry.metrics['CodeBLEU'] || null,
    llmjudge: typeof entry.metrics['LLMJudge'] === 'number' ? entry.metrics['LLMJudge'] : null,
    executionAccuracy: entry.metrics['ExecutionAccuracy'] || null,
    difficulty: entry.difficulty || null,
    
    // Vulnerability detection metrics
    'P-C': entry.metrics['P-C'] || null,
    'P-V': entry.metrics['P-V'] || null,
    'P-B': entry.metrics['P-B'] || null,
    'P-R': entry.metrics['P-R'] || null,
    'Accuracy': entry.metrics['Accuracy'] || null,
    'Precision': entry.metrics['Precision'] || null,
    'Recall': entry.metrics['Recall'] || null,
    'F1 Score': entry.metrics['F1 Score'] || null,
    
    // Code-web and interaction-2-code metrics
    'CLIP': entry.metrics['CLIP'] || null,
    'Compilation': entry.metrics['Compilation'] || null,
    'SSIM': entry.metrics['SSIM'] || null,
    'Text': entry.metrics['Text'] || null,
    'Position': entry.metrics['Position'] || null,
    'Implement Rate': entry.metrics['Implement Rate'] || null,
    
    // Code-robustness metrics
    'VAN': entry.metrics['VAN'] || null,
    'REN': entry.metrics['REN'] || null,
    'RTF': entry.metrics['RTF'] || null,
    'GBC': entry.metrics['GBC'] || null,
    'ALL': entry.metrics['ALL'] || null,
    'MDC': entry.metrics['MDC'] || null,
    'MPS': entry.metrics['MPS'] || null,
    'MHC': entry.metrics['MHC'] || null,
    
    // Mr-web metrics
    'MAE': entry.metrics['MAE'] || null,
    'NEMD': entry.metrics['NEMD'] || null,
    'RER': entry.metrics['RER'] || null
  };

  return processedResult;
}

/**
 * Mock data for fallback scenarios
 */
function getMockData(): ResultEntry[] {
  return [
    {
      id: 'mock-gpt-4',
      model_name: 'GPT-4',
      dataset: 'HumanEval',
      task: 'code generation',
      lang: 'python',
      metrics: {
        'pass@1': 0.673,
        'pass@5': 0.834
      }
    },
    {
      id: 'mock-claude-3.5',
      model_name: 'Claude-3.5',
      dataset: 'HumanEval',
      task: 'code generation',
      lang: 'python',
      metrics: {
        'pass@1': 0.652,
        'pass@5': 0.812
      }
    }
  ];
}

// Utility functions for backward compatibility

/**
 * @deprecated Use the new async API
 */
export function getAvailableTasks(): string[] {
  console.warn('getAvailableTasks is deprecated. Tasks are now defined by the data sources.');
  return [
    'code generation',
    'code translation',
    'code summarization',
    'code review',
    'vulnerability detection',
    'input prediction',
    'output prediction',
    'code-web',
    'interaction-2-code',
    'code-robustness',
    'mr-web'
  ];
}

/**
 * @deprecated Use the new async API
 */
export function getAvailableDatasets(): string[] {
  console.warn('getAvailableDatasets is deprecated. Use loadAllData and extract unique datasets.');
  return [];
}

/**
 * @deprecated Use the new async API
 */
export function getAvailableModels(): string[] {
  console.warn('getAvailableModels is deprecated. Use loadAllData and extract unique models.');
  return [];
}

// Debounced versions for compatibility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const debouncedGetTaskData = debounce(getTaskData, 100);
export const debouncedGetDatasetData = debounce(getDatasetData, 100);
export const debouncedGetModelData = debounce(getModelData, 100); 