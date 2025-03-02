import { ProcessedResult, FilterOptions } from '../types';
import { processCodeGeneration, aggregateCodeGenerationResults } from './codeGeneration';
import { processCodeTranslation, aggregateCodeTranslationResults } from './codeTranslation';
import { processCodeSummarization, aggregateCodeSummarizationResults } from './codeSummarization';
import { processCodeExecution, aggregateCodeExecutionResults } from './codeExecution';

export function processOverall(results: ProcessedResult[], filters: FilterOptions): ProcessedResult[] {
  console.log('Processing overall task:', {
    totalResults: results.length,
    filters: filters
  });

  // 首先进行语言过滤
  let filteredResults = results;
  if (filters.langs?.length > 0) {
    filteredResults = results.filter(result => {
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

  console.log('After language filtering:', {
    totalFilteredResults: filteredResults.length
  });

  // 按模型名称分组
  const groupedResults = new Map<string, ProcessedResult[]>();
  
  // 直接对过滤后的结果按模型分组
  filteredResults.forEach(result => {
    const key = result.modelName;
    if (!groupedResults.has(key)) {
      groupedResults.set(key, []);
    }
    groupedResults.get(key)!.push(result);
  });

  // 计算每个模型的总体平均值
  return Array.from(groupedResults.entries()).map(([modelName, modelResults]) => {
    const baseResult = modelResults[0];
    const metrics = {
      pass1: modelResults.filter(r => r.pass1 != null).map(r => r.pass1!),
      pass3: modelResults.filter(r => r.pass3 != null).map(r => r.pass3!),
      pass5: modelResults.filter(r => r.pass5 != null).map(r => r.pass5!),
      codebleu: modelResults.filter(r => r.codebleu != null).map(r => r.codebleu!),
      llmjudge: modelResults.filter(r => r.llmjudge != null).map(r => r.llmjudge!),
      executionAccuracy: modelResults.filter(r => r.executionAccuracy != null).map(r => r.executionAccuracy!),
    };

    // 计算平均值
    return {
      ...baseResult,
      task: 'overall',
      pass1: metrics.pass1.length > 0 ? metrics.pass1.reduce((a, b) => a + b) / metrics.pass1.length : null,
      pass3: metrics.pass3.length > 0 ? metrics.pass3.reduce((a, b) => a + b) / metrics.pass3.length : null,
      pass5: metrics.pass5.length > 0 ? metrics.pass5.reduce((a, b) => a + b) / metrics.pass5.length : null,
      codebleu: metrics.codebleu.length > 0 ? metrics.codebleu.reduce((a, b) => a + b) / metrics.codebleu.length : null,
      llmjudge: metrics.llmjudge.length > 0 ? metrics.llmjudge.reduce((a, b) => a + b) / metrics.llmjudge.length : null,
      executionAccuracy: metrics.executionAccuracy.length > 0 ? metrics.executionAccuracy.reduce((a, b) => a + b) / metrics.executionAccuracy.length : null,
    };
  });
} 