import { ProcessedResult, FilterOptions } from '../types';

export function processCodeGeneration(results: ProcessedResult[], filters: FilterOptions): ProcessedResult[] {
  console.log('开始处理代码生成任务:', {
    totalResults: results.length,
    availableDatasets: [...new Set(results.map(r => r.dataset))]
  });

  const filteredResults = results.filter((result) => {
    // 1. 检查任务类型
    if (result.task !== 'code generation') return false;
    
    // 2. 检查数据集
    if (filters.datasets?.length > 0) {
      const resultDataset = result.dataset.toLowerCase().trim();
      const allowedDatasets = new Set(filters.datasets.map(d => d.toLowerCase().trim()));
      if (!allowedDatasets.has(resultDataset)) return false;
    }
    
    // 3. 检查语言
    if (filters.langs?.length > 0) {
      const resultLang = result.lang?.toLowerCase();
      const allowedLangs = new Set(filters.langs.map(l => l.toLowerCase()));
      if (!resultLang || !allowedLangs.has(resultLang)) return false;
    }
    
    return true;
  });

  console.log('代码生成任务处理完成:', {
    totalFilteredResults: filteredResults.length,
    remainingDatasets: [...new Set(filteredResults.map(r => r.dataset))]
  });

  return filteredResults;
}

export function aggregateCodeGenerationResults(results: ProcessedResult[]): ProcessedResult[] {
  if (results.length === 0) return [];

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
    const baseResult = { ...modelResults[0] };
    
    // 计算平均值
    const metrics = ['pass1', 'pass3', 'pass5'] as const;
    metrics.forEach(metric => {
      const validResults = modelResults.filter(r => r[metric] !== null);
      if (validResults.length > 0) {
        baseResult[metric] = validResults.reduce((sum, r) => sum + r[metric]!, 0) / validResults.length;
      }
    });
    
    return baseResult;
  });

  console.log('聚合完成:', {
    totalResults: aggregatedResults.length
  });

  return aggregatedResults;
} 