import { 
  IDataSource, 
  DataSourceMetadata, 
  DataLoadConfig, 
  DataLoadResult,
  DataSourceHealth,
  IDataCache 
} from '../interfaces';
import { ResultEntry, TaskType, FilterOptions } from '../../types';
import { MemoryCache } from './MemoryCache';

/**
 * Base class for all data sources with common functionality
 */
export abstract class BaseDataSource implements IDataSource {
  protected cache: IDataCache;
  protected healthStatus: DataSourceHealth;
  protected isInitialized = false;

  constructor(
    public readonly metadata: DataSourceMetadata,
    cache?: IDataCache
  ) {
    this.cache = cache || new MemoryCache();
    this.healthStatus = {
      isHealthy: false,
      lastCheck: new Date(),
      errors: [],
      metrics: {}
    };
  }

  /**
   * Initialize the data source
   */
  async initialize(config?: DataLoadConfig): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.doInitialize(config);
      this.isInitialized = true;
      this.updateHealthStatus(true, [], { responseTime: Date.now() - startTime });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      this.updateHealthStatus(false, [errorMessage], { responseTime: Date.now() - startTime });
      throw error;
    }
  }

  /**
   * Check if the data source is available and ready
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const available = await this.checkAvailability();
      this.updateHealthStatus(available, available ? [] : ['Data source not available']);
      return available;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown availability check error';
      this.updateHealthStatus(false, [errorMessage]);
      return false;
    }
  }

  /**
   * Load all data from this source with caching
   */
  async loadAll(config?: DataLoadConfig): Promise<DataLoadResult> {
    const useCache = config?.useCache ?? this.metadata.cacheable;
    const cacheKey = `${this.metadata.name}:loadAll`;
    
    if (useCache) {
      const cached = await this.cache.get<DataLoadResult>(cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            fromCache: true
          }
        };
      }
    }

    const result = await this.executeWithErrorHandling(
      () => this.doLoadAll(config),
      'loadAll'
    );

    if (useCache && result.data.length > 0) {
      await this.cache.set(cacheKey, result, this.getCacheTTL());
    }

    return result;
  }

  /**
   * Load data filtered by task with caching
   */
  async loadByTask(task: TaskType, config?: DataLoadConfig): Promise<DataLoadResult> {
    const useCache = config?.useCache ?? this.metadata.cacheable;
    const cacheKey = `${this.metadata.name}:loadByTask:${task}`;
    
    if (useCache) {
      const cached = await this.cache.get<DataLoadResult>(cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            fromCache: true
          }
        };
      }
    }

    const result = await this.executeWithErrorHandling(
      () => this.doLoadByTask(task, config),
      'loadByTask'
    );

    if (useCache && result.data.length > 0) {
      await this.cache.set(cacheKey, result, this.getCacheTTL());
    }

    return result;
  }

  /**
   * Load data filtered by multiple criteria
   */
  async loadByFilters(filters: FilterOptions, config?: DataLoadConfig): Promise<DataLoadResult> {
    const useCache = config?.useCache ?? this.metadata.cacheable;
    const cacheKey = `${this.metadata.name}:loadByFilters:${this.serializeFilters(filters)}`;
    
    if (useCache) {
      const cached = await this.cache.get<DataLoadResult>(cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            fromCache: true
          }
        };
      }
    }

    const result = await this.executeWithErrorHandling(
      () => this.doLoadByFilters(filters, config),
      'loadByFilters'
    );

    if (useCache && result.data.length > 0) {
      await this.cache.set(cacheKey, result, this.getCacheTTL());
    }

    return result;
  }

  /**
   * Clear any cached data
   */
  async clearCache(): Promise<void> {
    const keys = await this.cache.keys(`${this.metadata.name}:*`);
    await Promise.all(keys.map(key => this.cache.delete(key)));
  }

  /**
   * Get health status of the data source
   */
  async getHealthStatus(): Promise<DataSourceHealth> {
    return { ...this.healthStatus };
  }

  // Abstract methods that must be implemented by subclasses
  protected abstract doInitialize(config?: DataLoadConfig): Promise<void>;
  protected abstract checkAvailability(): Promise<boolean>;
  protected abstract doLoadAll(config?: DataLoadConfig): Promise<DataLoadResult>;
  protected abstract doLoadByTask(task: TaskType, config?: DataLoadConfig): Promise<DataLoadResult>;
  protected abstract doLoadByFilters(filters: FilterOptions, config?: DataLoadConfig): Promise<DataLoadResult>;

  // Helper methods
  protected getCacheTTL(): number {
    return 5 * 60 * 1000; // 5 minutes default
  }

  protected serializeFilters(filters: FilterOptions): string {
    return JSON.stringify(filters, Object.keys(filters).sort());
  }

  protected updateHealthStatus(
    isHealthy: boolean, 
    errors: string[] = [], 
    metrics: Record<string, number> = {}
  ): void {
    this.healthStatus = {
      isHealthy,
      lastCheck: new Date(),
      errors: [...this.healthStatus.errors, ...errors].slice(-10), // Keep last 10 errors
      metrics: { ...this.healthStatus.metrics, ...metrics }
    };
  }

  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const responseTime = Date.now() - startTime;
      this.updateHealthStatus(true, [], { responseTime });
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : `Unknown error in ${operationName}`;
      this.updateHealthStatus(false, [errorMessage], { responseTime });
      throw error;
    }
  }

  protected createResult(
    data: ResultEntry[], 
    source: string, 
    loadTime: number, 
    fromCache = false,
    errors?: string[]
  ): DataLoadResult {
    return {
      data,
      metadata: {
        source,
        loadTime,
        entriesCount: data.length,
        fromCache,
        errors
      }
    };
  }
} 