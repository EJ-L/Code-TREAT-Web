import { 
  IPrecomputedDataSource, 
  DataLoadConfig, 
  DataLoadResult,
  DataSourceMetadata 
} from '../interfaces';
import { BaseDataSource } from '../base/BaseDataSource';
import { ResultEntry, TaskType, FilterOptions } from '../../types';

/**
 * Interface for precomputed data structure
 */
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

interface PrecomputedResult {
  rank: number;
  model: string;
  model_url?: string;
  [key: string]: any; // For metrics like pass@1, LLM Judge, etc.
}

/**
 * Precomputed data source for optimized consolidated results
 */
export class PrecomputedDataSource extends BaseDataSource implements IPrecomputedDataSource {
  private precomputedCache = new Map<string, PrecomputedData>();

  constructor() {
    const metadata: DataSourceMetadata = {
      name: 'precomputed',
      type: 'precomputed', 
      version: '1.0.0',
      supportedTasks: [
        'code generation',
        'code translation', 
        'code summarization',
        'code review',
        'vulnerability detection'
      ] as TaskType[],
      cacheable: true,
      priority: 3 // Higher priority than filesystem
    };
    super(metadata);
  }

  protected async doInitialize(config?: DataLoadConfig): Promise<void> {
    // Validate that the direct-files API is available
    try {
      const testResponse = await fetch('/api/direct-files?file=data/precomputed/code-generation_consolidated.json');
      if (!testResponse.ok && testResponse.status !== 404) {
        throw new Error('Direct files API not available');
      }
    } catch (error) {
      throw new Error(`Failed to initialize PrecomputedDataSource: ${error}`);
    }
  }

  protected async checkAvailability(): Promise<boolean> {
    try {
      // Check if we can access the precomputed directory
      const response = await fetch('/api/direct-files?file=data/precomputed/code-generation_consolidated.json');
      return response.ok || response.status === 404; // 404 is acceptable - file might not exist
    } catch {
      return false;
    }
  }

  protected async doLoadAll(config?: DataLoadConfig): Promise<DataLoadResult> {
    const startTime = Date.now();
    const allData: ResultEntry[] = [];
    const errors: string[] = [];

    // Load precomputed data for all supported tasks
    for (const task of this.metadata.supportedTasks) {
      try {
        const taskResult = await this.doLoadByTask(task, config);
        allData.push(...taskResult.data);
        if (taskResult.metadata.errors) {
          errors.push(...taskResult.metadata.errors);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to load precomputed data for task ${task}: ${errorMessage}`);
      }
    }

    const loadTime = Date.now() - startTime;
    return this.createResult(allData, this.metadata.name, loadTime, false, errors.length > 0 ? errors : undefined);
  }

  protected async doLoadByTask(task: TaskType, config?: DataLoadConfig): Promise<DataLoadResult> {
    const startTime = Date.now();

    try {
      const precomputedData = await this.loadPrecomputedData(task, false);
      if (!precomputedData) {
        return this.createResult([], this.metadata.name, Date.now() - startTime, false, [`No precomputed data available for task: ${task}`]);
      }

      // Convert precomputed results to ResultEntry format
      const resultEntries = this.convertPrecomputedToResultEntries(precomputedData, task);
      
      const loadTime = Date.now() - startTime;
      return this.createResult(resultEntries, this.metadata.name, loadTime);
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

    // For precomputed data, we need to load task by task and apply filters
    const tasksToLoad = filters.tasks.length > 0 ? 
      filters.tasks.filter(t => this.metadata.supportedTasks.includes(t as TaskType)) : 
      this.metadata.supportedTasks;

    for (const task of tasksToLoad) {
      try {
        const precomputedResults = await this.loadPrecomputedResults(task as TaskType, filters);
        allData.push(...precomputedResults.data);
        
        if (precomputedResults.metadata.errors) {
          errors.push(...precomputedResults.metadata.errors);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to load filtered precomputed data for task ${task}: ${errorMessage}`);
      }
    }

    const loadTime = Date.now() - startTime;
    return this.createResult(allData, this.metadata.name, loadTime, false, errors.length > 0 ? errors : undefined);
  }

  async getAvailableFilterCombinations(task: TaskType): Promise<Record<string, any>> {
    const precomputedData = await this.loadPrecomputedData(task, false);
    return precomputedData?.filterMappings || {};
  }

  /**
   * Load precomputed results in leaderboard-ready format
   */
  async getLeaderboardResults(task: TaskType, filters: FilterOptions): Promise<any[]> {
    const result = await this.loadPrecomputedResults(task, filters);
    return this.convertResultEntriesToLeaderboardFormat(result.data);
  }

  async loadPrecomputedResults(task: TaskType, filters: FilterOptions): Promise<DataLoadResult> {
    const startTime = Date.now();

    try {
      const { debug } = await import('../../debug');
      debug.dataSource(`Loading precomputed results for task: ${task}`, filters);
      
      const precomputedData = await this.loadPrecomputedData(task, filters.showByDifficulty || false);
      
      if (!precomputedData) {
        debug.dataSource(`No precomputed data available for task: ${task}`);
        return this.createResult([], this.metadata.name, Date.now() - startTime, false, [`No precomputed data available for task: ${task}`]);
      }

      debug.dataSource(`Available filterMappings:`, Object.keys(precomputedData.filterMappings));
      debug.dataSource(`Available models:`, Object.keys(precomputedData.data));

      // Find matching combination for the given filters
      const matchingCombination = this.findMatchingCombination(filters, precomputedData.filterMappings);
      
      debug.dataSource(`Found matching combination: ${matchingCombination}`);
      
      if (!matchingCombination) {
        debug.dataSource('No matching combination found for filters', filters);
        return this.createResult([], this.metadata.name, Date.now() - startTime, false, ['No matching combination found for filters']);
      }

      // Check if the combination actually has data
      let hasAnyData = false;
      for (const [modelName, modelData] of Object.entries(precomputedData.data)) {
        if (modelData[matchingCombination]) {
          hasAnyData = true;
          break;
        }
      }

      debug.dataSource(`Combination "${matchingCombination}" has data: ${hasAnyData}`);

      if (!hasAnyData) {
        debug.dataSource(`Combination "${matchingCombination}" exists in filterMappings but has no actual data`);
        return this.createResult([], this.metadata.name, Date.now() - startTime, false, [`Combination "${matchingCombination}" exists in filterMappings but has no actual data`]);
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

      debug.dataSource(`Collected ${results.length} results for combination "${matchingCombination}"`);

      // Convert to ResultEntry format
      const resultEntries = results.map(result => this.convertPrecomputedResultToEntry(result, task, matchingCombination));

      debug.dataSource(`Converted to ${resultEntries.length} result entries`);

      const loadTime = Date.now() - startTime;
      return this.createResult(resultEntries, this.metadata.name, loadTime);
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createResult([], this.metadata.name, loadTime, false, [errorMessage]);
    }
  }

  private async loadPrecomputedData(task: string, showByDifficulty: boolean): Promise<PrecomputedData | null> {
    const taskKey = task.replace(/\s+/g, '-');
    const cacheKey = showByDifficulty ? `${taskKey}_difficulty` : taskKey;
    
    // Check cache first
    if (this.precomputedCache.has(cacheKey)) {
      return this.precomputedCache.get(cacheKey)!;
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
      this.precomputedCache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error(`Error loading precomputed data for ${task}:`, error);
      return null;
    }
  }

  private findMatchingCombination(userFilters: FilterOptions, filterMappings: Record<string, any>): string | null {
    const { debug } = require('../../debug');
    
    // Create effective user filters by normalizing modalities/langs
    const effectiveUserFilters: Record<string, string[]> = {
      modality: [...(userFilters.modalities || []), ...(userFilters.langs || [])],
      knowledge: userFilters.knowledge || [],
      reasoning: userFilters.reasoning || [],
      dataset: userFilters.datasets || []
    };

    debug.dataSource('Finding matching combination:', {
      original: userFilters,
      effective: effectiveUserFilters
    });

    // Remove empty arrays and check if user has any effective filters
    const hasAnyEffectiveFilters = Object.values(effectiveUserFilters).some(filterArray => 
      Array.isArray(filterArray) && filterArray.length > 0
    );
    
    if (!hasAnyEffectiveFilters) {
      debug.dataSource('No effective filters, returning overall');
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

    debug.dataSource('Available options per category:', 
      Object.fromEntries(Object.entries(availableOptions).map(([k, v]) => [k, Array.from(v)]))
    );

    // Check if user has selected ALL available options for any category
    // If so, treat it as if no filter was selected for that category
    for (const [category, userValues] of Object.entries(effectiveUserFilters)) {
      if (Array.isArray(userValues) && userValues.length > 0) {
        const availableForCategory = availableOptions[category];
        if (availableForCategory && userValues.length === availableForCategory.size) {
          // Only treat as "all selected" if there are multiple options available
          // If there's only 1 option and user selected it, that's still meaningful filtering
          if (availableForCategory.size > 1) {
            // Check if user selected all available options (case insensitive)
            const allSelected = userValues.every(value => 
              Array.from(availableForCategory).some(available => 
                String(available).localeCompare(String(value), undefined, { sensitivity: 'base' }) === 0
              )
            );
            if (allSelected) {
              debug.dataSource(`User selected ALL ${category} options (${userValues.length}), treating as no filter`);
              // User selected ALL options for this category, treat as no filter
              effectiveUserFilters[category] = [];
            }
          }
        }
      }
    }

    debug.dataSource('Effective filters after "all selected" processing:', effectiveUserFilters);

    // Check again if all effective filters are empty after the "all selected" logic
    const hasAnyEffectiveFiltersAfterProcessing = Object.values(effectiveUserFilters).some(filterArray => 
      Array.isArray(filterArray) && filterArray.length > 0
    );
    
    if (!hasAnyEffectiveFiltersAfterProcessing) {
      debug.dataSource('All filters are empty after processing, returning overall');
      return 'overall';
    }

    // Find exact matching combinations
    for (const [combinationKey, mapping] of Object.entries(filterMappings)) {
      if (!mapping || typeof mapping !== 'object') {
        continue;
      }
      
      let matches = true;
      
      // Check each filter category that exists in the mapping for exact match
      const supportedCategories = Object.keys(mapping);
      
      // For categories supported by this mapping, check exact match
      for (const category of supportedCategories) {
        const userFilterArray = effectiveUserFilters[category] || [];
        const mappingFilterArray = mapping[category] || [];
        
        if (!this.arraysMatch(userFilterArray, mappingFilterArray)) {
          matches = false;
          break;
        }
      }
      
      // Also check that user doesn't have filters for categories not supported by this mapping
      for (const [userCategory, userValues] of Object.entries(effectiveUserFilters)) {
        if (userValues.length > 0 && !supportedCategories.includes(userCategory)) {
          // User has filters for a category not supported by this mapping
          matches = false;
          break;
        }
      }
      
      if (matches) {
        debug.dataSource(`Found matching combination: ${combinationKey}`);
        return combinationKey;
      }
    }
    
    debug.dataSource('No matching combination found');
    return null;
  }

  private arraysMatch(userArray: string[], mappingArray: string[]): boolean {
    const normalizeArray = (arr: string[]): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => String(item).toLowerCase().trim()).sort();
    };
    
    const normalizedUser = normalizeArray(userArray);
    const normalizedMapping = normalizeArray(mappingArray);
    
    return normalizedUser.length === normalizedMapping.length &&
           normalizedUser.every((item, index) => item === normalizedMapping[index]);
  }

  private convertPrecomputedToResultEntries(precomputedData: PrecomputedData, task: TaskType): ResultEntry[] {
    const results: ResultEntry[] = [];
    
    // For each model and combination, create result entries
    for (const [modelName, modelData] of Object.entries(precomputedData.data)) {
      for (const [combination, result] of Object.entries(modelData)) {
        const entry = this.convertPrecomputedResultToEntry(result, task, combination);
        results.push(entry);
      }
    }
    
    return results;
  }

  private convertPrecomputedResultToEntry(result: PrecomputedResult, task: TaskType, combination: string): ResultEntry {
    // Extract metrics from the result - these will be flattened for the leaderboard
    const metrics: any = {};
    
    // Copy all properties except known metadata fields
    const metadataFields = ['rank', 'model', 'model_url'];
    for (const [key, value] of Object.entries(result || {})) {
      if (!metadataFields.includes(key) && value !== null && value !== undefined) {
        // Convert string numbers to actual numbers, keep strings as-is for display
        if (typeof value === 'string' && value !== '-' && !isNaN(parseFloat(value))) {
          metrics[key] = parseFloat(value);
        } else if (typeof value === 'number') {
          metrics[key] = value;
        } else if (typeof value === 'string') {
          // Keep string values like "-" for display
          metrics[key] = value;
        }
      }
    }

    // Ensure we have a valid model name
    const modelName = result?.model || 'unknown';
    
    return {
      id: `${modelName}-${task}-${combination}`,
      model_name: modelName,
      dataset: this.extractDatasetFromCombination(combination),
      task,
      lang: this.extractLangFromCombination(combination),
      metrics,
      url: result?.model_url
    };
  }

  /**
   * Convert ResultEntry objects to the format expected by the Leaderboard component
   */
  private convertResultEntriesToLeaderboardFormat(entries: ResultEntry[]): any[] {
    const { debug } = require('../../debug');
    
    const converted = entries.map(entry => {
      const leaderboardResult: any = {
        model: entry.model_name,
        rank: entry.metrics?.rank || 0
      };

      // Process metrics with proper formatting
      for (const [key, value] of Object.entries(entry.metrics || {})) {
        if (key === 'rank') continue; // Already handled above
        
        if (typeof value === 'number') {
          // For pass@k metrics, keep as percentage but ensure 1 decimal places
          if (key.includes('pass@') || key.includes('_pass@')) {
            // Format percentage with 1 decimal places
            leaderboardResult[key] = value.toFixed(1);
          } else if (key === 'rank') {
            // Keep rank as integer (no decimal)
            leaderboardResult[key] = value;
          } else if (Number.isInteger(value)) {
            // Show other integers with .0 for consistency
            leaderboardResult[key] = value.toFixed(1);
          } else {
            // Keep decimals as-is but ensure consistent formatting
            leaderboardResult[key] = value.toFixed(1);
          }
        } else {
          // Keep non-numeric values as-is (like "-")
          leaderboardResult[key] = value;
        }
      }

      return leaderboardResult;
    });

    debug.dataSource(`Converted ${entries.length} entries to leaderboard format. Sample:`, converted[0]);
    
    return converted;
  }

  private extractDatasetFromCombination(combination: string): string {
    const lowerCombination = combination.toLowerCase();
    
    // Common dataset patterns
    const datasetPatterns = [
      'humaneval', 'mbpp', 'codeforces', 'leetcode', 'apps', 
      'codenet', 'conala', 'codesearchnet', 'bigclonebench',
      'primevul', 'polyhumaneval', 'hr', 'gfg'
    ];
    
    for (const pattern of datasetPatterns) {
      if (lowerCombination.includes(pattern)) {
        return pattern;
      }
    }
    
    // Try to extract from patterns like dataset:name
    const datasetMatch = combination.match(/dataset[:\-_]([^,\|\-_]+)/i);
    if (datasetMatch) {
      return datasetMatch[1].toLowerCase();
    }
    
    return 'overall';
  }

  private extractLangFromCombination(combination: string): string {
    const lowerCombination = combination.toLowerCase();
    
    // Common language patterns
    const langPatterns = [
      'python', 'java', 'javascript', 'typescript', 'cpp', 'c++', 'c',
      'go', 'rust', 'swift', 'kotlin', 'php', 'ruby', 'scala',
      'csharp', 'c#', 'html', 'css'
    ];
    
    for (const pattern of langPatterns) {
      if (lowerCombination.includes(pattern)) {
        return pattern === 'c++' ? 'cpp' : pattern === 'c#' ? 'csharp' : pattern;
      }
    }
    
    // Try to extract from patterns like lang:name or modality:name
    const langMatch = combination.match(/(?:lang|modality)[:\-_]([^,\|\-_]+)/i);
    if (langMatch) {
      return langMatch[1].toLowerCase();
    }
    
    return 'unknown';
  }

  async clearCache(): Promise<void> {
    await super.clearCache();
    this.precomputedCache.clear();
  }

  protected getCacheTTL(): number {
    return 10 * 60 * 1000; // 10 minutes for precomputed data
  }
} 