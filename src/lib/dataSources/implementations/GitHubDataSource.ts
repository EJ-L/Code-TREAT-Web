import { 
  IDataSource, 
  DataLoadConfig, 
  DataLoadResult,
  DataSourceMetadata 
} from '../interfaces';
import { BaseDataSource } from '../base/BaseDataSource';
import { TaskType, FilterOptions } from '../../types';

/**
 * GitHub data source for downloading data from remote repositories
 * Currently disabled but maintains structure for future use
 */
export class GitHubDataSource extends BaseDataSource implements IDataSource {
  private isGitHubEnabled = false; // Currently disabled

  constructor() {
    const metadata: DataSourceMetadata = {
      name: 'github',
      type: 'github',
      version: '1.0.0',
      supportedTasks: [] as TaskType[], // Empty since disabled
      cacheable: false, // Don't cache GitHub downloads
      priority: 0 // Lowest priority since disabled
    };
    super(metadata);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async doInitialize(config?: DataLoadConfig): Promise<void> {
    // Check if GitHub data downloading is enabled
    try {
      const response = await fetch('/api/download-github-data');
      if (response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result = await response.json();
        // GitHub downloading is currently disabled
        this.isGitHubEnabled = false;
      }
    } catch (error) {
      throw new Error(`Failed to initialize GitHubDataSource: ${error}`);
    }
  }

  protected async checkAvailability(): Promise<boolean> {
    if (!this.isGitHubEnabled) {
      return false;
    }

    try {
      const response = await fetch('/api/download-github-data');
      return response.ok;
    } catch {
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async doLoadAll(config?: DataLoadConfig): Promise<DataLoadResult> {
    const startTime = Date.now();
    
    if (!this.isGitHubEnabled) {
      return this.createResult(
        [], 
        this.metadata.name, 
        Date.now() - startTime, 
        false, 
        ['GitHub data downloading is disabled']
      );
    }

    // Future implementation would download and process GitHub data here
    const loadTime = Date.now() - startTime;
    return this.createResult([], this.metadata.name, loadTime, false, ['GitHub data loading not implemented']);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async doLoadByTask(task: TaskType, config?: DataLoadConfig): Promise<DataLoadResult> {
    const startTime = Date.now();
    
    if (!this.isGitHubEnabled) {
      return this.createResult(
        [], 
        this.metadata.name, 
        Date.now() - startTime, 
        false, 
        ['GitHub data downloading is disabled']
      );
    }

    // Future implementation would download task-specific data from GitHub
    const loadTime = Date.now() - startTime;
    return this.createResult([], this.metadata.name, loadTime, false, ['GitHub data loading not implemented']);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async doLoadByFilters(filters: FilterOptions, config?: DataLoadConfig): Promise<DataLoadResult> {
    const startTime = Date.now();
    
    if (!this.isGitHubEnabled) {
      return this.createResult(
        [], 
        this.metadata.name, 
        Date.now() - startTime, 
        false, 
        ['GitHub data downloading is disabled']
      );
    }

    // Future implementation would download filtered data from GitHub
    const loadTime = Date.now() - startTime;
    return this.createResult([], this.metadata.name, loadTime, false, ['GitHub data loading not implemented']);
  }

  /**
   * Attempt to download GitHub data (currently disabled)
   */
  async downloadGitHubData(): Promise<boolean> {
    if (!this.isGitHubEnabled) {
      return false;
    }

    try {
      const response = await fetch('/api/download-github-data', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.success || false;
      }
      
      return false;
    } catch (error) {
      console.error('Error downloading GitHub data:', error);
      return false;
    }
  }

  /**
   * Check if local GitHub data exists
   */
  async hasLocalGitHubData(): Promise<boolean> {
    try {
      const response = await fetch('/api/download-github-data');
      if (response.ok) {
        const result = await response.json();
        return result.hasLocalData || false;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Enable GitHub data source (for future use)
   */
  enableGitHubData(): void {
    this.isGitHubEnabled = true;
    // Update supported tasks when enabled
    this.metadata.supportedTasks = [
      'code generation',
      'code translation',
      'code summarization',
      'code review',
      'vulnerability detection'
    ] as TaskType[];
    this.metadata.priority = 2; // Medium priority when enabled
  }

  /**
   * Disable GitHub data source
   */
  disableGitHubData(): void {
    this.isGitHubEnabled = false;
    this.metadata.supportedTasks = [];
    this.metadata.priority = 0;
  }

  /**
   * Get GitHub data source status
   */
  getGitHubStatus(): { enabled: boolean; hasLocalData: boolean } {
    return {
      enabled: this.isGitHubEnabled,
      hasLocalData: false // Would need to implement actual check
    };
  }

  protected getCacheTTL(): number {
    return 0; // Don't cache GitHub downloads
  }
} 