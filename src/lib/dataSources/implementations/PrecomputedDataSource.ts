import { 
  IPrecomputedDataSource, 
  DataLoadConfig, 
  DataLoadResult,
  DataSourceMetadata 
} from '../interfaces';
import { BaseDataSource } from '../base/BaseDataSource';
import { ResultEntry, TaskType, FilterOptions, ProcessedResult } from '../../types';
import { debug } from '../../debug';

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
      [key: string]: string[] | number[] | unknown;
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
  [key: string]: number | string | undefined; // For metrics like pass@1, LLM Judge, etc.
}

/**
 * Precomputed data source for optimized consolidated results
 */
export class PrecomputedDataSource extends BaseDataSource implements IPrecomputedDataSource {
  private precomputedCache = new Map<string, PrecomputedData>();
  
  /**
   * Clear all cached precomputed data (useful after data renewal)
   */
  clearCache(): void {
    this.precomputedCache.clear();
  }

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
        'vulnerability detection',
        'code-web',
        'interaction-2-code',
        'code-robustness',
        'mr-web',
        'unit test generation'
      ] as TaskType[],
      cacheable: true,
      priority: 3 // Higher priority than filesystem
    };
    super(metadata);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  async getAvailableFilterCombinations(task: TaskType): Promise<Record<string, Record<string, string[] | number[] | unknown>>> {
    const precomputedData = await this.loadPrecomputedData(task, false);
    return precomputedData?.filterMappings || {};
  }

  /**
   * Load precomputed results in leaderboard-ready format
   */
  async getLeaderboardResults(task: TaskType, filters: FilterOptions): Promise<ProcessedResult[]> {
    const result = await this.loadPrecomputedResults(task, filters);
    return this.convertResultEntriesToLeaderboardFormat(result.data);
  }

  async loadPrecomputedResults(task: TaskType, filters: FilterOptions): Promise<DataLoadResult> {
    const startTime = Date.now();

    try {
      const { debug } = await import('../../debug');
      debug.dataSource(`Loading precomputed results for task: ${task}`, filters);
      
      // Load both regular and difficulty data, then merge them
      const regularData = await this.loadPrecomputedData(task, false);
      const difficultyData = await this.loadPrecomputedData(task, true);
      
      if (!regularData && !difficultyData) {
        debug.dataSource(`No precomputed data available for task: ${task}`);
        console.log(`❌ No precomputed data available for task: ${task}`);
        return this.createResult([], this.metadata.name, Date.now() - startTime, false, [`No precomputed data available for task: ${task}`]);
      }
      
      // Merge the data - start with regular data and add difficulty metrics where available
      const precomputedData = this.mergeRegularAndDifficultyData(regularData, difficultyData, task);
      
      if (!precomputedData) {
        debug.dataSource(`Failed to merge data for task: ${task}`);
        return this.createResult([], this.metadata.name, Date.now() - startTime, false, [`Failed to merge data for task: ${task}`]);
      }

      debug.dataSource(`Available filterMappings:`, Object.keys(precomputedData.filterMappings));
      debug.dataSource(`Available models:`, Object.keys(precomputedData.data));

      // Find matching combination for the given filters
      const matchingCombination = this.findMatchingCombination(filters, precomputedData.filterMappings);
      
      debug.dataSource(`Found matching combination: ${matchingCombination}`);
      
      if (!matchingCombination) {
        debug.dataSource('No matching combination found for filters', filters);
        console.log(`❌ No matching combination found for filters:`, filters);
        console.log(`📋 Available combinations:`, Object.keys(precomputedData.filterMappings));
        return this.createResult([], this.metadata.name, Date.now() - startTime, false, ['No matching combination found for filters']);
      }

      // Check if the combination actually has data
      let hasAnyData = false;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  private mergeRegularAndDifficultyData(regularData: PrecomputedData | null, difficultyData: PrecomputedData | null, task: TaskType): PrecomputedData | null {
    // If we only have one type of data, use it as is
    if (!regularData && difficultyData) return difficultyData;
    if (regularData && !difficultyData) return regularData;
    if (!regularData && !difficultyData) return null;

    // Tasks that don't have difficulty data - just return regular data
    const difficultyTasks = ['code generation', 'code translation', 'input prediction', 'output prediction'];
    if (!difficultyTasks.includes(task)) {
      return regularData;
    }

    // Merge the data by combining regular and difficulty metrics for each model
    const mergedData: PrecomputedData = {
      task: regularData!.task,
      filterMappings: { ...regularData!.filterMappings },
      data: {}
    };

    // Start with all models from regular data
    for (const [modelName, modelData] of Object.entries(regularData!.data)) {
      mergedData.data[modelName] = { ...modelData };
    }

    // Add difficulty metrics to existing models
    if (difficultyData) {
      for (const [modelName, modelData] of Object.entries(difficultyData.data)) {
        if (mergedData.data[modelName]) {
          // Merge difficulty metrics into existing model data
          for (const [combination, combinationData] of Object.entries(modelData)) {
            if (mergedData.data[modelName][combination]) {
              // Add difficulty-specific metrics to the existing combination
              Object.assign(mergedData.data[modelName][combination], combinationData);
            } else {
              // If combination doesn't exist in regular data, add it
              mergedData.data[modelName][combination] = { ...combinationData };
            }
          }
        } else {
          // If model doesn't exist in regular data, add it with difficulty data
          mergedData.data[modelName] = { ...modelData };
        }
      }
    }

    return mergedData;
  }

  private async loadPrecomputedData(task: string, showByDifficulty: boolean): Promise<PrecomputedData | null> {
    const taskKey = task.replace(/\s+/g, '-');
    const cacheKey = showByDifficulty ? `${taskKey}_difficulty` : taskKey;
    
    // Clear cache to ensure fresh data after renewal
    if (this.precomputedCache.has(cacheKey)) {
      this.precomputedCache.delete(cacheKey);
    }
    
    try {
      // Determine the correct consolidated file name
      let fileName: string;
      if (showByDifficulty) {
        fileName = `${taskKey}_difficulty_consolidated.json`;
      } else {
        fileName = `${taskKey}_consolidated.json`;
      }
      
      const response = await fetch(`/api/direct-files?file=data/precomputed/${fileName}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
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

  private findMatchingCombination(userFilters: FilterOptions, filterMappings: PrecomputedData['filterMappings']): string | null {
    
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
      for (const [category, values] of Object.entries(mapping)) {
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
        const mappingFilterArray = Array.isArray(mapping[category]) ? mapping[category] as string[] : [];
        
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const metrics: Record<string, number | string | undefined> = {};
    
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

    // Special processing for unit test generation to extract aggregate metrics
    if (task === 'unit test generation') {
      this.aggregateUnitTestMetrics(metrics);
    }

    // Ensure we have a valid model name
    const modelName = result?.model || 'unknown';
    
    return {
      id: `${modelName}-${task}-${combination}`,
      model_name: modelName,
      dataset: this.extractDatasetFromCombination(combination),
      task,
      lang: this.extractLangFromCombination(combination),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metrics: metrics as any,
      url: result?.model_url
    };
  }

  private aggregateUnitTestMetrics(metrics: Record<string, number | string | undefined>): void {
    // Unit test generation data has dataset-specific metrics like:
    // HackerRank_Vanilla, HackerRank_PSC-ALL, GeeksforGeeks_Vanilla, etc.
    // We need to extract the core metrics: Vanilla, PSC-ALL, MCC, MPS, MHC
    
    const metricTypes = ['Vanilla', 'PSC-ALL', 'MCC', 'MPS', 'MHC'];
    const datasets = ['HackerRank', 'GeeksforGeeks', 'Merged'];
    
    for (const metricType of metricTypes) {
      const values: number[] = [];
      
      // Collect values from all datasets for this metric type
      for (const dataset of datasets) {
        const key = `${dataset}_${metricType}`;
        const value = metrics[key];
        
        if (typeof value === 'number' && !isNaN(value)) {
          values.push(value);
        } else if (typeof value === 'string' && value !== '-' && !isNaN(parseFloat(value))) {
          values.push(parseFloat(value));
        }
      }
      
      // Calculate average if we have values
      if (values.length > 0) {
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        metrics[metricType] = average;
      } else {
        metrics[metricType] = '-';
      }
    }
  }

  /**
   * Convert ResultEntry objects to the format expected by the Leaderboard component
   */
  private convertResultEntriesToLeaderboardFormat(entries: ResultEntry[]): ProcessedResult[] {
    
    const converted = entries.map(entry => {
      const leaderboardResult: Record<string, unknown> = {
        modelId: entry.id,
        modelName: entry.model_name,
        model: entry.model_name,
        rank: entry.metrics?.rank || 0,
        dataset: entry.dataset || null,
        task: entry.task || null,
        lang: entry.lang || null,
        sourceLang: entry.source_lang || null,
        targetLang: entry.target_lang || null,
        pass1: null,
        pass3: null,
        pass5: null,
        easyPass1: null,
        mediumPass1: null,
        hardPass1: null,
        easyPass3: null,
        mediumPass3: null,
        hardPass3: null,
        easyPass5: null,
        mediumPass5: null,
        hardPass5: null,
        codebleu: null,
        llmjudge: null,
        executionAccuracy: null,
        difficulty: null
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
    
    return converted as ProcessedResult[];
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