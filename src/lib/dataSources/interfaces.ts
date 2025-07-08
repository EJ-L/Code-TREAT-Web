import { ResultEntry, TaskType, FilterOptions } from '../types';

/**
 * Configuration for data loading operations
 */
export interface DataLoadConfig {
  batchSize?: number;
  maxConcurrency?: number;
  useCache?: boolean;
  timeout?: number;
}

/**
 * Metadata about a data source
 */
export interface DataSourceMetadata {
  name: string;
  type: 'filesystem' | 'precomputed' | 'github' | 'api';
  version: string;
  supportedTasks: TaskType[];
  cacheable: boolean;
  priority: number; // Higher priority sources are preferred
}

/**
 * Result of a data loading operation
 */
export interface DataLoadResult {
  data: ResultEntry[];
  metadata: {
    source: string;
    loadTime: number;
    entriesCount: number;
    fromCache: boolean;
    errors?: string[];
  };
}

/**
 * Base interface for all data sources
 */
export interface IDataSource {
  readonly metadata: DataSourceMetadata;
  
  /**
   * Initialize the data source
   */
  initialize(config?: DataLoadConfig): Promise<void>;
  
  /**
   * Check if the data source is available and ready
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Load all data from this source
   */
  loadAll(config?: DataLoadConfig): Promise<DataLoadResult>;
  
  /**
   * Load data filtered by task
   */
  loadByTask(task: TaskType, config?: DataLoadConfig): Promise<DataLoadResult>;
  
  /**
   * Load data filtered by multiple criteria
   */
  loadByFilters(filters: FilterOptions, config?: DataLoadConfig): Promise<DataLoadResult>;
  
  /**
   * Clear any cached data
   */
  clearCache(): Promise<void>;
  
  /**
   * Get health status of the data source
   */
  getHealthStatus(): Promise<DataSourceHealth>;
}

/**
 * Health status of a data source
 */
export interface DataSourceHealth {
  isHealthy: boolean;
  lastCheck: Date;
  errors: string[];
  metrics: {
    responseTime?: number;
    cacheHitRate?: number;
    errorRate?: number;
  };
}

/**
 * Interface for precomputed data sources that support optimized filtering
 */
export interface IPrecomputedDataSource extends IDataSource {
  /**
   * Get available filter combinations for a task
   */
  getAvailableFilterCombinations(task: TaskType): Promise<Record<string, any>>;
  
  /**
   * Load precomputed results for specific filters
   */
  loadPrecomputedResults(task: TaskType, filters: FilterOptions): Promise<DataLoadResult>;
  
  /**
   * Load precomputed results in leaderboard-ready format
   */
  getLeaderboardResults(task: TaskType, filters: FilterOptions): Promise<any[]>;
}

/**
 * Interface for file-based data sources
 */
export interface IFileDataSource extends IDataSource {
  /**
   * Get list of available files for a task
   */
  getAvailableFiles(task: TaskType): Promise<string[]>;
  
  /**
   * Load specific file
   */
  loadFile(filePath: string, config?: DataLoadConfig): Promise<DataLoadResult>;
}

/**
 * Cache interface for data sources
 */
export interface IDataCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
}

/**
 * Data source factory interface
 */
export interface IDataSourceFactory {
  createFileSystemDataSource(): IFileDataSource;
  createPrecomputedDataSource(): IPrecomputedDataSource;
  createGitHubDataSource(): IDataSource;
} 