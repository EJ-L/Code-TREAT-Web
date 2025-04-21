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
    
    // 4. 检查模态
    if (filters.modalities?.length > 0) {
      // 预处理modalities数组
      const modalityPatterns = filters.modalities
        .filter(modality => modality)
        .map(modality => modality.toLowerCase());
      
      if (modalityPatterns.length > 0) {
        // 检查结果是否满足任意一个选定的模态
        const stringsToCheck: string[] = [];
        if (result.modelName) stringsToCheck.push(result.modelName.toLowerCase());
        if (result.dataset) stringsToCheck.push(result.dataset.toLowerCase());
        if (result.task) stringsToCheck.push(result.task.toLowerCase());
        if (result.lang) stringsToCheck.push(result.lang.toLowerCase());
        
        const hasMatchingModality = modalityPatterns.some(pattern => 
          stringsToCheck.some(str => str.includes(pattern))
        );
        
        if (!hasMatchingModality) return false;
      }
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
    
    // Group results by difficulty level
    const easyResults = modelResults.filter(r => r.difficulty?.toLowerCase() === 'easy');
    const mediumResults = modelResults.filter(r => r.difficulty?.toLowerCase() === 'medium');
    const hardResults = modelResults.filter(r => r.difficulty?.toLowerCase() === 'hard');
    
    // 计算标准指标的平均值
    const metrics = ['pass1', 'pass3', 'pass5'] as const;
    metrics.forEach(metric => {
      const validResults = modelResults.filter(r => r[metric] !== null);
      if (validResults.length > 0) {
        baseResult[metric] = validResults.reduce((sum, r) => sum + r[metric]!, 0) / validResults.length;
      }
    });

    // 计算难度特定指标
    // Easy
    if (easyResults.length > 0) {
      const easyPass1Results = easyResults.filter(r => r.pass1 !== null);
      if (easyPass1Results.length > 0) {
        baseResult.easyPass1 = easyPass1Results.reduce((sum, r) => sum + r.pass1!, 0) / easyPass1Results.length;
      }
      
      const easyPass3Results = easyResults.filter(r => r.pass3 !== null);
      if (easyPass3Results.length > 0) {
        baseResult.easyPass3 = easyPass3Results.reduce((sum, r) => sum + r.pass3!, 0) / easyPass3Results.length;
      }
      
      const easyPass5Results = easyResults.filter(r => r.pass5 !== null);
      if (easyPass5Results.length > 0) {
        baseResult.easyPass5 = easyPass5Results.reduce((sum, r) => sum + r.pass5!, 0) / easyPass5Results.length;
      }
    }
    
    // Medium
    if (mediumResults.length > 0) {
      const mediumPass1Results = mediumResults.filter(r => r.pass1 !== null);
      if (mediumPass1Results.length > 0) {
        baseResult.mediumPass1 = mediumPass1Results.reduce((sum, r) => sum + r.pass1!, 0) / mediumPass1Results.length;
      }
      
      const mediumPass3Results = mediumResults.filter(r => r.pass3 !== null);
      if (mediumPass3Results.length > 0) {
        baseResult.mediumPass3 = mediumPass3Results.reduce((sum, r) => sum + r.pass3!, 0) / mediumPass3Results.length;
      }
      
      const mediumPass5Results = mediumResults.filter(r => r.pass5 !== null);
      if (mediumPass5Results.length > 0) {
        baseResult.mediumPass5 = mediumPass5Results.reduce((sum, r) => sum + r.pass5!, 0) / mediumPass5Results.length;
      }
    }
    
    // Hard
    if (hardResults.length > 0) {
      const hardPass1Results = hardResults.filter(r => r.pass1 !== null);
      if (hardPass1Results.length > 0) {
        baseResult.hardPass1 = hardPass1Results.reduce((sum, r) => sum + r.pass1!, 0) / hardPass1Results.length;
      }
      
      const hardPass3Results = hardResults.filter(r => r.pass3 !== null);
      if (hardPass3Results.length > 0) {
        baseResult.hardPass3 = hardPass3Results.reduce((sum, r) => sum + r.pass3!, 0) / hardPass3Results.length;
      }
      
      const hardPass5Results = hardResults.filter(r => r.pass5 !== null);
      if (hardPass5Results.length > 0) {
        baseResult.hardPass5 = hardPass5Results.reduce((sum, r) => sum + r.pass5!, 0) / hardPass5Results.length;
      }
    }
    
    return baseResult;
  });

  console.log('聚合完成:', {
    totalResults: aggregatedResults.length
  });

  return aggregatedResults;
} 