import { ProcessedResult, FilterOptions, TaskType, ResultEntry } from './types';
import { loadAllData, processResult, getPrecomputedResults } from './dataLoader';
import { processCodeGeneration, aggregateCodeGenerationResults } from './tasks/codeGeneration';
import { processCodeTranslation, aggregateCodeTranslationResults } from './tasks/codeTranslation';
import { processCodeSummarization, aggregateCodeSummarizationResults } from './tasks/codeSummarization';
import { processCodeExecution, aggregateCodeExecutionResults } from './tasks/codeExecution';
import { processVulnerabilityDetection, aggregateVulnerabilityDetectionResults } from './tasks/vulnerabilityDetection';
import { processCodeReview, aggregateCodeReviewResults } from './tasks/codeReview';
import { processInputPrediction, aggregateInputPredictionResults } from './tasks/inputPrediction';
import { processOutputPrediction, aggregateOutputPredictionResults } from './tasks/outputPrediction';
import { processOverall } from './tasks/overall';
import { MODEL_URLS } from './constants';

// 辅助函数：标准化语言名称
export const normalizeLanguage = (lang: string): string => {
  const normalized = lang.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized === 'c#' || normalized === 'csharp') {
    return 'csharp';
  }
  return normalized;
};

// 辅助函数：格式化显示的语言名称
export const formatLanguageDisplay = (lang: string): string => {
  if (lang.toLowerCase() === 'csharp') {
    return 'C#';
  }
  return lang;
};

// 辅助函数：根据语言过滤结果并计算平均值
const filterAndAggregateByLanguages = (results: ProcessedResult[], selectedLangs: string[]): ProcessedResult[] => {
  console.log(`语言过滤开始: ${selectedLangs.length} 种语言, ${results.length} 条结果`);

  if (!selectedLangs.length) return results;

  // 预先处理language数组
  const langPatterns = selectedLangs.map(l => l.toLowerCase());
  
  // 按模型分组
  const modelGroups = new Map<string, ProcessedResult[]>();
  
  results.forEach(result => {
    const resultLang = result.lang.toLowerCase();
    // 检查结果语言是否匹配选定的语言
    if (langPatterns.includes(resultLang)) {
      const key = result.modelName;
      if (!modelGroups.has(key)) {
        modelGroups.set(key, []);
      }
      modelGroups.get(key)!.push(result);
    }
  });

  console.log(`按模型分组结果: ${modelGroups.size} 个模型组`);

  // 对每个模型的结果计算平均值
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const aggregatedResults = Array.from(modelGroups.entries()).map(([modelName, modelResults]) => {
    const baseResult = { ...modelResults[0] };
    const metrics = ['pass1', 'pass3', 'pass5', 'codebleu', 'llmjudge', 'executionAccuracy'] as const;
    
    metrics.forEach(metric => {
      const validValues = modelResults
        .map(r => r[metric])
        .filter((value): value is number => value !== null);
      
      if (validValues.length > 0) {
        baseResult[metric] = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
      } else {
        baseResult[metric] = null;
      }
    });

    // 合并语言列表
    baseResult.lang = selectedLangs.join(', ');
    
    return baseResult;
  });

  console.log(`语言过滤和聚合完成: ${aggregatedResults.length} 条结果`);

  return aggregatedResults;
};

export async function processResults(task: TaskType, filters: FilterOptions): Promise<ProcessedResult[]> {
  console.log(`🚀 processResults called for task: "${task}"`);
  
  // Try to use precomputed data first
  try {
    const precomputedResults = await getPrecomputedResults(task, filters);
    
    if (precomputedResults.length > 0) {
      console.log(`✅ Using precomputed data for ${task}: ${precomputedResults.length} results`);
      console.log(`📊 First precomputed result:`, precomputedResults[0]);
      
      // Return precomputed results directly - formatResults will handle them
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return precomputedResults as any[];
    } else {
      console.log(`⚠️ No precomputed results found for ${task} - this is likely the root issue!`);
      console.log(`🔍 Filter details:`, JSON.stringify(filters, null, 2));
    }
  } catch (error) {
    console.warn('❌ Failed to load precomputed data, falling back to real-time processing:', error);
  }
  
  // Fallback to original real-time processing
  console.log('Using real-time data processing (fallback)');
  
  // 加载所有数据
  const data = await loadAllData();
  
  console.log('处理任务开始:', {
    task: task,
    filters: filters && {
      ...filters,
      datasets: filters.datasets?.length || 0,
      langs: filters.langs?.length || 0,
      modalities: filters.modalities?.length || 0,
      knowledge: filters.knowledge?.length || 0
    }
  });
  
  let processedResults: ProcessedResult[];
  
  // 根据任务类型选择处理器
  switch (task.toLowerCase()) {
    case 'code generation':
      processedResults = aggregateCodeGenerationResults(processCodeGeneration(data.map(processResult), filters));
      break;
      
    case 'code translation':
      processedResults = aggregateCodeTranslationResults(processCodeTranslation(data.map(processResult), filters));
      break;
      
    case 'code summarization': {
      const summarizationResults = processCodeSummarization(data, filters);
      processedResults = aggregateCodeSummarizationResults(summarizationResults);
      break;
    }
    
    case 'code review': {
      const reviewResults = processCodeReview(data, filters);
      processedResults = aggregateCodeReviewResults(reviewResults);
      break;
    }
      
    case 'code execution':
      processedResults = aggregateCodeExecutionResults(processCodeExecution(data.map(processResult), filters));
      break;
      
    case 'vulnerability detection':
      const vulnResults = await processVulnerabilityDetection(data.map(processResult), filters);
      processedResults = aggregateVulnerabilityDetectionResults(vulnResults);
      break;
      
    case 'input prediction':
      processedResults = aggregateInputPredictionResults(processInputPrediction(data.map(processResult), filters));
      break;
      
    case 'output prediction':
      processedResults = aggregateOutputPredictionResults(processOutputPrediction(data.map(processResult), filters));
      break;
      
    case 'overall':
      // overall任务是异步的，需要await
      processedResults = await processOverall(data.map(processResult), filters);
      break;
      
    case 'code-web':
    case 'interaction-2-code':
    case 'code-robustness':
    case 'mr-web':
      // For MR-Web, we need to filter by dataset since the raw data transformation may not have happened
      const rawTaskData = task === 'mr-web' 
        ? data.filter(entry => entry.dataset === 'MR-Web' || entry.task === task)
        : data.filter(entry => entry.task === task);
      

      
      // Apply filters at the raw data level first, before aggregation
      let filteredRawData = rawTaskData;
      
      // Apply dataset filter
      if (filters.datasets && filters.datasets.length > 0) {
        filteredRawData = filteredRawData.filter(entry => {
          const normalizedDataset = entry.dataset.toLowerCase().replace(/\s+/g, '');
          const allowedDatasets = new Set(filters.datasets.map(d => d.toLowerCase().replace(/\s+/g, '')));
          return allowedDatasets.has(normalizedDataset);
        });
      }
      
      // Apply framework filter (for code-web)
      if (filters.framework && filters.framework.length > 0) {
        filteredRawData = filteredRawData.filter(entry => {
          return entry.framework && filters.framework && filters.framework.includes(entry.framework);
        });
      }
      
      // Apply knowledge filter (for mr-web subtask)
      if (task === 'mr-web' && filters.knowledge && filters.knowledge.length > 0) {
        filteredRawData = filteredRawData.filter(entry => {
          // For mr-web, check both the task field (raw data) and subtask field (processed data)
          const subtaskValue = entry.subtask || entry.task;
          return subtaskValue && filters.knowledge && filters.knowledge.includes(subtaskValue);
        });
      }
      
      // Apply reasoning filter (for mr-web method)
      if (task === 'mr-web' && filters.reasoning && filters.reasoning.length > 0) {
        filteredRawData = filteredRawData.filter(entry => {
          return entry.method && filters.reasoning && filters.reasoning.includes(entry.method);
        });
      }
      
      // Group by model name and aggregate metrics
      const modelGroups = new Map<string, ResultEntry[]>();
      filteredRawData.forEach(entry => {
        const modelName = entry.model_name;
        if (!modelGroups.has(modelName)) {
          modelGroups.set(modelName, []);
        }
        modelGroups.get(modelName)!.push(entry);
      });
      
      // Create aggregated results for each model
      processedResults = Array.from(modelGroups.entries()).map(([modelName, entries]) => {
        // Aggregate metrics across all entries for this model
        const aggregatedMetrics: Record<string, number> = {};
        const metricCounts: Record<string, number> = {};
        
        entries.forEach(entry => {
          Object.entries(entry.metrics || {}).forEach(([key, value]) => {
            if (typeof value === 'number' && !isNaN(value)) {
              if (!aggregatedMetrics[key]) {
                aggregatedMetrics[key] = 0;
                metricCounts[key] = 0;
              }
              aggregatedMetrics[key] += value;
              metricCounts[key]++;
            }
          });
        });
        
        // Calculate averages
        Object.keys(aggregatedMetrics).forEach(key => {
          if (metricCounts[key] > 0) {
            aggregatedMetrics[key] = aggregatedMetrics[key] / metricCounts[key];
          }
        });
        
        // Use the first entry as base and add aggregated metrics
        const baseEntry = entries[0];
        
        // Collect unique datasets and frameworks for display
        const uniqueDatasets = [...new Set(entries.map(e => e.dataset))];
        const uniqueFrameworks = [...new Set(entries.map(e => e.framework).filter(f => f))];
        
        return {
          modelId: `${modelName}-${task}`,
          modelName: modelName,
          dataset: uniqueDatasets.length === 1 ? uniqueDatasets[0] : `${uniqueDatasets.length} datasets`,
          task: task,
          sourceLang: null,
          lang: baseEntry.lang || 'All',
          targetLang: null,
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
          difficulty: null,
          // Add the aggregated custom metrics
          ...aggregatedMetrics,
          // Preserve framework info for display (if applicable)
          framework: uniqueFrameworks.length === 1 ? uniqueFrameworks[0] : uniqueFrameworks.length > 1 ? `${uniqueFrameworks.length} frameworks` : undefined,
        } as ProcessedResult & { framework?: string };
      });
      break;
      
    default:
      throw new Error(`Unknown task type: ${task}`);
  }

  console.log('任务处理完成:', {
    task: task,
    totalProcessedResults: processedResults.length
  });

  // 应用所有过滤器
  let filteredResults = processedResults;

  // 1. 数据集过滤 (同级 OR 关系)
  if (filters.datasets && filters.datasets.length > 0) {
    const allowedDatasets = new Set(filters.datasets.map(d => d.toLowerCase().replace(/\s+/g, '')));
    
    // 只输出简化的日志
    console.log(`开始数据集过滤: ${filters.datasets.length} 个数据集, ${filteredResults.length} 条结果`);

    // Skip dataset filtering for new tasks as they're already filtered during processing
    if (!['code-web', 'interaction-2-code', 'code-robustness', 'mr-web'].includes(task.toLowerCase())) {
      filteredResults = filteredResults.filter(result => {
        const normalizedDataset = result.dataset.toLowerCase().replace(/\s+/g, '');
        return allowedDatasets.has(normalizedDataset);
      });
    }

    // 只输出简化的日志
    console.log(`数据集过滤完成: 剩余 ${filteredResults.length} 条结果`);
  }

  // 2. 语言过滤 (同级 OR 关系)
  if (filters.langs && filters.langs.length > 0) {
    // 只输出简化的日志
    console.log(`开始语言过滤: ${filters.langs.length} 种语言, ${filteredResults.length} 条结果`);
    
    filteredResults = filterAndAggregateByLanguages(filteredResults, filters.langs);
    
    // 只输出简化的日志
    console.log(`语言过滤完成: 剩余 ${filteredResults.length} 条结果`);
  }

  // 3. 知识领域过滤 (同级 OR 关系，跨级 AND 关系) - skip for mr-web as it's handled during raw data processing
  // NOTE: Knowledge filtering is now handled at the task level (before aggregation) for better results
  // This section is kept for non-special tasks
  if (filters.knowledge && filters.knowledge.length > 0 && task !== 'mr-web') {
    console.log(`开始知识领域过滤: ${filters.knowledge.length} 个领域, ${filteredResults.length} 条结果`);
    
    filteredResults = filteredResults.filter(result => {
      return filters.knowledge!.some(knowledgeFilter => {
        const filterLower = knowledgeFilter.toLowerCase();
        
        // Check other fields for broader matches
        const stringsToCheck: string[] = [];
        if (result.modelName) stringsToCheck.push(result.modelName.toLowerCase());
        if (result.dataset) stringsToCheck.push(result.dataset.toLowerCase());
        if (result.task) stringsToCheck.push(result.task.toLowerCase());
        
        return stringsToCheck.some(str => str.includes(filterLower));
      });
    });

    console.log(`知识领域过滤完成: 剩余 ${filteredResults.length} 条结果`);
  }



  // 5. 鲁棒性过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.robustness && filters.robustness.length > 0) {
    console.log(`应用鲁棒性过滤: ${filters.robustness.length} 种类型, ${filteredResults.length} 条结果`);
    
    // 预处理鲁棒性关键词
    const robustnessPatterns = filters.robustness.map(r => r.toLowerCase());
    
    filteredResults = filteredResults.filter(result => {
      // 创建要检查的字符串数组
      const stringsToCheck: string[] = [];
      if (result.modelName) stringsToCheck.push(result.modelName.toLowerCase());
      if (result.dataset) stringsToCheck.push(result.dataset.toLowerCase());
      
      return robustnessPatterns.some(pattern => 
        stringsToCheck.some(str => str.includes(pattern))
      );
    });
    
    console.log(`鲁棒性过滤后: 剩余 ${filteredResults.length} 条结果`);
  }

  // 6. 安全性过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.security && filters.security.length > 0) {
    console.log(`应用安全性过滤: ${filters.security.length} 种类型, ${filteredResults.length} 条结果`);
    
    // 预处理安全性关键词
    const securityPatterns = filters.security.map(s => s.toLowerCase());
    
    filteredResults = filteredResults.filter(result => {
      // 创建要检查的字符串数组
      const stringsToCheck: string[] = [];
      if (result.modelName) stringsToCheck.push(result.modelName.toLowerCase());
      if (result.dataset) stringsToCheck.push(result.dataset.toLowerCase());
      
      return securityPatterns.some(pattern => 
        stringsToCheck.some(str => str.includes(pattern))
      );
    });
    
    console.log(`安全性过滤后: 剩余 ${filteredResults.length} 条结果`);
  }

  // 新增：Modality过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.modalities && filters.modalities.length > 0) {
    // 移除过多的日志，只保留必要的开始和结束日志
    console.log('应用 Modality 过滤:', {
      selectedModalities: filters.modalities,
      totalResultsBefore: filteredResults.length
    });
    
    // 预先处理modalities数组以避免每次过滤时都要处理
    const modalityPatterns = filters.modalities
      .filter(modality => modality)
      .map(modality => modality.toLowerCase());
    
    if (modalityPatterns.length > 0) {
      filteredResults = filteredResults.filter(result => {
        // 创建要检查的字符串数组，避免每次都要检查对象是否存在
        const stringsToCheck: string[] = [];
        if (result.modelName) stringsToCheck.push(result.modelName.toLowerCase());
        if (result.dataset) stringsToCheck.push(result.dataset.toLowerCase());
        if (result.task) stringsToCheck.push(result.task.toLowerCase());
        if (result.lang) stringsToCheck.push(result.lang.toLowerCase());
        
        // 使用some进行短路操作
        return modalityPatterns.some(pattern => 
          stringsToCheck.some(str => str.includes(pattern))
        );
      });
    }
    
    console.log('Modality 过滤后:', {
      totalResultsAfter: filteredResults.length
    });
  }

  // 7. LLM Judge 过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.llmJudges && filters.llmJudges.length > 0) {
    console.log(`应用 LLM Judge 过滤: ${filters.llmJudges.length} 种评判, ${filteredResults.length} 条结果`);
    
    filteredResults = filteredResults.filter(result => {
      // 有llmjudge分数就通过，简化判断逻辑
      return result.llmjudge !== null;
    });
    
    console.log(`LLM Judge 过滤后: 剩余 ${filteredResults.length} 条结果`);
  }

  // 8. Framework 过滤 (同级 OR 关系，跨级 AND 关系) - for code-web task
  if (filters.framework && filters.framework.length > 0) {
    console.log(`应用 Framework 过滤: ${filters.framework.length} 种框架, ${filteredResults.length} 条结果`);
    
    // Skip framework filtering for new tasks as they're already filtered during processing
    if (!['code-web', 'interaction-2-code', 'code-robustness'].includes(task.toLowerCase())) {
      filteredResults = filteredResults.filter(result => {
        // Check if the result has a framework field and if it matches the selected frameworks
        const resultObj = result as Record<string, unknown>;
        return resultObj.framework && filters.framework && filters.framework.includes(resultObj.framework as string);
      });
    }
    
    console.log(`Framework 过滤后: 剩余 ${filteredResults.length} 条结果`);
  }

  // 简化最终日志
  console.log(`所有过滤器应用完成: 剩余 ${filteredResults.length} 条结果`);

  return filteredResults;
}

// 格式化结果为显示格式
export function formatResults(results: ProcessedResult[], filters?: FilterOptions): Array<Record<string, string | number>> {
  console.log(`📊 formatResults called with ${results.length} results`);
  console.log(`📊 First result sample:`, results[0]);

  // Check if this is precomputed data (has rank field and is already formatted)
  const firstResult = results[0] as Record<string, unknown>;
  const isPrecomputedData = results.length > 0 && 'rank' in firstResult && 
    (typeof firstResult['pass@1'] === 'string' || 
     typeof firstResult['LLM Judge'] === 'string' ||
     typeof firstResult['Accuracy'] === 'string' ||
     typeof firstResult['CLIP'] === 'string' ||
     typeof firstResult['VAN'] === 'string' ||
     typeof firstResult['easy_pass@1'] === 'string');
  
  console.log(`📊 Is precomputed data: ${isPrecomputedData}`);
  
  if (isPrecomputedData) {
    // For precomputed data, results are already sorted and formatted
    console.log('✅ Using precomputed data, processing for display');
    const formattedResults = results.map((result: Record<string, unknown>) => {
      // Create a properly formatted result object
      const formattedResult: Record<string, string | number> = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rank: result.rank as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: result.model as any,
      };
      
      // Copy all other fields from the precomputed data
      // This includes metrics like 'LLM Judge', 'pass@1', etc.
      Object.keys(result).forEach(key => {
        if (key !== 'rank' && key !== 'model') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formattedResult[key] = result[key] as any;
        }
      });
      
      return formattedResult;
    });
    console.log(`📊 Formatted ${formattedResults.length} precomputed results`);
    console.log(`📊 Sample formatted result:`, formattedResults[0]);
    return formattedResults;
  } else {
    console.log('⚠️ Using real-time processing data');
  }

  // Get the sorted results by pass@1 values (for non-precomputed data)
  const sortedResults = [...results].sort((a, b) => {
    // If showing by difficulty, use easyPass1 for sorting
    if (filters?.showByDifficulty) {
      const aValue = a.easyPass1 !== null ? a.easyPass1 : -Infinity;
      const bValue = b.easyPass1 !== null ? b.easyPass1 : -Infinity;
      return bValue - aValue; // descending order
    }
    
    // Otherwise use pass1 for sorting
    const aValue = a.pass1 !== null ? a.pass1 : -Infinity;
    const bValue = b.pass1 !== null ? b.pass1 : -Infinity;
    return bValue - aValue; // descending order
  });

  return sortedResults.map((result, index) => {
    // Use the explicit MODEL_URLS mapping for model URLs
    const modelUrl = MODEL_URLS[result.modelName] || "";
    
    // Create the base result object
    const formattedResult: Record<string, string | number> = {
      rank: index + 1,
      model: result.modelName,
      model_url: modelUrl,
      ability: filters?.langs?.length ? (result.lang || '-') : 'All',
      task: (filters?.tasks && filters.tasks.length > 1) ? (result.task || '-') : 'All',
    };

    // Add metrics based on whether we're showing by difficulty
    if (filters?.showByDifficulty) {
      // Add difficulty-based metrics with default '-' for null values
      formattedResult['easy_pass@1'] = result.easyPass1 !== null ? (result.easyPass1 * 100).toFixed(1) : '-';
      formattedResult['medium_pass@1'] = result.mediumPass1 !== null ? (result.mediumPass1 * 100).toFixed(1) : '-';
      formattedResult['hard_pass@1'] = result.hardPass1 !== null ? (result.hardPass1 * 100).toFixed(1) : '-';
      
      formattedResult['easy_pass@3'] = result.easyPass3 !== null ? (result.easyPass3 * 100).toFixed(1) : '-';
      formattedResult['medium_pass@3'] = result.mediumPass3 !== null ? (result.mediumPass3 * 100).toFixed(1) : '-';
      formattedResult['hard_pass@3'] = result.hardPass3 !== null ? (result.hardPass3 * 100).toFixed(1) : '-';
      
      formattedResult['easy_pass@5'] = result.easyPass5 !== null ? (result.easyPass5 * 100).toFixed(1) : '-';
      formattedResult['medium_pass@5'] = result.mediumPass5 !== null ? (result.mediumPass5 * 100).toFixed(1) : '-';
      formattedResult['hard_pass@5'] = result.hardPass5 !== null ? (result.hardPass5 * 100).toFixed(1) : '-';
    } else {
      // Add standard metrics with default '-' for null values
      formattedResult['pass@1'] = result.pass1 !== null ? (result.pass1 * 100).toFixed(1) : '-';
      formattedResult['pass@3'] = result.pass3 !== null ? (result.pass3 * 100).toFixed(1) : '-';
      formattedResult['pass@5'] = result.pass5 !== null ? (result.pass5 * 100).toFixed(1) : '-';
    }

    // Add other metrics (common for both modes)
    formattedResult['CodeBLEU'] = result.codebleu !== null ? (result.codebleu * 100).toFixed(1) : '-';
    formattedResult['llmjudge'] = result.llmjudge !== null ? ((result.llmjudge / 5) * 100).toFixed(1) : '-';
    formattedResult['Execution'] = result.executionAccuracy !== null ? (result.executionAccuracy * 100).toFixed(1) : '-';

    // Add vulnerability detection metrics
    formattedResult['P-C'] = result['P-C'] !== null && result['P-C'] !== undefined ? (result['P-C'] * 100).toFixed(1) : '-';
    formattedResult['P-V'] = result['P-V'] !== null && result['P-V'] !== undefined ? (result['P-V'] * 100).toFixed(1) : '-';
    formattedResult['P-B'] = result['P-B'] !== null && result['P-B'] !== undefined ? (result['P-B'] * 100).toFixed(1) : '-';
    formattedResult['P-R'] = result['P-R'] !== null && result['P-R'] !== undefined ? (result['P-R'] * 100).toFixed(1) : '-';
    formattedResult['Accuracy'] = result.Accuracy !== null && result.Accuracy !== undefined ? (result.Accuracy * 100).toFixed(1) : '-';
    formattedResult['Precision'] = result.Precision !== null && result.Precision !== undefined ? (result.Precision * 100).toFixed(1) : '-';
    formattedResult['Recall'] = result.Recall !== null && result.Recall !== undefined ? (result.Recall * 100).toFixed(1) : '-';
    formattedResult['F1 Score'] = result['F1 Score'] !== null && result['F1 Score'] !== undefined ? (result['F1 Score'] * 100).toFixed(1) : '-';

    // Add custom metrics for new tasks
    // code-web and interaction-2-code metrics
    formattedResult['CLIP'] = result['CLIP'] !== null && result['CLIP'] !== undefined ? (result['CLIP'] * 100).toFixed(1) : '-';
    formattedResult['Compilation'] = result['Compilation'] !== null && result['Compilation'] !== undefined ? (result['Compilation'] * 100).toFixed(1) : '-';
    formattedResult['SSIM'] = result['SSIM'] !== null && result['SSIM'] !== undefined ? (result['SSIM'] * 100).toFixed(1) : '-';
    formattedResult['Text'] = result['Text'] !== null && result['Text'] !== undefined ? (result['Text'] * 100).toFixed(1) : '-';
    formattedResult['Position'] = result['Position'] !== null && result['Position'] !== undefined ? (result['Position'] * 100).toFixed(1) : '-';
    formattedResult['Implement Rate'] = result['Implement Rate'] !== null && result['Implement Rate'] !== undefined ? (result['Implement Rate'] * 100).toFixed(1) : '-';
    
    // code-robustness metrics  
    formattedResult['VAN'] = result['VAN'] !== null && result['VAN'] !== undefined ? result['VAN'].toFixed(1) : '-';
    formattedResult['REN'] = result['REN'] !== null && result['REN'] !== undefined ? result['REN'].toFixed(1) : '-';
    formattedResult['RTF'] = result['RTF'] !== null && result['RTF'] !== undefined ? result['RTF'].toFixed(1) : '-';
    formattedResult['GBC'] = result['GBC'] !== null && result['GBC'] !== undefined ? result['GBC'].toFixed(1) : '-';
    formattedResult['ALL'] = result['ALL'] !== null && result['ALL'] !== undefined ? result['ALL'].toFixed(1) : '-';
    formattedResult['MDC'] = result['MDC'] !== null && result['MDC'] !== undefined ? result['MDC'].toFixed(1) : '-';
    formattedResult['MPS'] = result['MPS'] !== null && result['MPS'] !== undefined ? result['MPS'].toFixed(1) : '-';
    formattedResult['MHC'] = result['MHC'] !== null && result['MHC'] !== undefined ? result['MHC'].toFixed(1) : '-';
    
    // mr-web metrics
    formattedResult['MAE'] = result['MAE'] !== null && result['MAE'] !== undefined ? result['MAE'].toFixed(3) : '-';
    formattedResult['NEMD'] = result['NEMD'] !== null && result['NEMD'] !== undefined ? result['NEMD'].toFixed(3) : '-';
    formattedResult['RER'] = result['RER'] !== null && result['RER'] !== undefined ? (result['RER'] * 100).toFixed(1) : '-';

    return formattedResult;
  });
} 