import { 
  IDataSourceFactory, 
  IFileDataSource, 
  IPrecomputedDataSource, 
  IDataSource 
} from './interfaces';
import { FileSystemDataSource } from './implementations/FileSystemDataSource';
import { PrecomputedDataSource } from './implementations/PrecomputedDataSource';
import { GitHubDataSource } from './implementations/GitHubDataSource';

/**
 * Factory for creating data source instances
 */
export class DataSourceFactory implements IDataSourceFactory {
  private static instance: DataSourceFactory;
  private fileSystemDataSource?: IFileDataSource;
  private precomputedDataSource?: IPrecomputedDataSource;
  private githubDataSource?: IDataSource;

  private constructor() {}

  static getInstance(): DataSourceFactory {
    if (!DataSourceFactory.instance) {
      DataSourceFactory.instance = new DataSourceFactory();
    }
    return DataSourceFactory.instance;
  }

  createFileSystemDataSource(): IFileDataSource {
    if (!this.fileSystemDataSource) {
      this.fileSystemDataSource = new FileSystemDataSource();
    }
    return this.fileSystemDataSource;
  }

  createPrecomputedDataSource(): IPrecomputedDataSource {
    if (!this.precomputedDataSource) {
      this.precomputedDataSource = new PrecomputedDataSource();
    }
    return this.precomputedDataSource;
  }

  createGitHubDataSource(): IDataSource {
    if (!this.githubDataSource) {
      this.githubDataSource = new GitHubDataSource();
    }
    return this.githubDataSource;
  }

  /**
   * Create all available data sources
   */
  createAllDataSources(): IDataSource[] {
    return [
      this.createPrecomputedDataSource(),
      this.createFileSystemDataSource(),
      this.createGitHubDataSource()
    ];
  }

  /**
   * Reset all cached instances (useful for testing)
   */
  reset(): void {
    this.fileSystemDataSource = undefined;
    this.precomputedDataSource = undefined;
    this.githubDataSource = undefined;
  }
} 