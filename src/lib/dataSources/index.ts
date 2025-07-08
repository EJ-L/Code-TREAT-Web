// Core interfaces and types
export type {
  IDataSource,
  IFileDataSource,
  IPrecomputedDataSource,
  IDataCache,
  IDataSourceFactory,
  DataLoadConfig,
  DataLoadResult,
  DataSourceMetadata,
  DataSourceHealth
} from './interfaces';

// Base classes
export { BaseDataSource } from './base/BaseDataSource';
export { MemoryCache } from './base/MemoryCache';

// Data source implementations
export { FileSystemDataSource } from './implementations/FileSystemDataSource';
export { PrecomputedDataSource } from './implementations/PrecomputedDataSource';
export { GitHubDataSource } from './implementations/GitHubDataSource';

// Factory and manager
export { DataSourceFactory } from './DataSourceFactory';
export { DataLoaderManager } from './DataLoaderManager';
export type { DataLoadStrategy, DataLoaderConfig } from './DataLoaderManager';

// Re-export main data loader functions for convenience
export {
  initializeDataLoader,
  loadAllData,
  loadTaskData,
  loadFilteredData,
  getPrecomputedResults,
  getAvailableFilterCombinations,
  getDataSourceHealthStatus,
  getDataLoaderStats,
  clearAllCaches,
  processResult
} from '../dataLoader'; 