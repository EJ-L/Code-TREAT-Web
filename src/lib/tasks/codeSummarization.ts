import { ProcessedResult, FilterOptions, LLMJudgeScores, ResultEntry, Metrics } from '../types';
import { canonicalizeModelName } from '../constants';

export function processCodeSummarization(results: ResultEntry[], filters: FilterOptions): ProcessedResult[] {
  // 添加调试日志：输入数据
  console.log('Code Summarization - Input data:', {
    totalResults: results.length,
    sampleResult: results[0],
    filters: filters
  });

  const filteredResults = results.filter((result) => {
    // 1. 检查任务类型
    if (result.task !== 'code summarization') {
      console.log('Filtered out due to task:', {
        task: result.task,
        modelName: result.model_name
      });
      return false;
    }
    
    // 2. 检查数据集
    if (filters.datasets?.length > 0 && !filters.datasets.includes(result.dataset)) {
      console.log('Filtered out due to dataset:', {
        dataset: result.dataset,
        allowedDatasets: filters.datasets,
        modelName: result.model_name
      });
      return false;
    }
    
    // 3. 检查语言
    if (filters.langs?.length > 0) {
      const resultLang = result.lang?.toLowerCase();
      if (!resultLang || !filters.langs.map(l => l.toLowerCase()).includes(resultLang)) {
        console.log('Filtered out due to language:', {
          lang: result.lang,
          allowedLangs: filters.langs,
          modelName: result.model_name
        });
        return false;
      }
    }
    
    // 4. 检查 LLM Judge 过滤器
    if (filters.llmJudges?.length) {
      const llmJudge = result.metrics?.LLMJudge;
      if (!llmJudge || typeof llmJudge !== 'object') {
        console.log('Filtered out due to missing or invalid LLMJudge:', {
          llmJudge,
          modelName: result.model_name
        });
        return false;
      }
      
      // 检查是否包含任何指定的 judge
      const hasSelectedJudge = filters.llmJudges.some(judge => 
        (llmJudge as LLMJudgeScores)[judge] !== undefined
      );
      if (!hasSelectedJudge) {
        console.log('Filtered out due to no matching judges:', {
          availableJudges: Object.keys(llmJudge),
          selectedJudges: filters.llmJudges,
          modelName: result.model_name
        });
        return false;
      }
    }
    
    return true;
  });

  // 添加调试日志：过滤后的结果
  console.log('Code Summarization - Filtered results:', {
    totalFilteredResults: filteredResults.length,
    sampleFilteredResult: filteredResults[0]
  });

  const processedResults = filteredResults.map(result => ({
    modelId: result.id,
    modelName: result.model_name,
    dataset: result.dataset,
    task: result.task,
    sourceLang: result.source_lang || null,
    lang: result.lang,
    targetLang: result.target_lang || null,
    pass1: null,
    pass3: null,
    pass5: null,
    codebleu: null,
    llmjudge: calculateLLMJudgeScore(result.metrics?.LLMJudge, filters.llmJudges),
    executionAccuracy: null,
    easyPass1: null,
    mediumPass1: null,
    hardPass1: null,
    easyPass3: null,
    mediumPass3: null,
    hardPass3: null,
    easyPass5: null,
    mediumPass5: null,
    hardPass5: null,
    'P-C': null,
    'P-V': null,
    'P-B': null,
    'P-R': null,
    'Accuracy': null,
    'Precision': null,
    'Recall': null,
    'F1 Score': null
  }));

  // 添加调试日志：最终处理后的结果
  console.log('Code Summarization - Final processed results:', {
    totalProcessedResults: processedResults.length,
    sampleProcessedResult: processedResults[0]
  });

  return processedResults;
}

function calculateLLMJudgeScore(llmJudge: Metrics['LLMJudge'] | undefined, selectedJudges?: string[]): number | null {
  if (!llmJudge) return null;
  
  if (typeof llmJudge === 'number') {
    return llmJudge;
  }
  
  if (typeof llmJudge === 'object') {
    const scores = Object.entries(llmJudge);
    if (selectedJudges?.length) {
      const filteredScores = scores
        .filter(([judge]) => selectedJudges.includes(judge))
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([_, score]) => typeof score === 'number');
      
      if (filteredScores.length === 0) return null;
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const numericScores = filteredScores.map(([_, score]) => score as number);
      return numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length;
    }
    
    const numericScores = scores
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, score]) => typeof score === 'number')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([_, score]) => score as number);
    
    if (numericScores.length === 0) return null;
    
    return numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length;
  }
  
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function aggregateCodeSummarizationResults(results: ProcessedResult[], _?: string[]): ProcessedResult[] {
  const groupedResults = new Map<string, ProcessedResult[]>();
  
  // 按模型分组 (using canonical model names)
  results.forEach(result => {
    const key = result.modelName ? canonicalizeModelName(result.modelName) : result.modelName;
    if (!groupedResults.has(key)) {
      groupedResults.set(key, []);
    }
    groupedResults.get(key)!.push(result);
  });
  
  // 计算每个模型的平均值
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return Array.from(groupedResults.entries()).map(([_, modelResults]) => {
    const baseResult = { ...modelResults[0] };
    
    // 计算LLMJudge分数的平均值
    const validScores = modelResults
      .map(r => r.llmjudge)
      .filter((score): score is number => score !== null);
    
    baseResult.llmjudge = validScores.length > 0
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : null;
    
    return baseResult;
  });
}

// 获取所有可用的LLM Judges
export function getAvailableLLMJudges(results: ResultEntry[] | ProcessedResult[]): string[] {
  const judges = new Set<string>();
  
  results.forEach(result => {
    // Handle ResultEntry
    if ('metrics' in result) {
      const llmJudge = typeof result.metrics === 'object' && result.metrics !== null ? result.metrics.LLMJudge : undefined;
      if (typeof llmJudge === 'object' && llmJudge !== null) {
        Object.keys(llmJudge).forEach(judge => judges.add(judge));
      }
    }
    // For ProcessedResult, we can't get individual judges, so return common ones
    // This is a limitation - ideally we'd keep the judge information
  });
  
  // If no judges found from metrics, return common default judges
  if (judges.size === 0) {
    return ['gpt-4', 'gpt-4o', 'claude-3-sonnet'];
  }
  
  return Array.from(judges);
}