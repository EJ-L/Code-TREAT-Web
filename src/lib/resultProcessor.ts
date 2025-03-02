import { ProcessedResult, FilterOptions, TaskType, ResultEntry } from './types';
import { loadAllData, processResult } from './dataLoader';
import { processCodeGeneration, aggregateCodeGenerationResults } from './tasks/codeGeneration';
import { processCodeTranslation, aggregateCodeTranslationResults } from './tasks/codeTranslation';
import { processCodeSummarization, aggregateCodeSummarizationResults } from './tasks/codeSummarization';
import { processCodeExecution, aggregateCodeExecutionResults } from './tasks/codeExecution';
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
  console.log('开始语言过滤和聚合:', {
    totalResults: results.length,
    selectedLangs: selectedLangs,
    sampleResult: results[0]
  });

  if (!selectedLangs.length) return results;

  // 按模型分组
  const modelGroups = new Map<string, ProcessedResult[]>();
  
  results.forEach(result => {
    const resultLang = result.lang.toLowerCase();
    console.log('检查结果语言:', {
      modelName: result.modelName,
      resultLang: resultLang,
      selectedLangs: selectedLangs.map(l => l.toLowerCase()),
      isIncluded: selectedLangs.map(l => l.toLowerCase()).includes(resultLang)
    });

    if (selectedLangs.map(l => l.toLowerCase()).includes(resultLang)) {
      const key = result.modelName;
      if (!modelGroups.has(key)) {
        modelGroups.set(key, []);
      }
      modelGroups.get(key)!.push(result);
    }
  });

  console.log('按模型分组结果:', {
    totalModels: modelGroups.size,
    modelNames: Array.from(modelGroups.keys())
  });

  // 对每个模型的结果计算平均值
  const aggregatedResults = Array.from(modelGroups.entries()).map(([modelName, modelResults]) => {
    const baseResult = { ...modelResults[0] };
    const metrics = ['pass1', 'pass3', 'pass5', 'codebleu', 'llmjudge', 'executionAccuracy'] as const;
    
    console.log(`处理模型 ${modelName} 的结果:`, {
      totalResults: modelResults.length,
      languages: modelResults.map(r => r.lang)
    });

    metrics.forEach(metric => {
      const validValues = modelResults
        .map(r => r[metric])
        .filter((value): value is number => value !== null);
      
      if (validValues.length > 0) {
        baseResult[metric] = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        console.log(`计算 ${metric} 的平均值:`, {
          modelName,
          values: validValues,
          average: baseResult[metric]
        });
      } else {
        baseResult[metric] = null;
      }
    });

    // 合并语言列表
    baseResult.lang = selectedLangs.join(', ');
    
    return baseResult;
  });

  console.log('语言过滤和聚合完成:', {
    totalResultsAfter: aggregatedResults.length,
    sampleResult: aggregatedResults[0]
  });

  return aggregatedResults;
};

export async function processResults(task: TaskType, filters: FilterOptions): Promise<ProcessedResult[]> {
  // 加载所有数据
  const rawData = await loadAllData();
  
  console.log('处理任务开始:', {
    task: task,
    filters: filters,
    totalRawData: rawData.length
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
      
    case 'code execution':
      processedResults = aggregateCodeExecutionResults(processCodeExecution(rawData.map(processResult), filters));
      break;
      
    case 'overall':
      processedResults = processOverall(rawData.map(processResult), filters);
      break;
      
    default:
      throw new Error(`Unknown task type: ${task}`);
  }

  console.log('任务处理完成:', {
    task: task,
    totalProcessedResults: processedResults.length,
    sampleProcessedResult: processedResults[0]
  });

  // 应用所有过滤器
  let filteredResults = processedResults;

  // 1. 数据集过滤 (同级 OR 关系)
  if (filters.datasets && filters.datasets.length > 0) {
    const allowedDatasets = new Set(filters.datasets.map(d => d.toLowerCase().trim()));
    
    // 只在过滤开始时输出一次日志
    console.log('开始数据集过滤:', {
      selectedDatasets: Array.from(allowedDatasets),
      totalResults: filteredResults.length
    });

    filteredResults = filteredResults.filter(result => {
      const resultDataset = result.dataset.toLowerCase().trim();
      return allowedDatasets.has(resultDataset);
    });

    // 只在过滤结束时输出一次日志
    console.log('数据集过滤完成:', {
      totalResultsAfter: filteredResults.length,
      remainingDatasets: [...new Set(filteredResults.map(r => r.dataset))]
    });
  }

  // 2. 语言过滤 (同级 OR 关系)
  if (filters.langs && filters.langs.length > 0) {
    console.log('开始语言过滤:', {
      selectedLangs: filters.langs,
      totalResults: filteredResults.length
    });
    
    filteredResults = filterAndAggregateByLanguages(filteredResults, filters.langs);
    
    console.log('语言过滤完成:', {
      totalResultsAfter: filteredResults.length
    });
  }

  // 3. 知识领域过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.knowledge && filters.knowledge.length > 0) {
    console.log('开始知识领域过滤:', {
      selectedKnowledge: filters.knowledge,
      totalResults: filteredResults.length
    });

    filteredResults = filteredResults.filter(result => 
      filters.knowledge!.some(knowledge => {
        const knowledgePattern = knowledge.toLowerCase();
        return (
          result.modelName.toLowerCase().includes(knowledgePattern) ||
          result.dataset.toLowerCase().includes(knowledgePattern) ||
          (result.task && result.task.toLowerCase().includes(knowledgePattern))
        );
      })
    );

    console.log('知识领域过滤完成:', {
      totalResultsAfter: filteredResults.length
    });
  }

  // 4. 推理类型过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.reasoning && filters.reasoning.length > 0) {
    console.log('应用推理类型过滤:', {
      selectedReasoning: filters.reasoning,
      totalResultsBefore: filteredResults.length
    });
    filteredResults = filteredResults.filter(result => {
      // 检查结果是否包含任意一个选定的推理类型
      return filters.reasoning!.some(reasoning => {
        const reasoningPattern = reasoning.toLowerCase();
        return (
          result.modelName.toLowerCase().includes(reasoningPattern) ||
          result.dataset.toLowerCase().includes(reasoningPattern)
        );
      });
    });
    console.log('推理类型过滤后:', {
      totalResultsAfter: filteredResults.length
    });
  }

  // 5. 鲁棒性过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.robustness && filters.robustness.length > 0) {
    console.log('应用鲁棒性过滤:', {
      selectedRobustness: filters.robustness,
      totalResultsBefore: filteredResults.length
    });
    filteredResults = filteredResults.filter(result => {
      // 检查结果是否满足任意一个选定的鲁棒性标准
      return filters.robustness!.some(robustness => {
        const robustnessPattern = robustness.toLowerCase();
        return (
          result.modelName.toLowerCase().includes(robustnessPattern) ||
          result.dataset.toLowerCase().includes(robustnessPattern)
        );
      });
    });
    console.log('鲁棒性过滤后:', {
      totalResultsAfter: filteredResults.length
    });
  }

  // 6. 安全性过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.security && filters.security.length > 0) {
    console.log('应用安全性过滤:', {
      selectedSecurity: filters.security,
      totalResultsBefore: filteredResults.length
    });
    filteredResults = filteredResults.filter(result => {
      // 检查结果是否满足任意一个选定的安全性标准
      return filters.security!.some(security => {
        const securityPattern = security.toLowerCase();
        return (
          result.modelName.toLowerCase().includes(securityPattern) ||
          result.dataset.toLowerCase().includes(securityPattern)
        );
      });
    });
    console.log('安全性过滤后:', {
      totalResultsAfter: filteredResults.length
    });
  }

  // 7. LLM Judge 过滤 (同级 OR 关系，跨级 AND 关系)
  if (filters.llmJudges && filters.llmJudges.length > 0) {
    console.log('应用 LLM Judge 过滤:', {
      selectedJudges: filters.llmJudges,
      totalResultsBefore: filteredResults.length
    });
    filteredResults = filteredResults.filter(result => {
      // 检查结果是否包含任意一个选定的 LLM Judge
      return filters.llmJudges!.some(judge => {
        // 如果结果中有 llmjudge 分数，则认为它通过了该 judge 的评估
        return result.llmjudge !== null;
      });
    });
    console.log('LLM Judge 过滤后:', {
      totalResultsAfter: filteredResults.length
    });
  }

  console.log('所有过滤器应用完成:', {
    totalResultsAfter: filteredResults.length,
    sampleResult: filteredResults[0]
  });

  return filteredResults;
}

// 格式化结果为显示格式
export function formatResults(results: ProcessedResult[]): Array<Record<string, string | number>> {
  console.log('开始格式化结果:', {
    totalResults: results.length,
    sampleResult: results[0]
  });

  const formattedResults = results.map((result, index) => {
    const formatted: Record<string, string | number> = {
      rank: index + 1,
      model: result.modelName,
    };

    // 添加指标
    if (result.pass1 !== null) formatted['pass@1'] = result.pass1;
    if (result.pass3 !== null) formatted['pass@3'] = result.pass3;
    if (result.pass5 !== null) formatted['pass@5'] = result.pass5;
    if (result.codebleu !== null) formatted['CodeBLEU'] = result.codebleu;
    if (result.llmjudge !== null) {
      if (result.task === 'code summarization') {
        formatted['llmjudge'] = result.llmjudge;
      } else {
        formatted['LLMJudge'] = result.llmjudge;
      }
    }
    if (result.executionAccuracy !== null) formatted['Execution'] = result.executionAccuracy;

    // 使用实际的语言值
    formatted.ability = result.lang || '-';
    formatted.task = result.task.charAt(0).toUpperCase() + result.task.slice(1);

    return formatted;
  });

  console.log('格式化完成:', {
    totalFormattedResults: formattedResults.length,
    sampleFormattedResult: formattedResults[0]
  });

  return formattedResults;
} 