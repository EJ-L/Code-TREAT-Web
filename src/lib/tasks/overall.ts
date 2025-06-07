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

  // For overall view, we want to use all data without filtering
  console.log('For overall view, using all data without applying filters');
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
    



  // 处理各种任务类型的数据
  // 1. 处理代码生成任务
  try {
    console.log('Processing code generation task for overall view (no filters)');
    // Use empty filters to get all results
    const emptyFilters = { ...filters, datasets: [], langs: [], modalities: [], knowledge: [], reasoning: [], robustness: [], security: [] };
    const codeGenResults = processCodeGeneration(processedRawData, emptyFilters);
    const aggregatedCodeGenResults = aggregateCodeGenerationResults(codeGenResults);
    allTasksResults.push(...aggregatedCodeGenResults);
  } catch (error) {
    console.error('Error processing code generation task:', error);
  }

  // 2. 处理代码翻译任务
  try {
    console.log('Processing code translation task for overall view (no filters)');
    // Use empty filters to get all results
    const emptyFilters = { ...filters, datasets: [], langs: [], modalities: [], knowledge: [], reasoning: [], robustness: [], security: [] };
    const codeTransResults = processCodeTranslation(processedRawData, emptyFilters);
    const aggregatedCodeTransResults = aggregateCodeTranslationResults(codeTransResults);
    allTasksResults.push(...aggregatedCodeTransResults);
  } catch (error) {
    console.error('Error processing code translation task:', error);
  }

  // 3. 处理代码摘要任务
  try {
    console.log('Processing code summarization task for overall view (no filters)');
    // Use empty filters to get all results
    const emptyFilters = { ...filters, datasets: [], langs: [], modalities: [], knowledge: [], reasoning: [], robustness: [], security: [] };
    const codeSumResults = processCodeSummarization(rawData, emptyFilters);
    const aggregatedCodeSumResults = aggregateCodeSummarizationResults(codeSumResults);
    allTasksResults.push(...aggregatedCodeSumResults);
  } catch (error) {
    console.error('Error processing code summarization task:', error);
  }

  // 4. 处理代码执行任务
  try {
    console.log('Processing code execution task for overall view (no filters)');
    // Use empty filters to get all results
    const emptyFilters = { ...filters, datasets: [], langs: [], modalities: [], knowledge: [], reasoning: [], robustness: [], security: [] };
    const codeExecResults = processCodeExecution(processedRawData, emptyFilters);
    const aggregatedCodeExecResults = aggregateCodeExecutionResults(codeExecResults);
    allTasksResults.push(...aggregatedCodeExecResults);
  } catch (error) {
    console.error('Error processing code execution task:', error);
  }

  // 5. 处理漏洞检测任务
  try {
    console.log('Processing vulnerability detection task for overall view (no filters)');
    // Use empty filters to get all results
    const emptyFilters = { ...filters, datasets: [], langs: [], modalities: [], knowledge: [], reasoning: [], robustness: [], security: [] };
    // 不要依赖于rawData中的漏洞检测数据，直接从JSON文件加载
    // 强行使用一个空数组，这样函数内部会直接从JSON文件加载数据
    const vulDetectResults = processVulnerabilityDetection([], emptyFilters);
    console.log('漏洞检测任务处理完成:', {
      totalResults: vulDetectResults.length,
      modelNames: [...new Set(vulDetectResults.map(r => r.modelName))],
      datasets: [...new Set(vulDetectResults.map(r => r.dataset))],
      sampleResult: vulDetectResults[0]
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
    const baseResult = { ...modelResults[0] };
    baseResult.task = 'overall';
    
    // Group results by difficulty level
    const easyResults = modelResults.filter(r => r.difficulty?.toLowerCase() === 'easy');
    const mediumResults = modelResults.filter(r => r.difficulty?.toLowerCase() === 'medium');
    const hardResults = modelResults.filter(r => r.difficulty?.toLowerCase() === 'hard');
    
    // 检查漏洞检测数据
    const vulnResults = modelResults.filter(r => r.task === 'vulnerability detection');
    console.log(`模型 ${modelName} 的漏洞检测结果:`, {
      numVulnResults: vulnResults.length,
      hasVulnResults: vulnResults.length > 0,
      vulnDatasets: vulnResults.map(r => r.dataset).join(', '),
      sampleVulnResult: vulnResults[0]
    });
    
    // Calculate standard metrics across all results
    const metrics = {
      pass1: modelResults.filter(r => r.pass1 != null).map(r => r.pass1!),
      pass3: modelResults.filter(r => r.pass3 != null).map(r => r.pass3!),
      pass5: modelResults.filter(r => r.pass5 != null).map(r => r.pass5!),
      codebleu: modelResults.filter(r => r.codebleu != null).map(r => r.codebleu!),
      llmjudge: modelResults.filter(r => r.llmjudge != null).map(r => r.llmjudge!),
      executionAccuracy: modelResults.filter(r => r.executionAccuracy != null).map(r => r.executionAccuracy!),
      // 漏洞检测指标 - 不受数据集过滤影响
      accuracy: modelResults.filter(r => r['Accuracy'] != null).map(r => r['Accuracy']!),
      precision: modelResults.filter(r => r['Precision'] != null).map(r => r['Precision']!),
      recall: modelResults.filter(r => r['Recall'] != null).map(r => r['Recall']!),
      f1Score: modelResults.filter(r => r['F1 Score'] != null).map(r => r['F1 Score']!),
      pC: modelResults.filter(r => r['P-C'] != null).map(r => r['P-C']!),
      pV: modelResults.filter(r => r['P-V'] != null).map(r => r['P-V']!),
      pB: modelResults.filter(r => r['P-B'] != null).map(r => r['P-B']!),
      pR: modelResults.filter(r => r['P-R'] != null).map(r => r['P-R']!),
    };
    
    // Calculate difficulty-specific metrics
    const difficultyScopedMetrics = {
      easyPass1: easyResults.filter(r => r.pass1 != null).map(r => r.pass1!),
      easyPass3: easyResults.filter(r => r.pass3 != null).map(r => r.pass3!),
      easyPass5: easyResults.filter(r => r.pass5 != null).map(r => r.pass5!),
      mediumPass1: mediumResults.filter(r => r.pass1 != null).map(r => r.pass1!),
      mediumPass3: mediumResults.filter(r => r.pass3 != null).map(r => r.pass3!),
      mediumPass5: mediumResults.filter(r => r.pass5 != null).map(r => r.pass5!),
      hardPass1: hardResults.filter(r => r.pass1 != null).map(r => r.pass1!),
      hardPass3: hardResults.filter(r => r.pass3 != null).map(r => r.pass3!),
      hardPass5: hardResults.filter(r => r.pass5 != null).map(r => r.pass5!),
    };
    
    // Calculate averages for standard metrics
    const aggregatedResult = {
      ...baseResult,
      task: 'overall',
      pass1: metrics.pass1.length > 0 ? metrics.pass1.reduce((a, b) => a + b) / metrics.pass1.length : null,
      pass3: metrics.pass3.length > 0 ? metrics.pass3.reduce((a, b) => a + b) / metrics.pass3.length : null,
      pass5: metrics.pass5.length > 0 ? metrics.pass5.reduce((a, b) => a + b) / metrics.pass5.length : null,
      codebleu: metrics.codebleu.length > 0 ? metrics.codebleu.reduce((a, b) => a + b) / metrics.codebleu.length : null,
      llmjudge: metrics.llmjudge.length > 0 ? metrics.llmjudge.reduce((a, b) => a + b) / metrics.llmjudge.length : null,
      executionAccuracy: metrics.executionAccuracy.length > 0 ? metrics.executionAccuracy.reduce((a, b) => a + b) / metrics.executionAccuracy.length : null,
      // 漏洞检测指标
      'Accuracy': metrics.accuracy.length > 0 ? metrics.accuracy.reduce((a, b) => a + b) / metrics.accuracy.length : null,
      'Precision': metrics.precision.length > 0 ? metrics.precision.reduce((a, b) => a + b) / metrics.precision.length : null,
      'Recall': metrics.recall.length > 0 ? metrics.recall.reduce((a, b) => a + b) / metrics.recall.length : null,
      'F1 Score': metrics.f1Score.length > 0 ? metrics.f1Score.reduce((a, b) => a + b) / metrics.f1Score.length : null,
      'P-C': metrics.pC.length > 0 ? metrics.pC.reduce((a, b) => a + b) / metrics.pC.length : null,
      'P-V': metrics.pV.length > 0 ? metrics.pV.reduce((a, b) => a + b) / metrics.pV.length : null,
      'P-B': metrics.pB.length > 0 ? metrics.pB.reduce((a, b) => a + b) / metrics.pB.length : null,
      'P-R': metrics.pR.length > 0 ? metrics.pR.reduce((a, b) => a + b) / metrics.pR.length : null,
    };
    
    // Add difficulty-specific metrics to the result
    return {
      ...aggregatedResult,
      // Easy metrics
      easyPass1: difficultyScopedMetrics.easyPass1.length > 0 
        ? difficultyScopedMetrics.easyPass1.reduce((a, b) => a + b) / difficultyScopedMetrics.easyPass1.length 
        : null,
      easyPass3: difficultyScopedMetrics.easyPass3.length > 0 
        ? difficultyScopedMetrics.easyPass3.reduce((a, b) => a + b) / difficultyScopedMetrics.easyPass3.length 
        : null,
      easyPass5: difficultyScopedMetrics.easyPass5.length > 0 
        ? difficultyScopedMetrics.easyPass5.reduce((a, b) => a + b) / difficultyScopedMetrics.easyPass5.length 
        : null,
      // Medium metrics
      mediumPass1: difficultyScopedMetrics.mediumPass1.length > 0 
        ? difficultyScopedMetrics.mediumPass1.reduce((a, b) => a + b) / difficultyScopedMetrics.mediumPass1.length 
        : null,
      mediumPass3: difficultyScopedMetrics.mediumPass3.length > 0 
        ? difficultyScopedMetrics.mediumPass3.reduce((a, b) => a + b) / difficultyScopedMetrics.mediumPass3.length 
        : null,
      mediumPass5: difficultyScopedMetrics.mediumPass5.length > 0 
        ? difficultyScopedMetrics.mediumPass5.reduce((a, b) => a + b) / difficultyScopedMetrics.mediumPass5.length 
        : null,
      // Hard metrics
      hardPass1: difficultyScopedMetrics.hardPass1.length > 0 
        ? difficultyScopedMetrics.hardPass1.reduce((a, b) => a + b) / difficultyScopedMetrics.hardPass1.length 
        : null,
      hardPass3: difficultyScopedMetrics.hardPass3.length > 0 
        ? difficultyScopedMetrics.hardPass3.reduce((a, b) => a + b) / difficultyScopedMetrics.hardPass3.length 
        : null,
      hardPass5: difficultyScopedMetrics.hardPass5.length > 0 
        ? difficultyScopedMetrics.hardPass5.reduce((a, b) => a + b) / difficultyScopedMetrics.hardPass5.length 
        : null,
    };

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