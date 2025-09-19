import { ProcessedResult, FilterOptions, ResultEntry, Metrics } from '../types';

export function processCodeReview(results: ResultEntry[], filters: FilterOptions): ProcessedResult[] {
  // 添加调试日志：输入数据
  console.log('Code Review - Input data:', {
    totalResults: results.length,
    sampleResult: results.length > 0 ? results[0] : 'No results',
    filters: filters
  });

  // 先检查是否有code review任务的数据
  const codeReviewData = results.filter(result => result.task === 'code review');
  console.log(`Found ${codeReviewData.length} code review entries`);
  
  if (codeReviewData.length > 0) {
    // 打印一个样本条目，特别关注其metrics格式
    const sample = codeReviewData[0];
    // console.log('Sample code review entry:', {
    //   model: sample.model_name,
    //   dataset: sample.dataset,
    //   metrics: sample.metrics,
    //   metricsKeys: sample.metrics ? Object.keys(sample.metrics) : 'No metrics'
    // });

    // 记录所有可能的metrics key和它们的值类型
    if (sample.metrics) {
      // Object.entries(sample.metrics).forEach(([key, value]) => {
      //   console.log(`Metrics key: ${key}, value type: ${typeof value}, value:`, value);
      // });
    }
  }

  const filteredResults = results.filter((result) => {
    // 1. 检查任务类型
    if (result.task !== 'code review') {
      return false;
    }
    
    // 2. 检查数据集
    if (filters.datasets?.length > 0 && !filters.datasets.includes(result.dataset)) {
      // console.log('Filtered out due to dataset:', {
      //   dataset: result.dataset,
      //   allowedDatasets: filters.datasets,
      //   modelName: result.model_name
      // });
      return false;
    }
    
    // 3. 检查语言
    if (filters.langs?.length > 0) {
      const resultLang = result.lang?.toLowerCase();
      if (!resultLang || !filters.langs.map(l => l.toLowerCase()).includes(resultLang)) {
        // console.log('Filtered out due to language:', {
        //   lang: result.lang,
        //   allowedLangs: filters.langs,
        //   modelName: result.model_name
        // });
        return false;
      }
    }
    
    // 4. 检查 LLM Judge 过滤器 - 如果设置了过滤器才进行过滤
    if (filters.llmJudges?.length) {
      let hasSelectedJudge = false;
      
      if (!result.metrics) {
        console.log('Filtered out due to missing metrics:', {
          modelName: result.model_name
        });
        return false;
      }
      
      // 为了调试，打印所有可用的 metrics keys
      // console.log(`Available metrics keys for ${result.model_name}:`, Object.keys(result.metrics));
      
      // 首先检查metrics中是否直接包含judge key
      for (const judge of filters.llmJudges) {
        if (result.metrics[judge] !== undefined) {
          hasSelectedJudge = true;
          break;
        }
      }
      
      // 如果没找到直接key，再检查LLMJudge对象
      if (!hasSelectedJudge && result.metrics.LLMJudge) {
        const llmJudge = result.metrics.LLMJudge;
        
        // 检查是否包含任何指定的judge
        hasSelectedJudge = filters.llmJudges.some(judge => {
          if (typeof llmJudge === 'object') {
            return llmJudge[judge] !== undefined;
          }
          return false;
        });
      }
      
      if (!hasSelectedJudge) {
        console.log('Filtered out due to no matching judges:', {
          availableMetricsKeys: result.metrics ? Object.keys(result.metrics) : 'none',
          selectedJudges: filters.llmJudges,
          modelName: result.model_name
        });
        return false;
      }
    }
    
    return true;
  });

  // 添加调试日志：过滤后的结果
  // console.log('Code Review - Filtered results:', {
  //   totalFilteredResults: filteredResults.length,
  //   sampleFilteredResult: filteredResults.length > 0 ? filteredResults[0] : 'No filtered results'
  // });

  // 创建包含所有必需属性的完整 ProcessedResult
  const processedResults: ProcessedResult[] = filteredResults.map(result => {
    // 检查并记录处理中的数据
    // console.log(`Processing result for model ${result.model_name}:`, {
    //   metricsKeys: result.metrics ? Object.keys(result.metrics) : 'No metrics',
    // });
    
    // 寻找并计算分数
    let llmjudgeScore = null;
    
    // 记录原始数据格式以便调试
    if (result.metrics) {
      // console.log(`Original metrics for ${result.model_name}:`, result.metrics);
      
      // 尝试所有可能的格式
      // 1. 直接检查常见的评委键名
      const judgeKeys = ['gpt-4', 'gpt-4o', 'gpt-3.5-turbo', 'claude-3', 'claude', 'llama', 'gemini'];
      for (const key of judgeKeys) {
        if (result.metrics[key] !== undefined) {
          const score = calculateDirectJudgeScore(result.metrics[key]);
          if (score !== null) {
            console.log(`Found score for ${key}:`, score);
            llmjudgeScore = score;
            break;
          }
        }
      }
      
      // 2. 如果没找到，检查LLMJudge对象
      if (llmjudgeScore === null && result.metrics.LLMJudge) {
        llmjudgeScore = calculateCodeReviewScore(result.metrics.LLMJudge);
        // console.log(`Calculated LLMJudge score:`, llmjudgeScore);
      }
      
      // 3. 如果还没找到，尝试搜索任何看起来像分数的键
      if (llmjudgeScore === null) {
        for (const [key, value] of Object.entries(result.metrics)) {
          // 跳过已处理的键
          if (judgeKeys.includes(key) || key === 'LLMJudge') continue;
          
          // 检查值是否是数字或数字数组
          if (typeof value === 'number' || Array.isArray(value)) {
            const score = calculateDirectJudgeScore(value);
            if (score !== null) {
              // console.log(`Found score for ${key}:`, score);
              llmjudgeScore = score;
              break;
            }
          }
        }
      }
      
      // 记录最终计算的分数
      // console.log(`Final score for ${result.model_name}:`, llmjudgeScore);
    }

    return {
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
      // 包含所有必需的难度相关属性
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
      llmjudge: llmjudgeScore,
      executionAccuracy: null,
      difficulty: result.difficulty || null
    };
  });

  // 添加调试日志：最终处理后的结果
  console.log('Code Review - Final processed results:', {
    totalProcessedResults: processedResults.length,
    sampleProcessedResult: processedResults.length > 0 ? processedResults[0] : 'No processed results'
  });

  return processedResults;
}

// 处理直接在metrics中的judge分数
function calculateDirectJudgeScore(judgeData: number | number[] | Record<string, number | number[]> | undefined): number | null {
  // console.log('Calculating direct judge score from:', judgeData);
  
  // Handle undefined input
  if (judgeData === undefined || judgeData === null) {
    return null;
  }
  
  // 如果是数组，计算平均值
  if (Array.isArray(judgeData)) {
    if (judgeData.length === 0) return null;
    
    // 确保所有元素都是数字
    const validScores = judgeData.filter(score => typeof score === 'number');
    if (validScores.length === 0) return null;
    
    const avg = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    // console.log(`Average of array scores: ${avg} (from ${validScores.length} valid scores)`);
    return avg;
  }
  
  // 如果是数字，直接返回
  if (typeof judgeData === 'number') {
    // console.log(`Direct numeric score: ${judgeData}`);
    return judgeData;
  }
  
  // 如果是对象，尝试提取分数
  if (typeof judgeData === 'object' && judgeData !== null) {
    // 可能的分数键名
    const possibleScoreKeys = ['score', 'value', 'rating', 'result'];
    
    for (const key of possibleScoreKeys) {
      if (judgeData[key] !== undefined) {
        if (typeof judgeData[key] === 'number') {
          // console.log(`Found score in object at key ${key}: ${judgeData[key]}`);
          return judgeData[key] as number;
        }
      }
    }
    
    // 如果没有特定键，但有数值，返回第一个数值
    const numericValues = Object.values(judgeData).filter(v => typeof v === 'number');
    if (numericValues.length > 0) {
      // console.log(`Found numeric value in object: ${numericValues[0]}`);
      return numericValues[0] as number;
    }
  }
  
  console.log('Could not extract a score from data');
  return null;
}

function calculateCodeReviewScore(llmJudge: Metrics['LLMJudge'] | undefined): number | null {
  if (!llmJudge) return null;
  
  // console.log('Calculating code review score from LLMJudge:', llmJudge);
  
  if (typeof llmJudge === 'number') {
    // console.log(`Direct LLMJudge score: ${llmJudge}`);
    return llmJudge;
  }
  
  if (typeof llmJudge === 'object') {
    // 专门处理 code review 中的数组格式, 例如 {"gpt-4": [score1, score2, ...]}
    const scores: number[] = [];
    
    // 处理所有评委
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(llmJudge).forEach(([_, value]) => {
      if (Array.isArray(value)) {
        // 如果是数组格式（如 [score1, score2, ...]）
        if (value.length > 0) {
          // 计算该评委所有分数的平均值
          const judgeAvg = value.reduce((sum, score) => sum + score, 0) / value.length;
          // console.log(`Judge ${judge} average score: ${judgeAvg} (from ${value.length} entries)`);
          scores.push(judgeAvg);
        }
      } else if (typeof value === 'number') {
        // 如果是单个分数
        // console.log(`Judge ${judge} direct score: ${value}`);
        scores.push(value);
      }
    });
    
    // 如果没有有效分数，返回null
    if (scores.length === 0) return null;
    
    // 计算所有评委的平均分
    const finalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    // console.log(`Final average score across all judges: ${finalScore}`);
    return finalScore;
  }
  
  return null;
}

export function aggregateCodeReviewResults(results: ProcessedResult[]): ProcessedResult[] {
  // console.log('Aggregating code review results:', {
    // totalResults: results.length
  // });
  
  const groupedResults = new Map<string, ProcessedResult[]>();
  
  // 按模型分组
  results.forEach(result => {
    const key = result.modelName;
    if (!groupedResults.has(key)) {
      groupedResults.set(key, []);
    }
    groupedResults.get(key)!.push(result);
  });
  
  // console.log(`Grouped into ${groupedResults.size} model groups`);
  
  // 计算每个模型的平均值
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const aggregatedResults = Array.from(groupedResults.entries()).map(([_, modelResults]) => {
    const baseResult = { ...modelResults[0] };
    
    // 计算LLMJudge分数的平均值
    const validScores = modelResults
      .map(r => r.llmjudge)
      .filter((score): score is number => score !== null);
    
    baseResult.llmjudge = validScores.length > 0
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : null;
    
    // console.log(`Aggregated score for ${modelName}: ${baseResult.llmjudge} (from ${validScores.length} scores)`);
    return baseResult;
  });
  
  return aggregatedResults;
}

// 获取所有可用的LLM Judges
export function getAvailableLLMJudges(results: ResultEntry[] | ProcessedResult[]): string[] {
  // 过滤出所有code review任务的结果
  const codeReviewResults = results.filter(result => result.task === 'code review');
  // console.log(`Found ${codeReviewResults.length} code review entries for judge detection`);
  
  const judges = new Set<string>();
  
  // 检查直接在metrics中的评委键
  codeReviewResults.forEach(result => {
    if ('metrics' in result && result.metrics) {
      // 检查metrics中是否直接有judge键（如'gpt-4'）
      Object.keys(result.metrics).forEach(key => {
        // 只添加可能是judge的键
        if (key.toLowerCase().includes('gpt') || 
            key.toLowerCase().includes('llm') || 
            key.toLowerCase().includes('judge')) {
          judges.add(key);
        }
      });
      
      // 也检查LLMJudge对象中的评委
      const llmJudge = typeof result.metrics === 'object' && result.metrics !== null ? result.metrics.LLMJudge : undefined;
      if (typeof llmJudge === 'object' && llmJudge !== null) {
        Object.keys(llmJudge).forEach(judge => judges.add(judge));
      }
    }
  });
  
  const judgesList = Array.from(judges);
  // console.log(`Detected judges: ${judgesList.join(', ')}`);
  // If no judges found, return common default judges
  if (judgesList.length === 0) {
    return ['gpt-4', 'gpt-4o', 'claude-3-sonnet'];
  }
  
  return judgesList;
}