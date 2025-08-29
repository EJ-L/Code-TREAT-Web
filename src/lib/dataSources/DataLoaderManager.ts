import { 
  IDataSource, 
  DataLoadConfig, 
  DataLoadResult,
  DataSourceHealth,
  IPrecomputedDataSource
} from './interfaces';
import { TaskType, FilterOptions } from '../types';
import { DataSourceFactory } from './DataSourceFactory';

export type DataLoadStrategy = 'precomputed-first' | 'filesystem-first' | 'all-sources' | 'precomputed-only' | 'filesystem-only';

export interface DataLoaderConfig extends DataLoadConfig {
  strategy?: DataLoadStrategy;
  fallbackToMockData?: boolean;
  enableCaching?: boolean;
}

/**
 * Central manager that coordinates data loading from multiple sources
 */
export class DataLoaderManager {
  private static instance: DataLoaderManager;
  private dataSources: IDataSource[] = [];
  private factory: DataSourceFactory;
  private isInitialized = false;
  private initializationPromise?: Promise<void>;

  private constructor() {
    this.factory = DataSourceFactory.getInstance();
  }

  static getInstance(): DataLoaderManager {
    if (!DataLoaderManager.instance) {
      DataLoaderManager.instance = new DataLoaderManager();
    }
    return DataLoaderManager.instance;
  }

  /**
   * Initialize all data sources
   */
  async initialize(config?: DataLoaderConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize(config);
    await this.initializationPromise;
    this.isInitialized = true;
  }

  private async doInitialize(config?: DataLoaderConfig): Promise<void> {
    // Create all data sources
    this.dataSources = this.factory.createAllDataSources();

    // Initialize each data source in parallel
    const initPromises = this.dataSources.map(async (source) => {
      try {
        await source.initialize(config);
        console.log(`✅ Initialized data source: ${source.metadata.name}`);
      } catch (error) {
        console.warn(`⚠️ Failed to initialize data source ${source.metadata.name}:`, error);
      }
    });

    await Promise.allSettled(initPromises);

    // Sort data sources by priority (higher priority first)
    this.dataSources.sort((a, b) => b.metadata.priority - a.metadata.priority);
  }

  /**
   * Load all data using the specified strategy
   */
  async loadAll(config?: DataLoaderConfig): Promise<DataLoadResult> {
    await this.initialize(config);

    const strategy = config?.strategy || 'precomputed-first';
    
    switch (strategy) {
      case 'precomputed-only':
        return this.loadFromPrecomputedOnly(config);
      case 'filesystem-only':
        return this.loadFromFileSystemOnly(config);
      case 'precomputed-first':
        return this.loadWithPrecomputedFirst(config);
      case 'filesystem-first':
        return this.loadWithFileSystemFirst(config);
      case 'all-sources':
        return this.loadFromAllSources(config);
      default:
        return this.loadWithPrecomputedFirst(config);
    }
  }

  /**
   * Load data for a specific task
   */
  async loadByTask(task: TaskType, config?: DataLoaderConfig): Promise<DataLoadResult> {
    await this.initialize(config);

    const strategy = config?.strategy || 'precomputed-first';
    const availableSources = this.getAvailableSourcesForTask(task);

    if (availableSources.length === 0) {
      return this.createEmptyResult('no-source', ['No available data sources for task']);
    }

    switch (strategy) {
      case 'precomputed-only':
        return this.loadTaskFromPrecomputed(task, config);
      case 'filesystem-only':
        return this.loadTaskFromFileSystem(task, config);
      default:
        return this.loadTaskWithFallback(task, availableSources, config);
    }
  }

  /**
   * Load data with filters - delegates to precomputed source for optimized filtering
   */
  async loadByFilters(filters: FilterOptions, config?: DataLoaderConfig): Promise<DataLoadResult> {
    await this.initialize(config);

    // For filtered queries, try precomputed first as it's optimized for this
    const precomputedSource = this.getPrecomputedDataSource();
    
    if (precomputedSource && await precomputedSource.isAvailable()) {
      try {
        const result = await precomputedSource.loadByFilters(filters, config);
        
        // If precomputed returns data, use it
        if (result.data.length > 0) {
          return result;
        }
        
        // If no data from precomputed, fall back to filesystem
        console.log('No precomputed data found, falling back to filesystem...');
      } catch (error) {
        console.warn('Error loading from precomputed source:', error);
      }
    }

    // Fallback to filesystem source
    const fileSystemSource = this.getFileSystemDataSource();
    if (fileSystemSource && await fileSystemSource.isAvailable()) {
      try {
        return await fileSystemSource.loadByFilters(filters, config);
      } catch (error) {
        console.error('Error loading from filesystem source:', error);
      }
    }

    // If all else fails, return empty result
    return this.createEmptyResult('all-sources-failed', ['All data sources failed or unavailable']);
  }

  /**
   * Get precomputed results for specific filters (optimized path)
   */
  async getPrecomputedResults(task: TaskType, filters: FilterOptions): Promise<any[]> {
    await this.initialize();

    const precomputedSource = this.getPrecomputedDataSource();
    if (!precomputedSource || !await precomputedSource.isAvailable()) {
      return [];
    }

    try {
      // Use the new method that returns leaderboard-ready format
      return await precomputedSource.getLeaderboardResults(task, filters);
    } catch (error) {
      console.error('Error getting precomputed results:', error);
      return [];
    }
  }

  /**
   * Get available filter combinations for a task
   */
  async getAvailableFilterCombinations(task: TaskType): Promise<Record<string, any>> {
    await this.initialize();

    const precomputedSource = this.getPrecomputedDataSource();
    if (!precomputedSource || !await precomputedSource.isAvailable()) {
      return {};
    }

    try {
      return await precomputedSource.getAvailableFilterCombinations(task);
    } catch (error) {
      console.error('Error getting filter combinations:', error);
      return {};
    }
  }

  /**
   * Get health status of all data sources
   */
  async getHealthStatus(): Promise<Record<string, DataSourceHealth>> {
    const healthStatuses: Record<string, DataSourceHealth> = {};

    for (const source of this.dataSources) {
      try {
        healthStatuses[source.metadata.name] = await source.getHealthStatus();
      } catch (error) {
        healthStatuses[source.metadata.name] = {
          isHealthy: false,
          lastCheck: new Date(),
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          metrics: {}
        };
      }
    }

    return healthStatuses;
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    const clearPromises = this.dataSources.map(source => source.clearCache());
    await Promise.allSettled(clearPromises);
  }

  /**
   * Get statistics about data sources
   */
  getDataSourceStats() {
    return {
      totalSources: this.dataSources.length,
      initializedSources: this.dataSources.length,
      sourcesByType: this.dataSources.reduce((acc, source) => {
        acc[source.metadata.type] = (acc[source.metadata.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      sourcesByPriority: this.dataSources.map(source => ({
        name: source.metadata.name,
        priority: source.metadata.priority,
        type: source.metadata.type
      }))
    };
  }

  // Private helper methods
  private async loadFromPrecomputedOnly(config?: DataLoaderConfig): Promise<DataLoadResult> {
    const precomputedSource = this.getPrecomputedDataSource();
    
    if (!precomputedSource || !await precomputedSource.isAvailable()) {
      return this.createEmptyResult('precomputed-unavailable', ['Precomputed data source not available']);
    }

    return await precomputedSource.loadAll(config);
  }

  private async loadFromFileSystemOnly(config?: DataLoaderConfig): Promise<DataLoadResult> {
    const fileSystemSource = this.getFileSystemDataSource();
    
    if (!fileSystemSource || !await fileSystemSource.isAvailable()) {
      return this.createEmptyResult('filesystem-unavailable', ['File system data source not available']);
    }

    return await fileSystemSource.loadAll(config);
  }

  private async loadWithPrecomputedFirst(config?: DataLoaderConfig): Promise<DataLoadResult> {
    // Try precomputed first
    try {
      const result = await this.loadFromPrecomputedOnly(config);
      if (result.data.length > 0) {
        return result;
      }
    } catch (error) {
      console.warn('Precomputed data loading failed:', error);
    }

    // Fall back to filesystem
    return this.loadFromFileSystemOnly(config);
  }

  private async loadWithFileSystemFirst(config?: DataLoaderConfig): Promise<DataLoadResult> {
    // Try filesystem first
    try {
      const result = await this.loadFromFileSystemOnly(config);
      if (result.data.length > 0) {
        return result;
      }
    } catch (error) {
      console.warn('Filesystem data loading failed:', error);
    }

    // Fall back to precomputed
    return this.loadFromPrecomputedOnly(config);
  }

  private async loadFromAllSources(config?: DataLoaderConfig): Promise<DataLoadResult> {
    const results: DataLoadResult[] = [];
    const errors: string[] = [];

    for (const source of this.dataSources) {
      if (await source.isAvailable()) {
        try {
          const result = await source.loadAll(config);
          results.push(result);
          if (result.metadata.errors) {
            errors.push(...result.metadata.errors);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${source.metadata.name}: ${errorMessage}`);
        }
      }
    }

    // Combine all results
    const allData = results.flatMap(r => r.data);
    const totalLoadTime = Math.max(...results.map(r => r.metadata.loadTime));

    return {
      data: allData,
      metadata: {
        source: 'all-sources',
        loadTime: totalLoadTime,
        entriesCount: allData.length,
        fromCache: false,
        errors: errors.length > 0 ? errors : undefined
      }
    };
  }

  private async loadTaskFromPrecomputed(task: TaskType, config?: DataLoaderConfig): Promise<DataLoadResult> {
    const precomputedSource = this.getPrecomputedDataSource();
    
    if (!precomputedSource || !await precomputedSource.isAvailable()) {
      return this.createEmptyResult('precomputed-unavailable', ['Precomputed data source not available']);
    }

    return await precomputedSource.loadByTask(task, config);
  }

  private async loadTaskFromFileSystem(task: TaskType, config?: DataLoaderConfig): Promise<DataLoadResult> {
    const fileSystemSource = this.getFileSystemDataSource();
    
    if (!fileSystemSource || !await fileSystemSource.isAvailable()) {
      return this.createEmptyResult('filesystem-unavailable', ['File system data source not available']);
    }

    return await fileSystemSource.loadByTask(task, config);
  }

  private async loadTaskWithFallback(
    task: TaskType, 
    sources: IDataSource[], 
    config?: DataLoaderConfig
  ): Promise<DataLoadResult> {
    for (const source of sources) {
      try {
        const result = await source.loadByTask(task, config);
        if (result.data.length > 0) {
          return result;
        }
      } catch (error) {
        console.warn(`Failed to load task ${task} from ${source.metadata.name}:`, error);
      }
    }

    return this.createEmptyResult('all-sources-empty', [`No data found for task ${task} in any source`]);
  }

  private getAvailableSourcesForTask(task: TaskType): IDataSource[] {
    return this.dataSources.filter(source => 
      source.metadata.supportedTasks.includes(task)
    );
  }

  private getPrecomputedDataSource(): IPrecomputedDataSource | null {
    const source = this.dataSources.find(s => s.metadata.type === 'precomputed');
    return source as IPrecomputedDataSource || null;
  }

  private getFileSystemDataSource(): IDataSource | null {
    return this.dataSources.find(s => s.metadata.type === 'filesystem') || null;
  }

  private createEmptyResult(source: string, errors?: string[]): DataLoadResult {
    return {
      data: [],
      metadata: {
        source,
        loadTime: 0,
        entriesCount: 0,
        fromCache: false,
        errors
      }
    };
  }
} 