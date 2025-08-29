import { ProcessedResult, FilterOptions } from '../types';

export function processCodeExecution(results: ProcessedResult[], filters: FilterOptions): ProcessedResult[] {
  console.log(`Processing ${results.length} code execution results`);

  const filteredResults = results.filter((result) => {
    // 1. 检查任务类型 - 确保是 code execution
    if (result.task !== 'code execution') {
      return false;
    }

    // 2. 检查数据集 - 不区分大小写
    if (filters.datasets?.length > 0) {
      const datasetLower = result.dataset.toLowerCase();
      const allowedDatasets = filters.datasets.map(d => d.toLowerCase());
      
      if (!allowedDatasets.includes(datasetLower)) {
        return false;
      }
    }

    // 3. 检查语言
    if (filters.langs?.length > 0) {
      const lang = (result.lang || '').toLowerCase();
      const allowedLangs = filters.langs.map(l => l.toLowerCase());

      // 检查语言是否匹配选定的语言
      const isLanguageMatched = allowedLangs.some(l => {
        const normalizedLang = l.replace(/[^a-z]/g, ''); // 移除非字母字符
        const normalizedResultLang = lang.replace(/[^a-z]/g, '');
        return normalizedResultLang === normalizedLang;
      });

      if (!isLanguageMatched) {
        return false;
      }
    }

    return true;
  });

  console.log(`Filtered to ${filteredResults.length} code execution results`);

  return filteredResults;
}

export function aggregateCodeExecutionResults(results: ProcessedResult[]): ProcessedResult[] {
  if (!results || results.length === 0) {
    return [];
  }
  
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
  const aggregatedResults = Array.from(groupedResults.entries()).map(([_, modelResults]) => {
    const validResults = {
      executionAccuracy: modelResults.filter(r => r.executionAccuracy !== null),
      pass1: modelResults.filter(r => r.pass1 !== null),
    };
    
    const avgResult = { ...modelResults[0] };
    
    // 计算平均值
    avgResult.executionAccuracy = validResults.executionAccuracy.length > 0
      ? validResults.executionAccuracy.reduce((sum, r) => sum + r.executionAccuracy!, 0) / validResults.executionAccuracy.length
      : null;
    
    avgResult.pass1 = validResults.pass1.length > 0
      ? validResults.pass1.reduce((sum, r) => sum + r.pass1!, 0) / validResults.pass1.length
      : null;
    
    return avgResult;
  });

  return aggregatedResults;
} 