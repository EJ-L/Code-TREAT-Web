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

    // 4. 检查知识领域
    if (filters.knowledge?.length > 0) {
      const hasMatchingKnowledge = filters.knowledge.some(knowledgeFilter => {
        const filterLower = knowledgeFilter.toLowerCase();
        
        // Check domain field directly for abbreviations
        if (result.domain) {
          const domainLower = result.domain.toLowerCase();
          
          // Direct match for abbreviations
          if (filterLower === 'algorithms' && domainLower === 'alg') return true;
          if (filterLower === 'data structures' && domainLower === 'ds') return true;
          if (filterLower === 'math' && domainLower === 'math') return true;
          
          // Direct domain field match
          if (domainLower.includes(filterLower)) return true;
          if (domainLower.includes(filterLower.replace(' ', ''))) return true;
        }
        
        // Check other fields for broader matches
        const stringsToCheck: string[] = [];
        if (result.modelName) stringsToCheck.push(result.modelName.toLowerCase());
        if (result.dataset) stringsToCheck.push(result.dataset.toLowerCase());
        if (result.task) stringsToCheck.push(result.task.toLowerCase());
        
        return stringsToCheck.some(str => str.includes(filterLower));
      });
      
      if (!hasMatchingKnowledge) return false;
    }

    return true;
  });

  // If we're showing by difficulty, populate the difficulty-specific metrics
  if (filters.showByDifficulty) {
    filteredResults.forEach(result => {
      if (result.difficulty === 'Easy' && result.pass1 !== null) {
        result.easyPass1 = result.pass1;
        result.easyPass3 = result.pass3;
        result.easyPass5 = result.pass5;
      } else if (result.difficulty === 'Medium' && result.pass1 !== null) {
        result.mediumPass1 = result.pass1;
        result.mediumPass3 = result.pass3;
        result.mediumPass5 = result.pass5;
      } else if (result.difficulty === 'Hard' && result.pass1 !== null) {
        result.hardPass1 = result.pass1;
        result.hardPass3 = result.pass3;
        result.hardPass5 = result.pass5;
      }
    });
  }

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
      // Difficulty-specific metrics
      easyPass1: modelResults.filter(r => r.easyPass1 !== null),
      easyPass3: modelResults.filter(r => r.easyPass3 !== null),
      easyPass5: modelResults.filter(r => r.easyPass5 !== null),
      mediumPass1: modelResults.filter(r => r.mediumPass1 !== null),
      mediumPass3: modelResults.filter(r => r.mediumPass3 !== null),
      mediumPass5: modelResults.filter(r => r.mediumPass5 !== null),
      hardPass1: modelResults.filter(r => r.hardPass1 !== null),
      hardPass3: modelResults.filter(r => r.hardPass3 !== null),
      hardPass5: modelResults.filter(r => r.hardPass5 !== null),
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
    
    // Calculate difficulty-specific metrics
    // Easy difficulty
    avgResult.easyPass1 = validResults.easyPass1.length > 0
      ? validResults.easyPass1.reduce((sum, r) => sum + r.easyPass1!, 0) / validResults.easyPass1.length
      : null;
    
    avgResult.easyPass3 = validResults.easyPass3.length > 0
      ? validResults.easyPass3.reduce((sum, r) => sum + r.easyPass3!, 0) / validResults.easyPass3.length
      : null;
    
    avgResult.easyPass5 = validResults.easyPass5.length > 0
      ? validResults.easyPass5.reduce((sum, r) => sum + r.easyPass5!, 0) / validResults.easyPass5.length
      : null;
    
    // Medium difficulty
    avgResult.mediumPass1 = validResults.mediumPass1.length > 0
      ? validResults.mediumPass1.reduce((sum, r) => sum + r.mediumPass1!, 0) / validResults.mediumPass1.length
      : null;
    
    avgResult.mediumPass3 = validResults.mediumPass3.length > 0
      ? validResults.mediumPass3.reduce((sum, r) => sum + r.mediumPass3!, 0) / validResults.mediumPass3.length
      : null;
    
    avgResult.mediumPass5 = validResults.mediumPass5.length > 0
      ? validResults.mediumPass5.reduce((sum, r) => sum + r.mediumPass5!, 0) / validResults.mediumPass5.length
      : null;
    
    // Hard difficulty
    avgResult.hardPass1 = validResults.hardPass1.length > 0
      ? validResults.hardPass1.reduce((sum, r) => sum + r.hardPass1!, 0) / validResults.hardPass1.length
      : null;
    
    avgResult.hardPass3 = validResults.hardPass3.length > 0
      ? validResults.hardPass3.reduce((sum, r) => sum + r.hardPass3!, 0) / validResults.hardPass3.length
      : null;
    
    avgResult.hardPass5 = validResults.hardPass5.length > 0
      ? validResults.hardPass5.reduce((sum, r) => sum + r.hardPass5!, 0) / validResults.hardPass5.length
      : null;
    
    // 使用目标语言作为语言显示
    avgResult.lang = avgResult.targetLang || '';
    
    console.log(`Aggregated metrics for model ${modelName}:`, {
      metrics: {
        pass1: avgResult.pass1,
        pass3: avgResult.pass3,
        pass5: avgResult.pass5,
        codebleu: avgResult.codebleu,
        // Log difficulty metrics if any exist
        ...(avgResult.easyPass1 !== null && { easyPass1: avgResult.easyPass1 }),
        ...(avgResult.mediumPass1 !== null && { mediumPass1: avgResult.mediumPass1 }),
        ...(avgResult.hardPass1 !== null && { hardPass1: avgResult.hardPass1 })
      },
      language: avgResult.lang
    });
    
    return avgResult;
  });

  return aggregatedResults;
} 