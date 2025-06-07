import { ProcessedResult, FilterOptions } from '../types';
import { processCodeGeneration, aggregateCodeGenerationResults } from './codeGeneration';
import { processCodeTranslation, aggregateCodeTranslationResults } from './codeTranslation';
import { processCodeSummarization, aggregateCodeSummarizationResults } from './codeSummarization';
import { processCodeExecution, aggregateCodeExecutionResults } from './codeExecution';
import { processVulnerabilityDetection, aggregateVulnerabilityDetectionResults } from './vulnerabilityDetection';
import { loadAllData, processResult } from '../dataLoader';

export async function processOverall(rawResults: ProcessedResult[], filters: FilterOptions): Promise<ProcessedResult[]> {
  console.log('Processing overall task:', {
    totalResults: rawResults.length,
    filters: filters
  });

  // 需要原始数据来处理所有任务
  const rawData = await loadAllData();
  const processedRawData = rawData.map(processResult);
  
  // 收集所有任务的处理结果
  const allTasksResults: ProcessedResult[] = [];

  // Apply all relevant filters to raw results
  let filteredResults = rawResults;

  // Filter by dataset if specified
  if (filters.datasets?.length > 0) {
    filteredResults = filteredResults.filter(result => {
      const resultDataset = result.dataset?.toLowerCase();
      if (!resultDataset) {
        console.log('Filtered out due to missing dataset:', {
          modelName: result.modelName,
          task: result.task
        });
        return false;
      }
      const isIncluded = filters.datasets.map(d => d.toLowerCase()).includes(resultDataset);
      if (!isIncluded) {
        // console.log('Filtered out due to dataset mismatch:', {
        //   modelName: result.modelName,
        //   dataset: result.dataset,
        //   allowedDatasets: filters.datasets
        // });
      }
      return isIncluded;
    });
  }

  // Filter by language if specified
  if (filters.langs?.length > 0) {
    filteredResults = filteredResults.filter(result => {
      const resultLang = result.lang?.toLowerCase();
      if (!resultLang) {
        console.log('Filtered out due to missing language:', {
          modelName: result.modelName,
          task: result.task
        });
        return false;
      }
      const isIncluded = filters.langs.map(l => l.toLowerCase()).includes(resultLang);
      if (!isIncluded) {
        console.log('Filtered out due to language mismatch:', {
          modelName: result.modelName,
          lang: result.lang,
          allowedLangs: filters.langs
        });
      }
      return isIncluded;
    });
  }

  // Filter by modality if specified
  if (filters.modalities?.length > 0) {
    console.log('Applying modality filter in Overall task:', {
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
    
    console.log('After modality filtering in Overall task:', {
      totalResultsAfter: filteredResults.length,
      remainingModels: filteredResults.length > 0 ? 
        [...new Set(filteredResults.slice(0, 5).map(r => r.modelName))].concat(
          filteredResults.length > 5 ? ['...更多'] : []
        ) : []
    });
  }

  console.log('After filtering:', {
    totalFilteredResults: filteredResults.length,
    appliedFilters: {
      datasets: filters.datasets,
      langs: filters.langs,
      modalities: filters.modalities
    }
  });

  // 处理各种任务类型的数据
  // 1. 处理代码生成任务
  try {
    console.log('Processing code generation task with filters:', {
      datasets: filters.datasets,
      langs: filters.langs,
      modalities: filters.modalities
    });
    const codeGenResults = processCodeGeneration(processedRawData, filters);
    const aggregatedCodeGenResults = aggregateCodeGenerationResults(codeGenResults);
    allTasksResults.push(...aggregatedCodeGenResults);
  } catch (error) {
    console.error('Error processing code generation task:', error);
  }

  // 2. 处理代码翻译任务
  try {
    console.log('Processing code translation task with filters:', {
      datasets: filters.datasets,
      langs: filters.langs,
      modalities: filters.modalities
    });
    const codeTransResults = processCodeTranslation(processedRawData, filters);
    const aggregatedCodeTransResults = aggregateCodeTranslationResults(codeTransResults);
    allTasksResults.push(...aggregatedCodeTransResults);
  } catch (error) {
    console.error('Error processing code translation task:', error);
  }

  // 3. 处理代码摘要任务
  try {
    console.log('Processing code summarization task with filters:', {
      datasets: filters.datasets,
      langs: filters.langs,
      modalities: filters.modalities
    });
    const codeSumResults = processCodeSummarization(rawData, filters);
    const aggregatedCodeSumResults = aggregateCodeSummarizationResults(codeSumResults);
    allTasksResults.push(...aggregatedCodeSumResults);
  } catch (error) {
    console.error('Error processing code summarization task:', error);
  }

  // 4. 处理代码执行任务
  try {
    console.log('Processing code execution task with filters:', {
      datasets: filters.datasets,
      langs: filters.langs,
      modalities: filters.modalities
    });
    const codeExecResults = processCodeExecution(processedRawData, filters);
    const aggregatedCodeExecResults = aggregateCodeExecutionResults(codeExecResults);
    allTasksResults.push(...aggregatedCodeExecResults);
  } catch (error) {
    console.error('Error processing code execution task:', error);
  }

  // 5. 处理漏洞检测任务
  try {
    console.log('Processing vulnerability detection task with filters:', {
      datasets: filters.datasets,
      langs: filters.langs,
      modalities: filters.modalities
    });
    // 不要依赖于rawData中的漏洞检测数据，直接从JSON文件加载
    // 强行使用一个空数组，这样函数内部会直接从JSON文件加载数据
    const vulDetectResults = processVulnerabilityDetection([], filters);
    console.log('漏洞检测任务处理完成:', {
      totalResults: vulDetectResults.length,
      modelNames: [...new Set(vulDetectResults.map(r => r.modelName))],
      datasets: [...new Set(vulDetectResults.map(r => r.dataset))],
      sampleResult: vulDetectResults[0]
    });
    
    // 清晰地标记针对每个数据集的指标可用性
    const hasPrimeVul = !filters.datasets || filters.datasets.length === 0 || 
      filters.datasets.map(d => d.toLowerCase()).includes('primevul');
    const hasPrimeVulPairs = !filters.datasets || filters.datasets.length === 0 || 
      filters.datasets.map(d => d.toLowerCase()).includes('primevulpairs');
      
    console.log('漏洞检测数据集可用性:', {
      hasPrimeVul,
      hasPrimeVulPairs
    });
    
    const aggregatedVulDetectResults = aggregateVulnerabilityDetectionResults(vulDetectResults);
    console.log('漏洞检测结果聚合完成:', {
      totalResults: aggregatedVulDetectResults.length,
      sampleResult: aggregatedVulDetectResults[0]
    });
    
    allTasksResults.push(...aggregatedVulDetectResults);
  } catch (error) {
    console.error('Error processing vulnerability detection task:', error);
  }

  // 将所有任务的结果整合到一起
  console.log('Collected results from all tasks:', {
    totalResults: allTasksResults.length,
    taskTypes: [...new Set(allTasksResults.map(r => r.task))],
    vulnDetectionResults: allTasksResults.filter(r => r.task === 'vulnerability detection').length
  });

  // Group by model name
  const groupedResults = new Map<string, ProcessedResult[]>();
  allTasksResults.forEach(result => {
    const key = result.modelName;
    if (!groupedResults.has(key)) {
      groupedResults.set(key, []);
    }
    groupedResults.get(key)!.push(result);
  });

  // Calculate aggregated metrics for each model with difficulty-based grouping
  const finalResults = Array.from(groupedResults.entries()).map(([modelName, modelResults]) => {
    return processOverallTask(modelResults);
  });

  return finalResults;
}

function processOverallTask(modelResults: ProcessedResult[]): ProcessedResult {
  const baseResult = { ...modelResults[0] };
  baseResult.task = 'overall';
  
  // 计算标准指标的平均值
  const metrics = ['pass1', 'pass3', 'pass5', 'codebleu', 'llmjudge'] as const;
  metrics.forEach(metric => {
    const validResults = modelResults.filter(r => r[metric] !== null);
    if (validResults.length > 0) {
      baseResult[metric] = validResults.reduce((sum, r) => sum + r[metric]!, 0) / validResults.length;
    } else {
      baseResult[metric] = null;
    }
  });

  // 添加漏洞检测指标
  const vulnMetrics = ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'P-C', 'P-V', 'P-B', 'P-R'] as const;
  vulnMetrics.forEach(metric => {
    const validResults = modelResults.filter(r => r[metric as keyof ProcessedResult] !== null && r[metric as keyof ProcessedResult] !== undefined);
    if (validResults.length > 0) {
      (baseResult as any)[metric] = validResults.reduce((sum, r) => sum + (r[metric as keyof ProcessedResult] as number), 0) / validResults.length;
    } else {
      (baseResult as any)[metric] = null;
    }
  });

  // 计算难度特定指标
  // Easy difficulty
  const validEasyPass1Results = modelResults.filter(r => r.easyPass1 !== null);
  if (validEasyPass1Results.length > 0) {
    baseResult.easyPass1 = validEasyPass1Results.reduce((sum, r) => sum + r.easyPass1!, 0) / validEasyPass1Results.length;
  }
  
  const validEasyPass3Results = modelResults.filter(r => r.easyPass3 !== null);
  if (validEasyPass3Results.length > 0) {
    baseResult.easyPass3 = validEasyPass3Results.reduce((sum, r) => sum + r.easyPass3!, 0) / validEasyPass3Results.length;
  }
  
  const validEasyPass5Results = modelResults.filter(r => r.easyPass5 !== null);
  if (validEasyPass5Results.length > 0) {
    baseResult.easyPass5 = validEasyPass5Results.reduce((sum, r) => sum + r.easyPass5!, 0) / validEasyPass5Results.length;
  }
  
  // Medium difficulty
  const validMediumPass1Results = modelResults.filter(r => r.mediumPass1 !== null);
  if (validMediumPass1Results.length > 0) {
    baseResult.mediumPass1 = validMediumPass1Results.reduce((sum, r) => sum + r.mediumPass1!, 0) / validMediumPass1Results.length;
  }
  
  const validMediumPass3Results = modelResults.filter(r => r.mediumPass3 !== null);
  if (validMediumPass3Results.length > 0) {
    baseResult.mediumPass3 = validMediumPass3Results.reduce((sum, r) => sum + r.mediumPass3!, 0) / validMediumPass3Results.length;
  }
  
  const validMediumPass5Results = modelResults.filter(r => r.mediumPass5 !== null);
  if (validMediumPass5Results.length > 0) {
    baseResult.mediumPass5 = validMediumPass5Results.reduce((sum, r) => sum + r.mediumPass5!, 0) / validMediumPass5Results.length;
  }
  
  // Hard difficulty
  const validHardPass1Results = modelResults.filter(r => r.hardPass1 !== null);
  if (validHardPass1Results.length > 0) {
    baseResult.hardPass1 = validHardPass1Results.reduce((sum, r) => sum + r.hardPass1!, 0) / validHardPass1Results.length;
  }
  
  const validHardPass3Results = modelResults.filter(r => r.hardPass3 !== null);
  if (validHardPass3Results.length > 0) {
    baseResult.hardPass3 = validHardPass3Results.reduce((sum, r) => sum + r.hardPass3!, 0) / validHardPass3Results.length;
  }
  
  const validHardPass5Results = modelResults.filter(r => r.hardPass5 !== null);
  if (validHardPass5Results.length > 0) {
    baseResult.hardPass5 = validHardPass5Results.reduce((sum, r) => sum + r.hardPass5!, 0) / validHardPass5Results.length;
  }
  
  return baseResult;
} 