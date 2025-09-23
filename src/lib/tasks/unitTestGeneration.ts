import { ProcessedResult, FilterOptions } from '../types';

interface UnitTestGenerationData {
  model_name: string;
  task: string;
  lang: string;
  dataset: string;
  prompting_category: string;
  csr: number;
  line_coverage: number;
  branch_coverage: number;
}

export async function processUnitTestGeneration(rawData: ProcessedResult[], filters: FilterOptions): Promise<ProcessedResult[]> {
  console.log('Processing unit test generation task:', {
    totalData: rawData.length,
    filters
  });

  // Try to load unit test generation JSONL data
  let unitTestData: UnitTestGenerationData[] = [];
  try {
    // Use API to fetch data from server
    const response = await fetch('/api/files?directory=data/unit_test_generation&file=unit_test_generation_leaderboard_result.jsonl');
    if (response.ok) {
      const jsonlText = await response.text();
      // Parse JSONL format (each line is a JSON object)
      unitTestData = jsonlText
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line)) as UnitTestGenerationData[];
      console.log('Loaded unit test generation data:', unitTestData.length, 'entries');
    } else {
      console.warn('Failed to load unit test generation data from API, status:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Failed to load unit test generation data:', error);
    return [];
  }

  // Convert data format to ProcessedResult array
  const results: ProcessedResult[] = unitTestData.map((data, index) => ({
    modelId: data.model_name,
    modelName: data.model_name,
    dataset: data.dataset,
    task: 'unit test generation',
    sourceLang: null,
    lang: data.lang,
    targetLang: null,
    // Initialize all standard metrics to null
    pass1: null,
    pass3: null,
    pass5: null,
    executionAccuracy: null,
    // Empty difficulty metrics
    easyPass1: null,
    easyPass3: null,
    easyPass5: null,
    mediumPass1: null,
    mediumPass3: null,
    mediumPass5: null,
    hardPass1: null,
    hardPass3: null,
    hardPass5: null,
    codebleu: null,
    llmjudge: null,
    difficulty: null,
    // Unit test generation specific metrics
    'csr': Number(data.csr).toFixed(3),
    'line_coverage': data.line_coverage,
    'branch_coverage': data.branch_coverage,
    // Set rank for initial sorting
    rank: index + 1
  }));

  console.log('Generated unit test generation results:', {
    totalResults: results.length,
    datasets: [...new Set(results.map(r => r.dataset))],
    languages: [...new Set(results.map(r => r.lang))],
    sampleResult: results[0]
  });

  // Apply filters
  let filteredResults = [...results];
  
  // Dataset filtering
  if (filters.datasets && filters.datasets.length > 0) {
    const selectedDatasets = new Set(filters.datasets.map(d => d.toLowerCase().replace(/\s+/g, '')));
    console.log('Applying unit test generation dataset filter:', {
      selectedDatasets: Array.from(selectedDatasets),
      totalResultsBefore: filteredResults.length,
      originalDatasets: filters.datasets
    });
    
    filteredResults = filteredResults.filter(result => {
      const normalizedDataset = result.dataset.toLowerCase().replace(/\s+/g, '');
      return selectedDatasets.has(normalizedDataset);
    });
    
    console.log('Filtered unit test generation results:', {
      totalResults: filteredResults.length,
      remainingDatasets: [...new Set(filteredResults.map(r => r.dataset))]
    });
  }

  // Language filtering (modality filtering)
  if (filters.modalities && filters.modalities.length > 0) {
    const selectedLanguages = new Set(filters.modalities.map(m => m.toLowerCase()));
    filteredResults = filteredResults.filter(result => 
      selectedLanguages.has(result.lang.toLowerCase())
    );
  }

  return filteredResults;
}

export function aggregateUnitTestGenerationResults(results: ProcessedResult[]): ProcessedResult[] {
  // If no results, return empty array
  if (results.length === 0) return [];

  // Group by model name
  const groupedByModel = new Map<string, ProcessedResult[]>();
  
  results.forEach(result => {
    if (!groupedByModel.has(result.modelName)) {
      groupedByModel.set(result.modelName, []);
    }
    groupedByModel.get(result.modelName)!.push(result);
  });
  
  // Aggregate results for each model
  return Array.from(groupedByModel.entries()).map(([modelName, modelResults]) => {
    console.log(`Aggregating unit test generation results for ${modelName}:`, {
      totalResults: modelResults.length,
      datasets: modelResults.map(r => r.dataset)
    });
    
    // Create base result object
    const aggregatedResult: ProcessedResult = {
      modelId: modelName,
      modelName: modelName,
      dataset: modelResults.map(r => r.dataset).join(', '),
      task: 'unit test generation',
      sourceLang: null,
      lang: modelResults.map(r => r.lang).join(', '),
      targetLang: null,
      pass1: null,
      pass3: null,
      pass5: null,
      executionAccuracy: null,
      easyPass1: null,
      easyPass3: null,
      easyPass5: null,
      mediumPass1: null,
      mediumPass3: null,
      mediumPass5: null,
      hardPass1: null,
      hardPass3: null,
      hardPass5: null,
      codebleu: null,
      llmjudge: null,
      difficulty: null
    } as ProcessedResult;

    // Calculate average metrics across all datasets for this model
    const validResults = modelResults.filter(r => r.csr !== null);
    if (validResults.length > 0) {
      aggregatedResult.csr = validResults.reduce((sum, r) => sum + (r.csr || 0), 0) / validResults.length;
      aggregatedResult.line_coverage = validResults.reduce((sum, r) => sum + (r.line_coverage || 0), 0) / validResults.length;
      aggregatedResult.branch_coverage = validResults.reduce((sum, r) => sum + (r.branch_coverage || 0), 0) / validResults.length;
    }
    
    return aggregatedResult;
  });
}
