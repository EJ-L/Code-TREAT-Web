import { 
  IFileDataSource, 
  DataLoadConfig, 
  DataLoadResult,
  DataSourceMetadata 
} from '../interfaces';
import { BaseDataSource } from '../base/BaseDataSource';
import { ResultEntry, TaskType, FilterOptions } from '../../types';

/**
 * Task directories mapping
 */
const TASK_DIRECTORIES: Record<string, string> = {
  'code generation': 'data/code-generation',
  'code translation': 'data/code-translation',
  'code summarization': 'data/code-summarization',
  'vulnerability detection': 'data/vulnerability-detection',
  'code review': 'data/code-review',
  'input prediction': 'data/input_prediction',
  'output prediction': 'data/output_prediction',
  'code-web': 'data/code-web',
  'interaction-2-code': 'data/interaction-2-code',
  'code-robustness': 'data/code-robustness',
  'mr-web': 'data/mr-web'
};

/**
 * File system data source for loading JSONL files
 */
export class FileSystemDataSource extends BaseDataSource implements IFileDataSource {
  private fileListCache = new Map<string, string[]>();

  constructor() {
    const metadata: DataSourceMetadata = {
      name: 'filesystem',
      type: 'filesystem',
      version: '1.0.0',
      supportedTasks: Object.keys(TASK_DIRECTORIES) as TaskType[],
      cacheable: true,
      priority: 1
    };
    super(metadata);
  }

  protected async doInitialize(config?: DataLoadConfig): Promise<void> {
    // Validate that the API endpoints are available
    try {
      const testResponse = await fetch('/api/files?directory=data/code-generation');
      if (!testResponse.ok) {
        throw new Error('Files API not available');
      }
    } catch (error) {
      throw new Error(`Failed to initialize FileSystemDataSource: ${error}`);
    }
  }

  protected async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch('/api/files?directory=data/code-generation');
      return response.ok;
    } catch {
      return false;
    }
  }

  protected async doLoadAll(config?: DataLoadConfig): Promise<DataLoadResult> {
    const startTime = Date.now();
    const allData: ResultEntry[] = [];
    const errors: string[] = [];

    // Load data from all task directories
    for (const [taskType, _] of Object.entries(TASK_DIRECTORIES)) {
      try {
        const taskResult = await this.doLoadByTask(taskType as TaskType, config);
        allData.push(...taskResult.data);
        if (taskResult.metadata.errors) {
          errors.push(...taskResult.metadata.errors);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to load task ${taskType}: ${errorMessage}`);
      }
    }

    const loadTime = Date.now() - startTime;
    return this.createResult(allData, this.metadata.name, loadTime, false, errors.length > 0 ? errors : undefined);
  }

  protected async doLoadByTask(task: TaskType, config?: DataLoadConfig): Promise<DataLoadResult> {
    const startTime = Date.now();
    const directory = TASK_DIRECTORIES[task];
    
    if (!directory) {
      throw new Error(`No directory configured for task: ${task}`);
    }

    try {
      const files = await this.getAvailableFiles(task);
      const data = await this.loadFilesFromDirectory(directory, files, config);
      
      // Add task information to entries that don't have it
      const processedData = data.map(entry => ({
        ...entry,
        task: entry.task || task
      }));

      const loadTime = Date.now() - startTime;
      return this.createResult(processedData, this.metadata.name, loadTime);
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createResult([], this.metadata.name, loadTime, false, [errorMessage]);
    }
  }

  protected async doLoadByFilters(filters: FilterOptions, config?: DataLoadConfig): Promise<DataLoadResult> {
    const startTime = Date.now();
    const allData: ResultEntry[] = [];
    const errors: string[] = [];

    // Load data from tasks specified in filters
    const tasksToLoad = filters.tasks.length > 0 ? filters.tasks : Object.keys(TASK_DIRECTORIES);

    for (const task of tasksToLoad) {
      if (TASK_DIRECTORIES[task]) {
        try {
          const taskResult = await this.doLoadByTask(task as TaskType, config);
          // Apply additional filtering
          const filteredData = this.applyFilters(taskResult.data, filters);
          allData.push(...filteredData);
          
          if (taskResult.metadata.errors) {
            errors.push(...taskResult.metadata.errors);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to load task ${task}: ${errorMessage}`);
        }
      }
    }

    const loadTime = Date.now() - startTime;
    return this.createResult(allData, this.metadata.name, loadTime, false, errors.length > 0 ? errors : undefined);
  }

  async getAvailableFiles(task: TaskType): Promise<string[]> {
    const directory = TASK_DIRECTORIES[task];
    if (!directory) {
      throw new Error(`No directory configured for task: ${task}`);
    }

    // Check cache first
    if (this.fileListCache.has(directory)) {
      return this.fileListCache.get(directory)!;
    }

    try {
      const response = await fetch(`/api/files?directory=${directory}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file list: ${response.status}`);
      }

      const files: string[] = await response.json();
      const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));
      
      // Cache the result
      this.fileListCache.set(directory, jsonlFiles);
      
      return jsonlFiles;
    } catch (error) {
      throw new Error(`Failed to get available files for ${task}: ${error}`);
    }
  }

  async loadFile(filePath: string, config?: DataLoadConfig): Promise<DataLoadResult> {
    const startTime = Date.now();
    
    try {
      // Extract directory and filename from path
      const parts = filePath.split('/');
      const fileName = parts.pop();
      const directory = parts.join('/');

      const response = await fetch(`/api/files?directory=${directory}&file=${fileName}`);
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.status}`);
      }

      const responseData = await response.json();
      
      if (!responseData.data || !Array.isArray(responseData.data)) {
        throw new Error('Invalid data format - expected JSONL format with data array');
      }

      const loadTime = Date.now() - startTime;
      return this.createResult(responseData.data, this.metadata.name, loadTime);
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createResult([], this.metadata.name, loadTime, false, [errorMessage]);
    }
  }

  private async loadFilesFromDirectory(
    directory: string, 
    files: string[], 
    config?: DataLoadConfig
  ): Promise<ResultEntry[]> {
    const batchSize = config?.batchSize || 5;
    const maxConcurrency = config?.maxConcurrency || 3;
    const allData: ResultEntry[] = [];

    // Process files in batches to avoid overwhelming the API
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      // Limit concurrency within each batch
      const concurrencyLimit = Math.min(batch.length, maxConcurrency);
      const chunks: string[][] = [];
      for (let j = 0; j < batch.length; j += concurrencyLimit) {
        chunks.push(batch.slice(j, j + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(
          chunk.map(async (file) => {
            try {
              const result = await this.loadFile(`${directory}/${file}`, config);
              return result.data;
            } catch (error) {
              console.warn(`Failed to load file ${file}:`, error);
              return [];
            }
          })
        );

        // Collect successful results
        for (const result of chunkResults) {
          if (result.status === 'fulfilled') {
            allData.push(...result.value);
          }
        }
      }
    }

    return allData;
  }

  private applyFilters(data: ResultEntry[], filters: FilterOptions): ResultEntry[] {
    return data.filter(entry => {
      // Apply dataset filter
      if (filters.datasets.length > 0 && entry.dataset) {
        const datasetMatch = filters.datasets.some(d => 
          entry.dataset.toLowerCase().includes(d.toLowerCase())
        );
        if (!datasetMatch) return false;
      }

      // Apply language filter
      if (filters.langs.length > 0 && entry.lang) {
        const langMatch = filters.langs.includes(entry.lang);
        if (!langMatch) return false;
      }

      // Apply framework filter (for code-web)
      if (filters.framework && filters.framework.length > 0 && entry.framework) {
        const frameworkMatch = filters.framework.includes(entry.framework);
        if (!frameworkMatch) return false;
      }

      return true;
    });
  }

  async clearCache(): Promise<void> {
    await super.clearCache();
    this.fileListCache.clear();
  }
} 