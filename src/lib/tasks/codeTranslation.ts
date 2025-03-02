import { ProcessedResult, FilterOptions } from '../types';

export function processCodeTranslation(results: ProcessedResult[], filters: FilterOptions): ProcessedResult[] {
  console.log('Processing code translation task:', {
    totalResults: results.length,
    filters: filters
  });

  const filteredResults = results.filter((result) => {
    // 1. 检查任务类型
    if (result.task !== 'code translation') {
      return false;
    }

    // 2. 检查数据集
    if (filters.datasets?.length > 0 && !filters.datasets.includes(result.dataset)) {
      return false;
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
        console.log('Translation result filtered out:', {
          modelName: result.modelName,
          targetLang,
          allowedLangs,
          matched: false
        });
        return false;
      }

      console.log('Translation result matched:', {
        modelName: result.modelName,
        targetLang,
        allowedLangs,
        matched: true
      });
    }

    return true;
  });

  console.log('After translation filtering:', {
    totalFilteredResults: filteredResults.length,
    sampleResult: filteredResults[0]
  });

  return filteredResults;
}

export function aggregateCodeTranslationResults(results: ProcessedResult[]): ProcessedResult[] {
  const groupedResults = new Map<string, ProcessedResult[]>();
  
  // 添加调试日志：打印所有结果
  console.log('All translation results before grouping:', results.map(r => ({
    modelName: r.modelName,
    task: r.task,
    dataset: r.dataset,
    targetLang: r.targetLang,
    metrics: {
      pass1: r.pass1,
      pass3: r.pass3,
      pass5: r.pass5,
      codebleu: r.codebleu
    }
  })));

  // 特别检查deepseek相关的数据
  const deepseekResults = results.filter(r => r.modelName.toLowerCase().includes('deepseek'));
  if (deepseekResults.length > 0) {
    console.log('Found Deepseek results:', deepseekResults.map(r => ({
      modelName: r.modelName,
      task: r.task,
      dataset: r.dataset,
      targetLang: r.targetLang,
      metrics: {
        pass1: r.pass1,
        pass3: r.pass3,
        pass5: r.pass5,
        codebleu: r.codebleu
      }
    })));
  } else {
    console.log('No Deepseek results found in translation task');
  }
  
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
    console.log(`Aggregating results for model ${modelName}:`, {
      totalResults: modelResults.length,
      languages: modelResults.map(r => r.targetLang)
    });

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
    
    console.log(`Aggregated metrics for model ${modelName}:`, {
      metrics: {
        pass1: avgResult.pass1,
        pass3: avgResult.pass3,
        pass5: avgResult.pass5,
        codebleu: avgResult.codebleu
      },
      language: avgResult.lang
    });
    
    return avgResult;
  });

  return aggregatedResults;
} 