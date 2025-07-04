import { ResultEntry, ProcessedResult, TaskType, FilterOptions } from './types';

// 高性能数据存储与索引
class DataStore {
  // 主数据存储
  private allData: ResultEntry[] = [];
  
  // 主要索引
  private indices: {
    byTask: Map<string, Set<number>>;
    byModel: Map<string, Set<number>>;
    byDataset: Map<string, Set<number>>;
    byLang: Map<string, Set<number>>;
    // 复合索引
    byTaskAndDataset: Map<string, Set<number>>;
    byTaskAndModel: Map<string, Set<number>>;
  };
  
  // 缓存的查询结果
  private queryCache: Map<string, ResultEntry[]> = new Map();
  
  // 预计算的结果缓存
  private precomputedResults: {
    taskResults: Map<string, ResultEntry[]>;
    datasetResults: Map<string, ResultEntry[]>;
    modelResults: Map<string, ResultEntry[]>;
    taskDatasetResults: Map<string, ResultEntry[]>;
  } = {
    taskResults: new Map(),
    datasetResults: new Map(),
    modelResults: new Map(),
    taskDatasetResults: new Map()
  };
  
  constructor() {
    // 初始化索引
    this.indices = {
      byTask: new Map(),
      byModel: new Map(),
      byDataset: new Map(),
      byLang: new Map(),
      byTaskAndDataset: new Map(),
      byTaskAndModel: new Map()
    };
  }
  
  // 重置所有数据和索引
  reset(): void {
    this.allData = [];
    this.indices.byTask.clear();
    this.indices.byModel.clear();
    this.indices.byDataset.clear();
    this.indices.byLang.clear();
    this.indices.byTaskAndDataset.clear();
    this.indices.byTaskAndModel.clear();
    this.queryCache.clear();
    
    // 清除预计算结果
    this.precomputedResults.taskResults.clear();
    this.precomputedResults.datasetResults.clear();
    this.precomputedResults.modelResults.clear();
    this.precomputedResults.taskDatasetResults.clear();
  }
  
  // 批量添加数据并建立索引
  addBatch(entries: ResultEntry[]): void {
    if (entries.length === 0) return; // 跳过空批次
    
    const startIdx = this.allData.length;
    
    // 添加数据
    this.allData.push(...entries);
    
    // 更新索引
    for (let i = 0; i < entries.length; i++) {
      const idx = startIdx + i;
      const entry = entries[i];
      
      // 更新任务索引
      const task = entry.task?.toLowerCase() || 'unknown';
      if (!this.indices.byTask.has(task)) {
        this.indices.byTask.set(task, new Set());
      }
      this.indices.byTask.get(task)!.add(idx);
      
      // 更新模型索引
      const model = entry.model_name || 'unknown';
      if (!this.indices.byModel.has(model)) {
        this.indices.byModel.set(model, new Set());
      }
      this.indices.byModel.get(model)!.add(idx);
      
      // 更新数据集索引
      const dataset = entry.dataset?.toLowerCase() || 'unknown';
      if (!this.indices.byDataset.has(dataset)) {
        this.indices.byDataset.set(dataset, new Set());
      }
      this.indices.byDataset.get(dataset)!.add(idx);
      
      // 更新语言索引
      const lang = entry.lang || 'unknown';
      if (!this.indices.byLang.has(lang)) {
        this.indices.byLang.set(lang, new Set());
      }
      this.indices.byLang.get(lang)!.add(idx);
      
      // 更新复合索引：任务+数据集
      const taskDatasetKey = `${task}:${dataset}`;
      if (!this.indices.byTaskAndDataset.has(taskDatasetKey)) {
        this.indices.byTaskAndDataset.set(taskDatasetKey, new Set());
      }
      this.indices.byTaskAndDataset.get(taskDatasetKey)!.add(idx);
      
      // 更新复合索引：任务+模型
      const taskModelKey = `${task}:${model}`;
      if (!this.indices.byTaskAndModel.has(taskModelKey)) {
        this.indices.byTaskAndModel.set(taskModelKey, new Set());
      }
      this.indices.byTaskAndModel.get(taskModelKey)!.add(idx);
    }
    
    // 清除查询缓存
    this.queryCache.clear();
    
    // 预计算新的结果 - 仅当批量大小超过阈值时才预计算
    // 较小的批次积累后再一次性预计算，提高性能
    if (entries.length > 50) {
      this.precomputeResults();
    }
  }
  
  // 获取所有数据
  getAll(): ResultEntry[] {
    return this.allData;
  }
  
  // 按任务查询
  getByTask(task: string): ResultEntry[] {
    const taskLower = task.toLowerCase();
    const precomputed = this.precomputedResults.taskResults.get(taskLower);
    if (precomputed) {
      return precomputed;
    }
    
    // 如果没有预计算结果，使用原有逻辑
    const indices = this.indices.byTask.get(taskLower);
    if (!indices) return [];
    return Array.from(indices).map(idx => this.allData[idx]);
  }
  
  // 按模型名称查询
  getByModel(model: string): ResultEntry[] {
    const cacheKey = `model:${model}`;
    
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }
    
    const indices = this.indices.byModel.get(model);
    if (!indices) return [];
    
    const result = Array.from(indices).map(idx => this.allData[idx]);
    this.queryCache.set(cacheKey, result);
    return result;
  }
  
  // 按数据集查询
  getByDataset(dataset: string): ResultEntry[] {
    const datasetLower = dataset.toLowerCase();
    const precomputed = this.precomputedResults.datasetResults.get(datasetLower);
    if (precomputed) {
      return precomputed;
    }
    
    const indices = this.indices.byDataset.get(datasetLower);
    if (!indices) return [];
    return Array.from(indices).map(idx => this.allData[idx]);
  }
  
  // 按任务和数据集组合查询
  getByTaskAndDataset(task: string, dataset: string): ResultEntry[] {
    const key = `${task.toLowerCase()}:${dataset.toLowerCase()}`;
    const precomputed = this.precomputedResults.taskDatasetResults.get(key);
    if (precomputed) {
      return precomputed;
    }
    
    const indices = this.indices.byTaskAndDataset.get(key);
    if (!indices) return [];
    return Array.from(indices).map(idx => this.allData[idx]);
  }
  
  // 按任务和模型组合查询
  getByTaskAndModel(task: string, model: string): ResultEntry[] {
    const taskLower = task.toLowerCase();
    const cacheKey = `task:${taskLower}:model:${model}`;
    
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }
    
    const key = `${taskLower}:${model}`;
    const indices = this.indices.byTaskAndModel.get(key);
    if (!indices) return [];
    
    const result = Array.from(indices).map(idx => this.allData[idx]);
    this.queryCache.set(cacheKey, result);
    return result;
  }
  
  // 获取所有可用任务
  getAvailableTasks(): string[] {
    return Array.from(this.indices.byTask.keys());
  }
  
  // 获取所有可用数据集
  getAvailableDatasets(): string[] {
    return Array.from(this.indices.byDataset.keys());
  }
  
  // 获取所有可用模型
  getAvailableModels(): string[] {
    return Array.from(this.indices.byModel.keys());
  }
  
  // 获取特定任务下的所有可用数据集
  getAvailableDatasetsForTask(task: string): string[] {
    const taskLower = task.toLowerCase();
    const result: string[] = [];
    
    this.indices.byTaskAndDataset.forEach((_, key) => {
      if (key.startsWith(`${taskLower}:`)) {
        result.push(key.split(':')[1]);
      }
    });
    
    return result;
  }
  
  // 获取特定任务下的所有可用模型
  getAvailableModelsForTask(task: string): string[] {
    const taskLower = task.toLowerCase();
    const result: string[] = [];
    
    this.indices.byTaskAndModel.forEach((_, key) => {
      if (key.startsWith(`${taskLower}:`)) {
        result.push(key.split(':')[1]);
      }
    });
    
    return result;
  }
  
  // 预处理所有数据
  private precomputeResults(): void {
    // 清除旧的预计算结果
    this.precomputedResults.taskResults.clear();
    this.precomputedResults.datasetResults.clear();
    this.precomputedResults.modelResults.clear();
    this.precomputedResults.taskDatasetResults.clear();
    
    // 预处理每个任务的数据 - 使用数组而不是Map遍历效率更高
    Array.from(this.indices.byTask.entries()).forEach(([task, indices]) => {
      const entries = Array.from(indices).map(idx => this.allData[idx]);
      this.precomputedResults.taskResults.set(task, entries);
    });
    
    // 预处理每个数据集的数据
    Array.from(this.indices.byDataset.entries()).forEach(([dataset, indices]) => {
      // 仅预计算经常访问的数据集，提高性能
      if (dataset === 'unknown') return;
      const entries = Array.from(indices).map(idx => this.allData[idx]);
      this.precomputedResults.datasetResults.set(dataset, entries);
    });
    
    // 预处理每个模型的数据 - 这部分可能不太常用，跳过提高性能
    // this.indices.byModel.forEach((indices, model) => {
    //   const entries = Array.from(indices).map(idx => this.allData[idx]);
    //   this.precomputedResults.modelResults.set(model, entries);
    // });
    
    // 预处理任务+数据集组合的数据 - 按需加载，不预先计算
    // this.indices.byTaskAndDataset.forEach((indices, key) => {
    //   const entries = Array.from(indices).map(idx => this.allData[idx]);
    //   this.precomputedResults.taskDatasetResults.set(key, entries);
    // });
  }
}

// 实例化数据存储
const dataStore = new DataStore();

// 文件缓存
const fileCache: Map<string, ResultEntry[]> = new Map();

// Loading state management
let isLoadingData = false;
let loadingDataPromise: Promise<ResultEntry[]> | null = null;

export const taskDirectories: Record<string, string> = {
  'code generation': 'data/code-generation',
  'code translation': 'data/code-translation',
  'code summarization': 'data/code-summarization',
  // 'code execution': 'data/code-execution',
  'vulnerability detection': 'data/vulnerability-detection',
  'code review': 'data/code-review',
  'input prediction': 'data/input_prediction',
  'output prediction': 'data/output_prediction',
  'code-web': 'data/code-web',
  'interaction-2-code': 'data/interaction-2-code',
  'code-robustness': 'data/code-robustness',
  'mr-web': 'data/mr-web'
};

// 加载单个文件的函数
async function loadJsonlFile(directory: string, file: string): Promise<ResultEntry[]> {
  const cacheKey = `${directory}/${file}`;
  
  // 检查缓存
  if (fileCache.has(cacheKey)) {
    return fileCache.get(cacheKey)!;
  }

  try {
    // 异步加载文件数据
    const response = await fetch(`/api/files?directory=${directory}&file=${file}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    // This function is specifically for JSONL files (arrays of entries)
    if (!responseData.data || !Array.isArray(responseData.data)) {
      throw new Error('Invalid data format - expected JSONL format with data array');
    }
    
    // 缓存数据
    fileCache.set(cacheKey, responseData.data);
    return responseData.data;
    
  } catch (error) {
    console.error(`加载文件失败: ${directory}/${file}`, error);
    return [];
  }
}

// 获取文件缓存数据
export function getCachedFileData(directory: string, file: string): ResultEntry[] | null {
  const cacheKey = `${directory}/${file}`;
  return fileCache.has(cacheKey) ? fileCache.get(cacheKey)! : null;
}

// 批量加载所有数据
export async function loadAllData(): Promise<ResultEntry[]> {
  // 检查是否已有数据
  if (dataStore.getAll().length > 0) {
    return dataStore.getAll();
  }
  
  // If currently loading, wait for the existing promise
  if (isLoadingData && loadingDataPromise) {
    return loadingDataPromise;
  }
  
  // Set loading flag and create promise
  isLoadingData = true;
  loadingDataPromise = performDataLoad();
  
  try {
    const result = await loadingDataPromise;
    return result;
  } finally {
    isLoadingData = false;
    loadingDataPromise = null;
  }
}

async function performDataLoad(): Promise<ResultEntry[]> {
  try {
    // First try to ensure GitHub data is downloaded locally
    console.log('Checking if GitHub data needs to be downloaded...');
    
    try {
      const downloadResponse = await fetch('/api/download-github-data', {
        method: 'POST'
      });
      
      if (downloadResponse.ok) {
        const result = await downloadResponse.json();
        console.log('GitHub data download result:', result.message);
      } else {
        console.warn('Failed to download GitHub data, will use existing local data if available');
      }
    } catch (downloadError) {
      console.warn('Error downloading GitHub data:', downloadError);
    }
    
    console.log('Loading data from local files...');
    
    // Fallback to local file system
    // 获取所有目录的文件列表
    const directoriesPromises = Object.entries(taskDirectories)
      .filter(([taskType]) => taskType !== 'overall')
      .map(async ([taskType, directory]) => {
        try {
          const response = await fetch(`/api/files?directory=${directory}`);
          if (!response.ok) {
            console.warn(`获取目录失败: ${directory}`);
            return { taskType, directory, files: [] };
          }
          
          const files = await response.json();
          return { taskType, directory, files };
        } catch (error) {
          console.error(`处理目录失败: ${directory}`, error);
          return { taskType, directory, files: [] };
        }
      });
    
    // 并行获取所有目录的文件列表
    const directories = await Promise.all(directoriesPromises);
    
    // 串行处理每个目录（避免内存问题）
    for (const { taskType, directory, files } of directories) {
      if (files.length === 0) continue;
      
      // 批量处理文件，每批最多5个文件并行加载
      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        // 并行加载一批文件 (只处理JSONL文件)
        const batchResults = await Promise.all(
          batch.filter((file: string) => file.endsWith('.jsonl')).map(async (file: string) => {
            try {
              const fileData = await loadJsonlFile(directory, file);
              
              // Log when loading input_prediction files
              if (taskType === 'input prediction' && fileData.length > 0) {
                console.log(`Loaded input prediction file: ${file} with ${fileData.length} entries`);
              }
              
              // 特别记录code review文件的内容（仅在第一次加载时）
              if (taskType === 'code review' && fileData.length > 0 && i === 0 && file === batch[0]) {
                console.log(`Loaded code review file with ${fileData.length} entries`);
              }
              
              // 处理数据，确保language字段被正确映射到lang字段
              return fileData.map(entry => {
                // 如果有language字段但没有lang字段，将language字段的值复制到lang字段
                if (entry.language && !entry.lang) {
                  const result = {...entry, lang: entry.language, task: taskType};
                  // For mr-web, preserve the original task as subtask
                  if (taskType === 'mr-web' && entry.task) {
                    result.subtask = entry.task;
                  }
                  // For mr-web, preserve the method field
                  if (taskType === 'mr-web' && entry.method) {
                    result.method = entry.method;
                  }
                  // Preserve domain field if it exists
                  if ((entry as any).domain) {
                    result.domain = (entry as any).domain;
                  }
                  return result;
                }
                const result = {...entry, task: taskType};
                // For mr-web, preserve the original task as subtask
                if (taskType === 'mr-web' && entry.task) {
                  result.subtask = entry.task;
                }
                // For mr-web, preserve the method field
                if (taskType === 'mr-web' && entry.method) {
                  result.method = entry.method;
                }
                // Preserve domain field if it exists
                if ((entry as any).domain) {
                  result.domain = (entry as any).domain;
                }
                
                return result;
              });
            } catch (error) {
              console.error(`处理文件失败: ${file}`, error);
              return [];
            }
          })
        );
        
        // 批量添加到数据存储
        for (const entryBatch of batchResults) {
          if (entryBatch.length > 0) {
            dataStore.addBatch(entryBatch);
          }
        }
      }
    }
    
    // 检查是否加载到数据
    const allData = dataStore.getAll();
    if (allData.length === 0) {
      console.log('没有加载到数据，返回模拟数据');
      const mockData = getMockData();
      dataStore.addBatch(mockData);
      return mockData;
    }
    
    return allData;
    
  } catch (error) {
    console.error('加载数据过程中发生错误:', error);
    
    // If both GitHub and local loading fail, use mock data
    console.log('Both GitHub and local data loading failed, using mock data');
    const mockData = getMockData();
    dataStore.addBatch(mockData);
    return mockData;
  }
}

// 获取特定任务的数据
export function getTaskData(taskType: string): ResultEntry[] {
  return dataStore.getByTask(taskType);
}

// 获取特定数据集的数据
export function getDatasetData(dataset: string): ResultEntry[] {
  return dataStore.getByDataset(dataset);
}

// 获取特定模型的数据
export function getModelData(modelName: string): ResultEntry[] {
  return dataStore.getByModel(modelName);
}

// 获取特定任务和数据集的数据
export function getTaskAndDatasetData(taskType: string, dataset: string): ResultEntry[] {
  return dataStore.getByTaskAndDataset(taskType, dataset);
}

// 清除所有缓存
export function clearCache(): void {
  dataStore.reset();
  fileCache.clear();
  isLoadingData = false;
  loadingDataPromise = null;
}

// 获取所有可用的任务
export function getAvailableTasks(): string[] {
  return dataStore.getAvailableTasks();
}

// 获取所有可用的数据集
export function getAvailableDatasets(): string[] {
  return dataStore.getAvailableDatasets();
}

// 获取所有可用的模型
export function getAvailableModels(): string[] {
  return dataStore.getAvailableModels();
}

// 提供模拟数据
function getMockData(): ResultEntry[] {
  return [
    {
      id: 'mock-1',
      model_name: 'GPT-4',
      task: 'code generation',
      lang: 'python',
      dataset: 'HackerRank',
      metrics: {
        'pass@1': 0.85,
        'pass@3': 0.92,
        'pass@5': 0.95
      }
    },
    {
      id: 'mock-2',
      model_name: 'Claude 3',
      task: 'code generation',
      lang: 'python',
      dataset: 'HackerRank',
      metrics: {
        'pass@1': 0.82,
        'pass@3': 0.90,
        'pass@5': 0.93
      }
    },
    {
      id: 'mock-3',
      model_name: 'Llama 3',
      task: 'code generation',
      lang: 'python',
      dataset: 'HackerRank',
      metrics: {
        'pass@1': 0.78,
        'pass@3': 0.88,
        'pass@5': 0.92
      }
    },
    {
      id: 'mock-4',
      model_name: 'CodeLlama',
      task: 'code generation',
      lang: 'python',
      dataset: 'HackerRank',
      metrics: {
        'pass@1': 0.76,
        'pass@3': 0.85,
        'pass@5': 0.90
      }
    },
    {
      id: 'mock-5',
      model_name: 'GPT-4',
      task: 'code translation',
      lang: 'python',
      source_lang: 'python',
      target_lang: 'java',
      dataset: 'CodeTransOcean',
      metrics: {
        'pass@1': 0.80,
        'CodeBLEU': 0.75
      }
    },
    {
      id: 'mock-6',
      model_name: 'Claude 3',
      task: 'code summarization',
      lang: 'javascript',
      dataset: 'GitHub',
      metrics: {
        'LLMJudge': 4.2
      }
    }
  ];
}

export function processResult(entry: ResultEntry): ProcessedResult {
  // Convert simplified result entry to standardized ProcessedResult format
  const processedResult: ProcessedResult = {
    modelId: `${entry.model_name}-${entry.dataset || 'unknown'}-${entry.task || 'unknown'}`,
    modelName: entry.model_name,
    dataset: entry.dataset || 'Unknown',
    task: entry.task || 'Unknown',
    sourceLang: entry.source_lang || null,
    lang: entry.lang || (entry.language || 'Unknown'),
    targetLang: entry.target_lang || null,
    domain: entry.domain || undefined,
    pass1: entry.metrics?.['pass@1'] !== undefined ? entry.metrics['pass@1'] : null, 
    pass3: entry.metrics?.['pass@3'] !== undefined ? entry.metrics['pass@3'] : null,
    pass5: entry.metrics?.['pass@5'] !== undefined ? entry.metrics['pass@5'] : null,
    executionAccuracy: entry.metrics?.['ExecutionAccuracy'] !== undefined ? entry.metrics['ExecutionAccuracy'] : null,
    codebleu: entry.metrics?.['CodeBLEU'] !== undefined ? entry.metrics['CodeBLEU'] : null,
    llmjudge: (typeof entry.metrics?.['LLMJudge'] === 'number') ? entry.metrics['LLMJudge'] : null,
    difficulty: entry.difficulty || null,
    // Initialize difficulty metrics as null
    easyPass1: null,
    easyPass3: null,
    easyPass5: null,
    mediumPass1: null,
    mediumPass3: null,
    mediumPass5: null,
    hardPass1: null,
    hardPass3: null,
    hardPass5: null
  };

  // Special handling for difficulty information
  if (entry.difficulty) {
    console.log(`Processing difficulty metrics: ${entry.difficulty}, pass@1:`, entry.metrics?.['pass@1']);
    
    // Assign metrics to the appropriate difficulty category
    switch (entry.difficulty.toLowerCase()) {
      case 'easy':
        processedResult.easyPass1 = entry.metrics?.['pass@1'] !== undefined ? entry.metrics['pass@1'] : null;
        processedResult.easyPass3 = entry.metrics?.['pass@3'] !== undefined ? entry.metrics['pass@3'] : null;
        processedResult.easyPass5 = entry.metrics?.['pass@5'] !== undefined ? entry.metrics['pass@5'] : null;
        break;
      case 'medium':
        processedResult.mediumPass1 = entry.metrics?.['pass@1'] !== undefined ? entry.metrics['pass@1'] : null;
        processedResult.mediumPass3 = entry.metrics?.['pass@3'] !== undefined ? entry.metrics['pass@3'] : null;
        processedResult.mediumPass5 = entry.metrics?.['pass@5'] !== undefined ? entry.metrics['pass@5'] : null;
        break;
      case 'hard':
        processedResult.hardPass1 = entry.metrics?.['pass@1'] !== undefined ? entry.metrics['pass@1'] : null;
        processedResult.hardPass3 = entry.metrics?.['pass@3'] !== undefined ? entry.metrics['pass@3'] : null;
        processedResult.hardPass5 = entry.metrics?.['pass@5'] !== undefined ? entry.metrics['pass@5'] : null;
        break;
    }
  }

  return processedResult;
}

// 根据数据集名称或其他字段推断任务类型
function inferTaskType(entry: ResultEntry): string {
  // 从数据集名称推断
  const dataset = entry.dataset?.toLowerCase() || '';
  if (dataset.includes('translation')) return 'code translation';
  if (dataset.includes('generation')) return 'code generation';
  if (dataset.includes('summary') || dataset.includes('summarization')) return 'code summarization';
  if (dataset.includes('execution')) return 'code execution';
  
  // 从指标推断
  if (entry.metrics?.['CodeBLEU'] !== undefined) return 'code translation';
  // if (entry.metrics?.['ExecutionAccuracy'] !== undefined) return 'code execution';
  if (entry.metrics?.['LLMJudge'] !== undefined) return 'code summarization';
  if (entry.metrics?.['gpt-4o'] !== undefined) return 'code review';
  
  // 从语言字段推断
  if (entry.source_lang && entry.target_lang) return 'code translation';
  
  // 默认为代码生成
  console.warn('Could not infer task type, defaulting to code generation:', entry);
  return 'code generation';
}

// 添加防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(this, args);
      timeout = null;
    }, wait);
  };
}

// 导出防抖版本的数据获取函数
export const debouncedGetTaskData = debounce(getTaskData, 100);
export const debouncedGetDatasetData = debounce(getDatasetData, 100);
export const debouncedGetModelData = debounce(getModelData, 100);
export const debouncedGetTaskAndDatasetData = debounce(getTaskAndDatasetData, 100);

// Add interface for precomputed data structure
interface PrecomputedResult {
  rank: number;
  model: string;
  model_url?: string;
  [key: string]: any; // For metrics like pass@1, LLM Judge, etc.
}

interface PrecomputedData {
  task: string;
  filterMappings: {
    [combinationKey: string]: {
      modality?: string[];
      knowledge?: string[];
      reasoning?: string[];
      dataset?: string[];
      [key: string]: any;
    };
  };
  data: {
  [modelName: string]: {
    [combinationKey: string]: PrecomputedResult;
    };
  };
}

// Cache for precomputed data
const precomputedCache = new Map<string, PrecomputedData>();

// Function to match user filters to available combinations
function findMatchingCombination(userFilters: any, filterMappings: any): string | null {
  console.log(`\n🚀 === FILTER MATCHING DEBUG ===`);
  console.log(`🔍 User clicked filters:`, userFilters);
  console.log(`🔍 Available combinations:`, Object.keys(filterMappings));
  
  // Simple test: if user selected just HackerRank dataset, should match "dataset-HackerRank"
  if (userFilters.datasets && userFilters.datasets.length === 1 && userFilters.datasets[0] === 'HackerRank') {
    console.log(`🎯 SIMPLE TEST: User selected only HackerRank dataset`);
    console.log(`🎯 Expected match: "dataset-HackerRank"`);
    console.log(`🎯 Does it exist?`, filterMappings['dataset-HackerRank'] ? 'YES' : 'NO');
    if (filterMappings['dataset-HackerRank']) {
      console.log(`🎯 Mapping details:`, filterMappings['dataset-HackerRank']);
    }
  }
  
  console.log(`🚀 === END SIMPLE TEST ===\n`);
  
  // Helper function to normalize filter arrays for comparison - FIXED ORDER SENSITIVITY
  const normalizeArray = (arr: any[]): string[] => {
    if (!arr || arr.length === 0) return [];
    // Sort case-insensitively to ensure consistent order regardless of user click order
    return [...arr].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  };
  
  // Helper function to check if two filter arrays match
  const arraysMatch = (userArray: any[], mappingArray: any[]): boolean => {
    const normalizedUser = normalizeArray(userArray);
    const normalizedMapping = normalizeArray(mappingArray);
    
    console.log(`    🔍 Comparing arrays: user=[${normalizedUser.join(',')}] vs mapping=[${normalizedMapping.join(',')}]`);
    
    // If user has no filters for this category, it matches any mapping (including empty)
    if (normalizedUser.length === 0) {
      console.log(`    ✅ User has no filters for this category, matches any mapping`);
      return true;
    }
    
    // If user has filters, they must exactly match the mapping (after sorting)
    if (normalizedUser.length !== normalizedMapping.length) {
      console.log(`    ❌ Array length mismatch: ${normalizedUser.length} vs ${normalizedMapping.length}`);
      return false;
    }
    
    const matches = normalizedUser.every((item, index) => 
      item.localeCompare(normalizedMapping[index], undefined, { sensitivity: 'base' }) === 0
    );
    
    console.log(`    ${matches ? '✅' : '❌'} Arrays ${matches ? 'match' : 'do not match'}`);
    return matches;
  };
  
  // Special case: if all user filters are empty, return 'overall'
  const hasAnyFilters = Object.values(userFilters).some(filterArray => 
    Array.isArray(filterArray) && filterArray.length > 0
  );
  
  console.log(`🔍 User has any filters: ${hasAnyFilters}`);
  
  if (!hasAnyFilters) {
    console.log(`🎯 No filters selected, returning 'overall'`);
    return 'overall';
  }
  
  // Get all available options for each filter category from the filterMappings
  const availableOptions: { [key: string]: Set<string> } = {};
  
  for (const mapping of Object.values(filterMappings)) {
    for (const [category, values] of Object.entries(mapping as any)) {
      if (!availableOptions[category]) {
        availableOptions[category] = new Set();
      }
      if (Array.isArray(values)) {
        values.forEach(value => availableOptions[category].add(value));
      }
    }
  }
  
  console.log(`🔍 Available options:`, Object.fromEntries(
    Object.entries(availableOptions).map(([key, set]) => [key, Array.from(set)])
  ));
  
  // Check if user has selected ALL available options for any category
  // If so, treat it as if no filter was selected for that category
  const effectiveUserFilters = { ...userFilters };
  
  // CRITICAL FIX: Map plural field names to singular field names used in filter matching
  if (userFilters.datasets) {
    effectiveUserFilters.dataset = userFilters.datasets;
  }
  if (userFilters.modalities) {
    effectiveUserFilters.modality = userFilters.modalities;
  }
  if (userFilters.langs) {
    // langs also maps to modality
    if (!effectiveUserFilters.modality) {
      effectiveUserFilters.modality = userFilters.langs;
    } else {
      // Combine with existing modality filters
      effectiveUserFilters.modality = [...new Set([...effectiveUserFilters.modality, ...userFilters.langs])];
    }
  }
  
  for (const [category, userValues] of Object.entries(effectiveUserFilters)) {
    if (Array.isArray(userValues) && userValues.length > 0) {
      const availableForCategory = availableOptions[category];
      if (availableForCategory && userValues.length === availableForCategory.size) {
        // Check if user selected all available options (case insensitive)
        const allSelected = userValues.every(value => 
          Array.from(availableForCategory).some(available => 
            String(available).localeCompare(String(value), undefined, { sensitivity: 'base' }) === 0
          )
        );
        if (allSelected) {
          console.log(`🎯 User selected ALL ${category} options, treating as no filter`);
          effectiveUserFilters[category] = [];
        }
      }
    }
  }
  
  // Handle special case: modalities and langs both map to modality
  // Note: We already mapped modalities/langs to modality field above
  const allUserModalities = effectiveUserFilters.modality || [];
  const uniqueUserModalities = [...new Set(allUserModalities)];
  
  // Check if user selected all modalities
  const availableModalities = availableOptions.modality;
  if (availableModalities && uniqueUserModalities.length === availableModalities.size) {
    const allModalitiesSelected = uniqueUserModalities.every(value =>
      Array.from(availableModalities).some(available =>
        String(available).localeCompare(String(value), undefined, { sensitivity: 'base' }) === 0
      )
    );
    if (allModalitiesSelected) {
      console.log(`🎯 User selected ALL modality options, treating as no filter`);
      effectiveUserFilters.modality = [];
    }
  }
  
  console.log(`🔍 Effective user filters after processing:`, effectiveUserFilters);
  
  // Check again if all effective filters are empty after the "all selected" logic
  const hasAnyEffectiveFilters = Object.values(effectiveUserFilters).some(filterArray => 
    Array.isArray(filterArray) && filterArray.length > 0
  );
  
  if (!hasAnyEffectiveFilters) {
    console.log(`🎯 All filters are empty or "all selected", returning overall`);
    return 'overall';
  }
  
  // Find exact matching combinations - REMOVED FALLBACKS FOR PROPER "NO RESULTS" HANDLING
  let exactMatches: string[] = [];
  
  console.log(`🔍 Searching through ${Object.keys(filterMappings).length} combinations for exact matches...`);
  
  for (const [combinationKey, mapping] of Object.entries(filterMappings)) {
    let matches = true;
    
    console.log(`🔍 Checking combination: "${combinationKey}"`);
    console.log(`  Mapping:`, mapping);
    
    // Check each filter category for exact match
    const filterCategories = ['modality', 'knowledge', 'reasoning', 'dataset'];
    
    for (const category of filterCategories) {
      let userFilterArray = effectiveUserFilters[category] || [];
      const mappingFilterArray = (mapping as any)[category] || [];
      
      // Handle special case: modalities and langs both map to modality
      if (category === 'modality') {
        // Use the already-mapped modality field
        userFilterArray = effectiveUserFilters.modality || [];
      }
      
      console.log(`  🔍 Checking ${category}:`);
      console.log(`    User: [${normalizeArray(userFilterArray).join(',')}]`);
      console.log(`    Mapping: [${normalizeArray(mappingFilterArray).join(',')}]`);
      
      if (!arraysMatch(userFilterArray, mappingFilterArray)) {
        console.log(`    ❌ No match for ${category}`);
        matches = false;
        break;
      } else {
        console.log(`    ✅ Match for ${category}`);
      }
    }
    
    if (matches) {
      exactMatches.push(combinationKey);
      console.log(`🎯 Found exact match: "${combinationKey}"`);
    } else {
      console.log(`❌ "${combinationKey}" does not match`);
    }
  }
  
  console.log(`🔍 Found ${exactMatches.length} exact matches:`, exactMatches);
  
  // Return the first exact match or null if no matches found
  // DO NOT fallback to 'overall' - this allows proper "no results" handling
  const bestMatch = exactMatches.length > 0 ? exactMatches[0] : null;
  
  if (bestMatch) {
    console.log(`✅ Using exact match: "${bestMatch}"`);
  } else {
    console.log(`❌ No exact match found - this should result in no results`);
  }
  
  return bestMatch;
}

// Function to load precomputed data for a task
async function loadPrecomputedData(task: string, showByDifficulty: boolean): Promise<PrecomputedData | null> {
  const taskKey = task.replace(/\s+/g, '-');
  const cacheKey = showByDifficulty ? `${taskKey}_difficulty` : taskKey;
  
  // Check cache first
  if (precomputedCache.has(cacheKey)) {
    return precomputedCache.get(cacheKey)!;
  }
  
  try {
    // Determine the correct consolidated file name
    let fileName: string;
    if (showByDifficulty) {
      fileName = `${taskKey}_difficulty_consolidated.json`;
    } else {
      fileName = `${taskKey}_consolidated.json`;
    }
    
    const response = await fetch(`/api/direct-files?file=data/precomputed/${fileName}`);
    
    if (!response.ok) {
      console.warn(`Failed to load precomputed data: ${fileName}, status: ${response.status}`);
      return null;
    }
    
    const data: PrecomputedData = await response.json();
    
    // Cache the data
    precomputedCache.set(cacheKey, data);
    
    console.log(`Loaded precomputed data for ${task} (${showByDifficulty ? 'difficulty' : 'normal'}) with ${Object.keys(data.data).length} models`);
    
    return data;
  } catch (error) {
    console.error(`Error loading precomputed data for ${task}:`, error);
    return null;
  }
}

// Function to get results from precomputed data
export async function getPrecomputedResults(task: TaskType, filters: FilterOptions): Promise<any[]> {
  console.log('🎯 getPrecomputedResults called with:', { task, filters });
  console.log('📋 User selected filters:', {
    datasets: filters.datasets,
    modalities: filters.modalities || filters.langs,
    knowledge: filters.knowledge,
    reasoning: filters.reasoning
  });
  
  const precomputedData = await loadPrecomputedData(task, filters.showByDifficulty || false);
  
  if (!precomputedData) {
    console.warn(`❌ No precomputed data available for task: ${task}`);
    return [];
  }
  
  console.log(`📊 Available filter combinations:`, Object.keys(precomputedData.filterMappings));
  console.log(`📊 Sample filter mapping:`, Object.entries(precomputedData.filterMappings).slice(0, 3));
  
  // Use the new filter matching function
  const matchingCombination = findMatchingCombination(filters, precomputedData.filterMappings);
  
  if (!matchingCombination) {
    console.warn(`⚠️ No matching combination found for filters - returning empty results (this is correct behavior)`);
    console.log(`Available combinations:`, Object.keys(precomputedData.filterMappings));
    
    // Try to find partial matches for debugging
    console.log(`🔍 Debugging filter matching:`);
    for (const [key, mapping] of Object.entries(precomputedData.filterMappings).slice(0, 5)) {
      console.log(`  ${key}:`, mapping);
    }
    
    // Return empty results - DO NOT fallback to 'overall'
    return [];
  }
  
  console.log(`🎯 Found matching combination: "${matchingCombination}"`);
  
  // CRITICAL FIX: Check if the combination actually has data in any model
  let hasAnyData = false;
  for (const [modelName, modelData] of Object.entries(precomputedData.data)) {
    if (modelData[matchingCombination]) {
      hasAnyData = true;
      break;
    }
  }
  
  if (!hasAnyData) {
    console.warn(`⚠️ Combination "${matchingCombination}" exists in filterMappings but has no actual data - returning empty results`);
    console.log(`🔍 Available data combinations for first model:`, Object.keys(Object.values(precomputedData.data)[0] || {}));
    return [];
  }
  
  // Collect results from all models for this combination
  const results: PrecomputedResult[] = [];
  
  for (const [modelName, modelData] of Object.entries(precomputedData.data)) {
    if (modelData[matchingCombination]) {
      const combinationData = modelData[matchingCombination];
          results.push({
            ...combinationData,
        model: modelName, // Override with the correct model name
          });
        }
      }
      
  console.log(`✅ Found ${results.length} results for combination "${matchingCombination}"`);
  console.log(`📊 Sample result:`, results[0]);
  
  return results;
} 