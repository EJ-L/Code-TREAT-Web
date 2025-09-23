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
    
    // Filter out Code Summarization Human Baseline from overall results
    const filteredCodeSumResults = aggregatedCodeSumResults.filter(result => 
      result.modelName !== 'Code Summarization Human Baseline'
    );
    console.log('Filtered out Code Summarization Human Baseline from overall results:', {
      originalCount: aggregatedCodeSumResults.length,
      filteredCount: filteredCodeSumResults.length
    });
    
    allTasksResults.push(...filteredCodeSumResults);
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
    const vulDetectResults = await processVulnerabilityDetection([], emptyFilters);
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

  // Group by model name (using original model names - no canonicalization)
  const groupedResults = new Map<string, ProcessedResult[]>();
  allTasksResults.forEach(result => {
    const key = result.modelName || result.model;
    if (!groupedResults.has(key)) {
      groupedResults.set(key, []);
    }
    groupedResults.get(key)!.push(result);
  });

  // Calculate aggregated metrics for each model with difficulty-based grouping
  const finalResults = Array.from(groupedResults.entries()).map(([modelName, modelResults]) => {
    const baseResult = { ...modelResults[0] };
    baseResult.task = 'overall';
    baseResult.modelName = modelName; // Use the original model name
    
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
  });

  return finalResults;
} 