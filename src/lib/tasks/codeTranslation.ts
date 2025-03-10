import { ProcessedResult, FilterOptions } from '../types';

export function processCodeTranslation(results: ProcessedResult[], filters: FilterOptions): ProcessedResult[] {
  // 移除大部分日志，只保留最基本的信息
  console.log(`Processing ${results.length} code translation results`);

  // 如果没有code translation任务的数据，直接返回空数组
  if (!results.some(r => r.task === 'code translation')) {
    return [];
  }

  const filteredResults = results.filter((result) => {
    // 1. 检查任务类型
    if (result.task !== 'code translation') {
      return false;
    }

    // 2. 检查数据集 - 修改为不区分大小写的比较
    if (filters.datasets?.length > 0) {
      const datasetLower = result.dataset.toLowerCase();
      const allowedDatasets = filters.datasets.map(d => d.toLowerCase());
      
      if (!allowedDatasets.includes(datasetLower)) {
        return false;
      }
    }

    // 3. 检查语言 - 只检查目标语言
    if (filters.langs?.length > 0) {
      const targetLang = (result.targetLang || '').toLowerCase();
      const allowedLangs = filters.langs.map(lang => lang.toLowerCase());

      // 检查目标语言是否匹配选定的语言
      const isLanguageMatched = allowedLangs.some(lang => {
        const normalizedLang = lang.replace(/[^a-z]/g, ''); // 移除非字母字符
        const normalizedTarget = targetLang.replace(/[^a-z]/g, '');
        return normalizedTarget === normalizedLang;
      });

      if (!isLanguageMatched) {
        return false;
      }
    }

    return true;
  });

  console.log(`Filtered to ${filteredResults.length} code translation results`);

  return filteredResults;
}

export function aggregateCodeTranslationResults(results: ProcessedResult[]): ProcessedResult[] {
  // 检查输入结果是否为空
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
  const aggregatedResults = Array.from(groupedResults.entries()).map(([modelName, modelResults]) => {
    const validResults = {
      pass1: modelResults.filter(r => r.pass1 !== null),
      pass3: modelResults.filter(r => r.pass3 !== null),
      pass5: modelResults.filter(r => r.pass5 !== null),
      codebleu: modelResults.filter(r => r.codebleu !== null),
    };
    
    const avgResult = { ...modelResults[0] };
    
    // 计算平均值
    avgResult.pass1 = validResults.pass1.length > 0
      ? validResults.pass1.reduce((sum, r) => sum + r.pass1!, 0) / validResults.pass1.length
      : null;
    
    avgResult.pass3 = validResults.pass3.length > 0
      ? validResults.pass3.reduce((sum, r) => sum + r.pass3!, 0) / validResults.pass3.length
      : null;
    
    avgResult.pass5 = validResults.pass5.length > 0
      ? validResults.pass5.reduce((sum, r) => sum + r.pass5!, 0) / validResults.pass5.length
      : null;
    
    avgResult.codebleu = validResults.codebleu.length > 0
      ? validResults.codebleu.reduce((sum, r) => sum + r.codebleu!, 0) / validResults.codebleu.length
      : null;
    
    // 使用目标语言作为语言显示
    avgResult.lang = avgResult.targetLang || '';
    
    return avgResult;
  });

  return aggregatedResults;
} 