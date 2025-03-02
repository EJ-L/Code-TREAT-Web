import { ProcessedResult, FilterOptions, LLMJudgeScores, ResultEntry, Metrics } from '../types';

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
    executionAccuracy: null
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
      const filteredScores = scores.filter(([judge]) => selectedJudges.includes(judge));
      if (filteredScores.length === 0) return null;
      return filteredScores.reduce((sum, [_, score]) => sum + score, 0) / filteredScores.length;
    }
    return scores.reduce((sum, [_, score]) => sum + score, 0) / scores.length;
  }
  
  return null;
}

export function aggregateCodeSummarizationResults(results: ProcessedResult[], selectedJudges?: string[]): ProcessedResult[] {
  const groupedResults = new Map<string, ProcessedResult[]>();
  
  // 按模型分组
  results.forEach(result => {
    const key = result.modelName;
    if (!groupedResults.has(key)) {
      groupedResults.set(key, []);
    }
    groupedResults.get(key)!.push(result);
  });
  
  // 计算每个模型的平均值
  return Array.from(groupedResults.entries()).map(([modelName, modelResults]) => {
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
export function getAvailableLLMJudges(results: ResultEntry[]): string[] {
  const judges = new Set<string>();
  
  results.forEach(result => {
    const llmJudge = result.metrics?.LLMJudge;
    if (typeof llmJudge === 'object' && llmJudge !== null) {
      Object.keys(llmJudge).forEach(judge => judges.add(judge));
    }
  });
  
  return Array.from(judges);
}