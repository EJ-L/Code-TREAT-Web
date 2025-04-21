import { ProcessedResult, FilterOptions, TaskType, ResultEntry } from './types';
import { loadAllData, processResult } from './dataLoader';
import { processCodeGeneration, aggregateCodeGenerationResults } from './tasks/codeGeneration';
import { processCodeTranslation, aggregateCodeTranslationResults } from './tasks/codeTranslation';
import { processCodeSummarization, aggregateCodeSummarizationResults } from './tasks/codeSummarization';
import { processCodeExecution, aggregateCodeExecutionResults } from './tasks/codeExecution';
import { processVulnerabilityDetection, aggregateVulnerabilityDetectionResults } from './tasks/vulnerabilityDetection';
import { processCodeReview, aggregateCodeReviewResults } from './tasks/codeReview';
import { processInputPrediction, aggregateInputPredictionResults } from './tasks/inputPrediction';
import { processOutputPrediction, aggregateOutputPredictionResults } from './tasks/outputPrediction';
import { processOverall } from './tasks/overall';

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
  // 加载所有数据
  const rawData = await loadAllData();
  
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
      processedResults = aggregateCodeGenerationResults(processCodeGeneration(rawData.map(processResult), filters));
      break;
      
    case 'code translation':
      processedResults = aggregateCodeTranslationResults(processCodeTranslation(rawData.map(processResult), filters));
      break;
      
    case 'code summarization': {
      const summarizationResults = processCodeSummarization(rawData, filters);
      processedResults = aggregateCodeSummarizationResults(summarizationResults);
      break;
    }
    
    case 'code review': {
      const reviewResults = processCodeReview(rawData, filters);
      processedResults = aggregateCodeReviewResults(reviewResults);
      break;
    }
      
    case 'code execution':
      processedResults = aggregateCodeExecutionResults(processCodeExecution(rawData.map(processResult), filters));
      break;
      
    case 'vulnerability detection':
      processedResults = aggregateVulnerabilityDetectionResults(processVulnerabilityDetection(rawData.map(processResult), filters));
      break;
      
    case 'input prediction':
      processedResults = aggregateInputPredictionResults(processInputPrediction(rawData.map(processResult), filters));
      break;
      
    case 'output prediction':
      processedResults = aggregateOutputPredictionResults(processOutputPrediction(rawData.map(processResult), filters));
      break;
      
    case 'overall':
      // overall任务是异步的，需要await
      processedResults = await processOverall(rawData.map(processResult), filters);
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

    filteredResults = filteredResults.filter(result => {
      const normalizedDataset = result.dataset.toLowerCase().replace(/\s+/g, '');
      return allowedDatasets.has(normalizedDataset);
    });

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

  // 3. 知识领域过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.knowledge && filters.knowledge.length > 0) {
    // 只输出简化的日志
    console.log(`开始知识领域过滤: ${filters.knowledge.length} 个领域, ${filteredResults.length} 条结果`);
    
    // 预处理知识领域关键词
    const knowledgePatterns = filters.knowledge.map(k => k.toLowerCase());
    
    filteredResults = filteredResults.filter(result => {
      // 创建要检查的字符串数组
      const stringsToCheck: string[] = [];
      if (result.modelName) stringsToCheck.push(result.modelName.toLowerCase());
      if (result.dataset) stringsToCheck.push(result.dataset.toLowerCase());
      if (result.task) stringsToCheck.push(result.task.toLowerCase());
      
      return knowledgePatterns.some(pattern => 
        stringsToCheck.some(str => str.includes(pattern))
      );
    });

    // 只输出简化的日志
    console.log(`知识领域过滤完成: 剩余 ${filteredResults.length} 条结果`);
  }

  // 4. 推理类型过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.reasoning && filters.reasoning.length > 0) {
    console.log(`应用推理类型过滤: ${filters.reasoning.length} 种类型, ${filteredResults.length} 条结果`);
    
    // 预处理推理类型关键词
    const reasoningPatterns = filters.reasoning.map(r => r.toLowerCase());
    
    filteredResults = filteredResults.filter(result => {
      // 创建要检查的字符串数组
      const stringsToCheck: string[] = [];
      if (result.modelName) stringsToCheck.push(result.modelName.toLowerCase());
      if (result.dataset) stringsToCheck.push(result.dataset.toLowerCase());
      
      return reasoningPatterns.some(pattern => 
        stringsToCheck.some(str => str.includes(pattern))
      );
    });
    
    console.log(`推理类型过滤后: 剩余 ${filteredResults.length} 条结果`);
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

  // 简化最终日志
  console.log(`所有过滤器应用完成: 剩余 ${filteredResults.length} 条结果`);

  return filteredResults;
}

// 格式化结果为显示格式
export function formatResults(results: ProcessedResult[], filters?: FilterOptions): Array<Record<string, string | number>> {
  console.log(`格式化结果: ${results.length} 条`);

  // Get the sorted results by pass@1 values
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
    // Create the base result object
    const formattedResult: Record<string, string | number> = {
      rank: index + 1,
      model: result.modelName,
      ability: filters?.langs?.length ? (result.lang || '-') : 'All',
      task: (filters?.tasks && filters.tasks.length > 1) ? (result.task || '-') : 'All',
    };

    // Add metrics based on whether we're showing by difficulty
    if (filters?.showByDifficulty) {
      // Add difficulty-based metrics with default '-' for null values
      formattedResult['easy_pass@1'] = result.easyPass1 !== null ? (result.easyPass1 * 100).toFixed(2) + '%' : '-';
      formattedResult['medium_pass@1'] = result.mediumPass1 !== null ? (result.mediumPass1 * 100).toFixed(2) + '%' : '-';
      formattedResult['hard_pass@1'] = result.hardPass1 !== null ? (result.hardPass1 * 100).toFixed(2) + '%' : '-';
      
      formattedResult['easy_pass@3'] = result.easyPass3 !== null ? (result.easyPass3 * 100).toFixed(2) + '%' : '-';
      formattedResult['medium_pass@3'] = result.mediumPass3 !== null ? (result.mediumPass3 * 100).toFixed(2) + '%' : '-';
      formattedResult['hard_pass@3'] = result.hardPass3 !== null ? (result.hardPass3 * 100).toFixed(2) + '%' : '-';
      
      formattedResult['easy_pass@5'] = result.easyPass5 !== null ? (result.easyPass5 * 100).toFixed(2) + '%' : '-';
      formattedResult['medium_pass@5'] = result.mediumPass5 !== null ? (result.mediumPass5 * 100).toFixed(2) + '%' : '-';
      formattedResult['hard_pass@5'] = result.hardPass5 !== null ? (result.hardPass5 * 100).toFixed(2) + '%' : '-';
    } else {
      // Add standard metrics with default '-' for null values
      formattedResult['pass@1'] = result.pass1 !== null ? (result.pass1 * 100).toFixed(2) + '%' : '-';
      formattedResult['pass@3'] = result.pass3 !== null ? (result.pass3 * 100).toFixed(2) + '%' : '-';
      formattedResult['pass@5'] = result.pass5 !== null ? (result.pass5 * 100).toFixed(2) + '%' : '-';
    }

    // Add other metrics (common for both modes)
    formattedResult['CodeBLEU'] = result.codebleu !== null ? (result.codebleu * 100).toFixed(2) + '%' : '-';
    formattedResult['llmjudge'] = result.llmjudge !== null ? ((result.llmjudge / 5) * 100).toFixed(2) + '%' : '-';
    formattedResult['Execution'] = result.executionAccuracy !== null ? (result.executionAccuracy * 100).toFixed(2) + '%' : '-';

    // Add vulnerability detection metrics
    formattedResult['P-C'] = result['P-C'] !== null && result['P-C'] !== undefined ? (result['P-C'] * 100).toFixed(2) + '%' : '-';
    formattedResult['P-V'] = result['P-V'] !== null && result['P-V'] !== undefined ? (result['P-V'] * 100).toFixed(2) + '%' : '-';
    formattedResult['P-B'] = result['P-B'] !== null && result['P-B'] !== undefined ? (result['P-B'] * 100).toFixed(2) + '%' : '-';
    formattedResult['P-R'] = result['P-R'] !== null && result['P-R'] !== undefined ? (result['P-R'] * 100).toFixed(2) + '%' : '-';
    formattedResult['Accuracy'] = result.Accuracy !== null && result.Accuracy !== undefined ? (result.Accuracy * 100).toFixed(2) + '%' : '-';
    formattedResult['Precision'] = result.Precision !== null && result.Precision !== undefined ? (result.Precision * 100).toFixed(2) + '%' : '-';
    formattedResult['Recall'] = result.Recall !== null && result.Recall !== undefined ? (result.Recall * 100).toFixed(2) + '%' : '-';
    formattedResult['F1 Score'] = result['F1 Score'] !== null && result['F1 Score'] !== undefined ? (result['F1 Score'] * 100).toFixed(2) + '%' : '-';

    return formattedResult;
  });
} 