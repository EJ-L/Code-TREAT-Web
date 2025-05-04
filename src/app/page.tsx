"use client";
// import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { SunIcon, MoonIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { processResults, formatResults } from '@/lib/resultProcessor';
import { FilterOptions, TaskType, Ability } from '@/lib/types';
import { getAvailableLLMJudges as getSummarizationJudges } from '@/lib/tasks/codeSummarization';
import { getAvailableLLMJudges as getReviewJudges } from '@/lib/tasks/codeReview';
import { loadAllData } from '@/lib/dataLoader';

// 临时模拟数据
const mockData = [
  {
    rank: 1,
    model: "GPT-4",
    pass_at_1: 0.85,
    pass_at_3: 0.92,
    pass_at_5: 0.95,
    ability: "Python, Algorithms",
    task: "Code Generation"
  },
  // ... 可以添加更多测试数据
];

// 定义每个任务类型对应的能力选项
const taskAbilities: Record<TaskType, Ability> = {
  'overall': {
    dataset: ['HackerRank', 'GeeksForGeeks', 'PolyHumanEval', 'CodeTransOcean', 'GitHub', 'PrimeVul', 'PrimeVulPairs'],
    modality: ['Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning', 'Inductive'],
    robustness: ['Code Structure', 'Code Convention'],
    privacy: ['Privacy', 'Vulnerability', 'Bias', 'Authorship'],
    llmJudges: [], // 将在运行时填充
  },
  'code generation': {
    dataset: ['HackerRank', 'GeeksForGeeks'],
    modality: ['Python', 'Java'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning'],
    robustness: [],
    privacy: [],
  },
  'code translation': {
    modality: ['Python', 'Java'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['HackerRank', 'PolyHumanEval', 'CodeTransOcean'],
    robustness: [],
    privacy: [],
  },
  'code summarization': {
    modality: ['Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go'],
    knowledge: ['Docstring'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['GitHub'],
    robustness: [],
    privacy: [],
    llmJudges: ['gpt-4o-2024-11-20'],
  },
  'code review': {
    modality: ['Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go'],
    knowledge: ['Code Review'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['GitHub'],
    robustness: [],
    privacy: [],
    llmJudges: ['gpt-4o-2024-11-20'],
  },
  'input prediction': {
    modality: ['Python', 'Java'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['HackerRank', 'GeeksForGeeks'],
    robustness: [],
    privacy: [],
  },
  'output prediction': {
    modality: ['Python', 'Java'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['HackerRank', 'GeeksForGeeks'],
    robustness: [],
    privacy: [],
  },
  'vulnerability detection': {
    modality: [],
    knowledge: [],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['PrimeVul', 'PrimeVulPairs'],
    robustness: [],
    privacy: [],
  },
};

// 在文件顶部添加动画样式
const glowAnimation = {
  initial: { opacity: 0.5 },
  animate: { opacity: 1 },
  transition: { duration: 2, repeat: Infinity, repeatType: "reverse" }
};

// 定义结果类型
type ResultItem = {
  rank: number;
  model: string;
  model_url?: string;
  'pass@1'?: string | number;
  'pass@3'?: string | number;
  'pass@5'?: string | number;
  // Difficulty-based metrics
  'easy_pass@1'?: string | number;
  'medium_pass@1'?: string | number;
  'hard_pass@1'?: string | number;
  'easy_pass@3'?: string | number;
  'medium_pass@3'?: string | number;
  'hard_pass@3'?: string | number;
  'easy_pass@5'?: string | number;
  'medium_pass@5'?: string | number;
  'hard_pass@5'?: string | number;
  // Other metrics
  CodeBLEU?: string | number;
  LLMJudge?: string | number;
  llmjudge?: string | number;
  Execution?: string | number;
  ability?: string;
  task?: string;
  [key: string]: string | number | undefined;
};

export default function Home() {
  console.log('Component initialization started');
  const [currentTask, setCurrentTask] = useState<TaskType>('overall');
  const [selectedAbilities, setSelectedAbilities] = useState<Partial<Ability>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'pass@1', direction: 'desc' });
  const [availableLLMJudges, setAvailableLLMJudges] = useState<string[]>([]);
  const [currentTaskPage, setCurrentTaskPage] = useState(0);
  const [showByDifficulty, setShowByDifficulty] = useState(false);
  const TASKS_PER_PAGE = 4;

  // Helper function to get tasks for current page
  const getCurrentPageTasks = () => {
    const allTasks = Object.keys(taskAbilities);
    const startIndex = currentTaskPage * TASKS_PER_PAGE;
    return allTasks.slice(startIndex, startIndex + TASKS_PER_PAGE);
  };

  // Helper function to check if there are more tasks
  const hasNextPage = () => {
    const allTasks = Object.keys(taskAbilities);
    return (currentTaskPage + 1) * TASKS_PER_PAGE < allTasks.length;
  };

  // Helper function to check if there are previous tasks
  const hasPreviousPage = () => {
    return currentTaskPage > 0;
  };

  // Navigation functions
  const handleNextPage = () => {
    if (hasNextPage()) {
      setCurrentTaskPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage()) {
      setCurrentTaskPage(prev => prev - 1);
    }
  };

  // 获取默认排序配置
  const getDefaultSortConfig = (task: TaskType) => {
    switch (task) {
      case 'code summarization':
      case 'code review':
        return { key: 'llmjudge', direction: 'desc' as const };
      case 'vulnerability detection':
        return { key: 'Accuracy', direction: 'desc' as const };
      default:
        return { key: 'pass@1', direction: 'desc' as const };
    }
  };

  // 处理任务切换
  const handleTaskChange = (task: TaskType) => {
    console.log(`任务切换到: ${task}`);
    setCurrentTask(task);
    setSelectedAbilities({});  // 重置所有过滤器
    
    // 注意：对于code review任务，我们暂时不应用任何过滤器
    if (task === 'code review') {
      // 不应用llmJudge过滤器，以便查看所有结果
      setSortConfig({ key: 'llmjudge', direction: 'desc' });
    } else {
      setSortConfig(getDefaultSortConfig(task));
    }
  };

  // 处理过滤器选择
  const handleAbilityChange = (key: keyof Ability, value: string) => {
    setSelectedAbilities((prev: Partial<Ability>) => {
      const newAbilities = {
        ...prev,
        [key]: prev[key]?.includes(value)
          ? prev[key]?.filter((v: string) => v !== value)
          : [...(prev[key] || []), value]
      };
      setSortConfig(getDefaultSortConfig(currentTask));
      return newAbilities;
    });
  };

  // 加载可用的 LLM Judges
  useEffect(() => {
    const loadLLMJudges = async () => {
      if (currentTask === 'code summarization' || currentTask === 'code review' || currentTask === 'overall') {
        try {
          const rawData = await loadAllData();
          
          // 根据任务类型选择适当的评委检测函数
          let judges: string[] = [];
          if (currentTask === 'code review') {
            judges = getReviewJudges(rawData);
          } else {
            judges = getSummarizationJudges(rawData);
          }
          
          setAvailableLLMJudges(judges);
          
          // 更新任务对应的可用评委
          if (judges.length > 0) {
            taskAbilities['code summarization'].llmJudges = judges;
            taskAbilities['code review'].llmJudges = judges;
            taskAbilities['overall'].llmJudges = judges;
          }
        } catch (error) {
          console.error('Error loading LLM Judges:', error);
        }
      }
    };
    
    loadLLMJudges();
  }, [currentTask]);

  // 排序函数
  const sortResults = (data: ResultItem[]) => {
    if (!sortConfig) return data;

    const sortableData = [...data];
    
    sortableData.sort((a, b) => {
      // Parsing function to convert metric values to numbers for comparison
      const parseValue = (value: string | number | undefined) => {
        if (value === undefined) return -Infinity;
        if (typeof value === 'number') return value;
        
        // Try to extract numeric value from percentage strings
        if (typeof value === 'string' && value.endsWith('%')) {
          const numValue = parseFloat(value.replace('%', ''));
          return isNaN(numValue) ? -Infinity : numValue;
        }
        
        // Try to convert string to number
        const numValue = parseFloat(value);
        return isNaN(numValue) ? -Infinity : numValue;
      };

      // Get values for comparison, handling all metrics including difficulty-based ones
      const aValue = parseValue(a[sortConfig.key]);
      const bValue = parseValue(b[sortConfig.key]);
      
      // Sort direction
      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    // Update ranks after sorting
    return sortableData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  };

  // 使用useMemo缓存排序结果
  const sortedResults = useMemo(() => {
    if (!results.length) return [];
    
    return sortResults(results);
  }, [results, sortConfig]);

  // 处理排序 - 添加防抖动机制
  const handleSort = useCallback((key: string) => {
    // If this column is already being sorted, reverse the direction
    if (sortConfig && sortConfig.key === key) {
      const newDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      setSortConfig({ key, direction: newDirection });
      return;
    }

    // Default sort direction for different columns
    let initialDirection: 'asc' | 'desc' = 'desc';
    
    // Metrics that sort high-to-low by default (desc)
    const highToLowMetrics = [
      'pass@1', 'pass@3', 'pass@5', 
      'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
      'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
      'easy_pass@5', 'medium_pass@5', 'hard_pass@5',
      'CodeBLEU', 'LLMJudge', 'llmjudge', 'Execution',
      // 漏洞检测指标
      'Accuracy', 'Precision', 'Recall', 'F1 Score',
      'P-C', 'P-V', 'P-B', 'P-R'
    ];
    
    // For rank, we sort low-to-high (asc)
    if (key === 'rank') {
      initialDirection = 'asc';
    } else if (highToLowMetrics.includes(key)) {
      initialDirection = 'desc'; // Higher values are better
    }

    setSortConfig({ key, direction: initialDirection });
  }, [sortConfig]);

  // 处理数据加载和过滤 - 添加优化逻辑
  useEffect(() => {
    let isMounted = true; // 防止组件卸载后的状态更新
    
    const loadAndProcessData = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      
      try {
        const filterOptions: FilterOptions = {
          tasks: [currentTask],
          datasets: selectedAbilities.dataset || [],
          langs: selectedAbilities.modality || [],
          modalities: selectedAbilities.modality || [],
          knowledge: selectedAbilities.knowledge || [],
          reasoning: selectedAbilities.reasoning || [],
          robustness: selectedAbilities.robustness || [],
          security: selectedAbilities.privacy || [],
          llmJudges: selectedAbilities.llmJudges || [],
          showByDifficulty: showByDifficulty
        };
        
        // 特殊处理code review任务 - 临时不应用任何过滤器，确保能看到所有数据
        if (currentTask === 'code review') {
          filterOptions.llmJudges = []; // 清空LLM Judge过滤器
          filterOptions.langs = []; // 清空语言过滤器
          filterOptions.datasets = []; // 清空数据集过滤器
        }
        
        // 使用setTimeout推迟处理，让UI有机会更新加载状态
        setTimeout(async () => {
          if (!isMounted) return;
          
          try {
            // 处理数据
            const processedResults = await processResults(currentTask, filterOptions);
            
            if (processedResults.length > 0 && isMounted) {
              // 格式化结果
              const formattedResults = formatResults(processedResults, filterOptions);
              
              if (formattedResults.length > 0 && isMounted) {
                setResults(formattedResults as ResultItem[]);
              } else {
                console.warn('格式化后没有结果');
                setResults([]);
              }
            } else {
              console.warn('处理后没有结果');
              setResults([]);
            }
          } catch (error) {
            console.error('数据处理错误:', error);
            setResults([]);
          } finally {
            if (isMounted) {
              setIsLoading(false);
            }
          }
        }, 100);
      } catch (error) {
        console.error('数据加载错误:', error);
        if (isMounted) {
          setResults([]);
          setIsLoading(false);
        }
      }
    };
    
    loadAndProcessData();
    
    // 组件卸载时设置isMounted为false
    return () => {
      isMounted = false;
    };
  }, [currentTask, selectedAbilities, showByDifficulty]);

  // 当排序配置改变时，单独处理排序，不重新加载数据
  useEffect(() => {
    if (results.length === 0) return;
    setIsLoading(true);
    
    // 使用requestAnimationFrame延迟排序操作，使UI能够响应
    requestAnimationFrame(() => {
      setIsLoading(false);
    });
  }, [sortConfig]);

  // 获取表格标题
  const getTableHeaders = (task: TaskType) => {
    // 任务特定的表头配置
    const tableHeaders = {
      'overall': [
        { key: 'pass@1', label: 'Pass@1', width: 'w-24' },
        { key: 'pass@3', label: 'Pass@3', width: 'w-24' },
        { key: 'pass@5', label: 'Pass@5', width: 'w-24' },
        { key: 'CodeBLEU', label: 'CodeBLEU', width: 'w-28' },
        { key: 'llmjudge', label: 'LLM Judge', width: 'w-28' },
        // 漏洞检测特定指标
        { key: 'Accuracy', label: 'Accuracy', width: 'w-24' },
        { key: 'Precision', label: 'Precision', width: 'w-24' },
        { key: 'Recall', label: 'Recall', width: 'w-24' },
        { key: 'F1 Score', label: 'F1 Score', width: 'w-24' },
        { key: 'P-C', label: 'P-C', width: 'w-20' },
        { key: 'P-V', label: 'P-V', width: 'w-20' },
        { key: 'P-B', label: 'P-B', width: 'w-20' },
        { key: 'P-R', label: 'P-R', width: 'w-20' }
      ],
      'code generation': [
        { key: 'pass@1', label: 'Pass@1', width: 'w-24' },
        { key: 'pass@3', label: 'Pass@3', width: 'w-24' },
        { key: 'pass@5', label: 'Pass@5', width: 'w-24' }
      ],
      'code translation': [
        { key: 'pass@1', label: 'Pass@1', width: 'w-24' },
        { key: 'pass@3', label: 'Pass@3', width: 'w-24' },
        { key: 'pass@5', label: 'Pass@5', width: 'w-24' },
        { key: 'CodeBLEU', label: 'CodeBLEU', width: 'w-28' }
      ],
      'code summarization': [
        { key: 'llmjudge', label: 'LLM Judge', width: 'w-28' }
      ],
      'code review': [
        { key: 'llmjudge', label: 'LLM Judge', width: 'w-28' }
      ],
      'input prediction': [
        { key: 'pass@1', label: 'Pass@1', width: 'w-24' },
        { key: 'pass@3', label: 'Pass@3', width: 'w-24' },
        { key: 'pass@5', label: 'Pass@5', width: 'w-24' }
      ],
      'output prediction': [
        { key: 'pass@1', label: 'Pass@1', width: 'w-24' },
        { key: 'pass@3', label: 'Pass@3', width: 'w-24' },
        { key: 'pass@5', label: 'Pass@5', width: 'w-24' }
      ],
      'vulnerability detection': [
        { key: 'Accuracy', label: 'Accuracy', width: 'w-24' },
        { key: 'Precision', label: 'Precision', width: 'w-24' },
        { key: 'Recall', label: 'Recall', width: 'w-24' },
        { key: 'F1 Score', label: 'F1 Score', width: 'w-24' },
        { key: 'P-C', label: 'P-C', width: 'w-20' },
        { key: 'P-V', label: 'P-V', width: 'w-20' },
        { key: 'P-B', label: 'P-B', width: 'w-20' },
        { key: 'P-R', label: 'P-R', width: 'w-20' }
      ],
    };

    // 特定的难度表头配置
    const difficultyHeaders = {
      'overall': [
        { key: 'easy_pass@1', label: 'Easy Pass@1', width: 'w-32' },
        { key: 'medium_pass@1', label: 'Medium Pass@1', width: 'w-32' },
        { key: 'hard_pass@1', label: 'Hard Pass@1', width: 'w-32' },
        { key: 'easy_pass@3', label: 'Easy Pass@3', width: 'w-32' },
        { key: 'medium_pass@3', label: 'Medium Pass@3', width: 'w-32' },
        { key: 'hard_pass@3', label: 'Hard Pass@3', width: 'w-32' },
        { key: 'easy_pass@5', label: 'Easy Pass@5', width: 'w-32' },
        { key: 'medium_pass@5', label: 'Medium Pass@5', width: 'w-32' },
        { key: 'hard_pass@5', label: 'Hard Pass@5', width: 'w-32' },
        { key: 'CodeBLEU', label: 'CodeBLEU', width: 'w-28' },
        { key: 'llmjudge', label: 'LLM Judge', width: 'w-28' },
        // 漏洞检测特定指标
        { key: 'Accuracy', label: 'Accuracy', width: 'w-24' },
        { key: 'Precision', label: 'Precision', width: 'w-24' },
        { key: 'Recall', label: 'Recall', width: 'w-24' },
        { key: 'F1 Score', label: 'F1 Score', width: 'w-24' },
        { key: 'P-C', label: 'P-C', width: 'w-20' },
        { key: 'P-V', label: 'P-V', width: 'w-20' },
        { key: 'P-B', label: 'P-B', width: 'w-20' },
        { key: 'P-R', label: 'P-R', width: 'w-20' }
      ],
      'code generation': [
        { key: 'easy_pass@1', label: 'Easy Pass@1', width: 'w-32' },
        { key: 'medium_pass@1', label: 'Medium Pass@1', width: 'w-32' },
        { key: 'hard_pass@1', label: 'Hard Pass@1', width: 'w-32' },
        { key: 'easy_pass@3', label: 'Easy Pass@3', width: 'w-32' },
        { key: 'medium_pass@3', label: 'Medium Pass@3', width: 'w-32' },
        { key: 'hard_pass@3', label: 'Hard Pass@3', width: 'w-32' },
        { key: 'easy_pass@5', label: 'Easy Pass@5', width: 'w-32' },
        { key: 'medium_pass@5', label: 'Medium Pass@5', width: 'w-32' },
        { key: 'hard_pass@5', label: 'Hard Pass@5', width: 'w-32' }
      ],
      'code translation': [
        { key: 'easy_pass@1', label: 'Easy Pass@1', width: 'w-32' },
        { key: 'medium_pass@1', label: 'Medium Pass@1', width: 'w-32' },
        { key: 'hard_pass@1', label: 'Hard Pass@1', width: 'w-32' },
        { key: 'easy_pass@3', label: 'Easy Pass@3', width: 'w-32' },
        { key: 'medium_pass@3', label: 'Medium Pass@3', width: 'w-32' },
        { key: 'hard_pass@3', label: 'Hard Pass@3', width: 'w-32' },
        { key: 'easy_pass@5', label: 'Easy Pass@5', width: 'w-32' },
        { key: 'medium_pass@5', label: 'Medium Pass@5', width: 'w-32' },
        { key: 'hard_pass@5', label: 'Hard Pass@5', width: 'w-32' },
        { key: 'CodeBLEU', label: 'CodeBLEU', width: 'w-28' }
      ],
      'code summarization': [
        { key: 'llmjudge', label: 'LLM Judge', width: 'w-28' }
      ],
      'code review': [
        { key: 'llmjudge', label: 'LLM Judge', width: 'w-28' }
      ],
      'input prediction': [
        { key: 'easy_pass@1', label: 'Easy Pass@1', width: 'w-32' },
        { key: 'medium_pass@1', label: 'Medium Pass@1', width: 'w-32' },
        { key: 'hard_pass@1', label: 'Hard Pass@1', width: 'w-32' },
        { key: 'easy_pass@3', label: 'Easy Pass@3', width: 'w-32' },
        { key: 'medium_pass@3', label: 'Medium Pass@3', width: 'w-32' },
        { key: 'hard_pass@3', label: 'Hard Pass@3', width: 'w-32' },
        { key: 'easy_pass@5', label: 'Easy Pass@5', width: 'w-32' },
        { key: 'medium_pass@5', label: 'Medium Pass@5', width: 'w-32' },
        { key: 'hard_pass@5', label: 'Hard Pass@5', width: 'w-32' }
      ],
      'output prediction': [
        { key: 'easy_pass@1', label: 'Easy Pass@1', width: 'w-32' },
        { key: 'medium_pass@1', label: 'Medium Pass@1', width: 'w-32' },
        { key: 'hard_pass@1', label: 'Hard Pass@1', width: 'w-32' },
        { key: 'easy_pass@3', label: 'Easy Pass@3', width: 'w-32' },
        { key: 'medium_pass@3', label: 'Medium Pass@3', width: 'w-32' },
        { key: 'hard_pass@3', label: 'Hard Pass@3', width: 'w-32' },
        { key: 'easy_pass@5', label: 'Easy Pass@5', width: 'w-32' },
        { key: 'medium_pass@5', label: 'Medium Pass@5', width: 'w-32' },
        { key: 'hard_pass@5', label: 'Hard Pass@5', width: 'w-32' }
      ],
      'vulnerability detection': [
        { key: 'Accuracy', label: 'Accuracy', width: 'w-24' },
        { key: 'Precision', label: 'Precision', width: 'w-24' },
        { key: 'Recall', label: 'Recall', width: 'w-24' },
        { key: 'F1 Score', label: 'F1 Score', width: 'w-24' },
        { key: 'P-C', label: 'P-C', width: 'w-20' },
        { key: 'P-V', label: 'P-V', width: 'w-20' },
        { key: 'P-B', label: 'P-B', width: 'w-20' },
        { key: 'P-R', label: 'P-R', width: 'w-20' }
      ]
    };

    const commonHeaders = [
      { key: 'rank', label: 'Rank', width: 'w-16' },
      { key: 'model', label: 'Model Name', width: 'w-48' },
    ];

    const abilityHeaders = [
      { key: 'ability', label: 'Ability', width: 'w-32' },
      { key: 'task', label: 'Task', width: 'w-32' },
    ];

    // If showing by difficulty, use difficulty-specific headers
    if (showByDifficulty) {
      return [...commonHeaders, ...difficultyHeaders[task], ...abilityHeaders];
    }

    // Otherwise, use standard headers
    return [...commonHeaders, ...tableHeaders[task], ...abilityHeaders];
  };

  // Results Table 部分 - 使用缓存的排序结果
  const renderResultsTable = () => {
    // 只有在第一次加载且没有结果时才显示 Loading
    if (isLoading && results.length === 0) {
      return (
        <tr>
          <td colSpan={getTableHeaders(currentTask).length} className="px-6 py-4 text-center">
            Loading results...
          </td>
        </tr>
      );
    }

    // 如果有结果，即使在加载中也显示旧的结果
    if (sortedResults.length > 0) {
      return sortedResults.map((result, index) => (
        <tr key={index} className={isDarkMode ? 'hover:bg-[#1f2b3d]' : 'hover:bg-slate-50'}>
          {getTableHeaders(currentTask).map(header => (
            <td 
              key={header.key}
              className={`px-6 py-4 whitespace-nowrap text-base font-jetbrains-mono ${header.width} ${
                header.key === 'model' 
                  ? isDarkMode ? 'text-slate-200 font-medium' : 'text-slate-900 font-medium'
                  : isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              <div className={`${['pass@1', 'pass@3', 'pass@5', 'easy_pass@1', 'medium_pass@1', 'hard_pass@1', 'easy_pass@3', 'medium_pass@3', 'hard_pass@3', 'easy_pass@5', 'medium_pass@5', 'hard_pass@5', 'CodeBLEU', 'Execution', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'P-C', 'P-V', 'P-B', 'P-R', 'llmjudge', 'LLMJudge'].includes(header.key) ? 'text-center' : 'text-left'} font-semibold`}>
                {(() => {
                  const value = result[header.key as keyof typeof result];
                  if (value === null || value === undefined || value === '') {
                    return '-';
                  }
                  
                  // Special handling for model names with links
                  if (header.key === 'model') {
                    const modelUrl = result['model_url'] as string;
                    if (modelUrl) {
                      return (
                        <a 
                          href={modelUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`hover:underline hover:text-blue-500 transition-colors font-semibold`}
                        >
                          {value}
                        </a>
                      );
                    }
                  }
                  
                  if (typeof value === 'number') {
                    // 处理一般百分比显示
                    if (['pass@1', 'pass@3', 'pass@5', 'CodeBLEU', 'Execution', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'P-C', 'P-V', 'P-B', 'P-R'].includes(header.key)) {
                      return (value * 100).toFixed(1);
                    } else if (header.key === 'llmjudge' || header.key === 'LLMJudge') {
                      return ((value / 5) * 100).toFixed(1);
                    }
                  }
                  // If the value is a string but contains a percentage, convert it to the new format
                  if (typeof value === 'string' && value.endsWith('%')) {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      return numValue.toFixed(1);
                    }
                  }
                  return value;
                })()}
              </div>
            </td>
          ))}
        </tr>
      ));
    }

    // 如果没有结果且不在加载中，显示无结果信息
    return (
      <tr>
        <td colSpan={getTableHeaders(currentTask).length} className="px-6 py-4 text-center">
          No results found
        </td>
      </tr>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#0a0f1a]' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className={`${isDarkMode ? 'bg-[#0f1729]/80' : 'bg-white/90'} backdrop-blur-sm border-b ${isDarkMode ? 'border-blue-500/20' : 'border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <a href="#home" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                Code TREAT
              </a>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="flex items-center space-x-8">
                <a href="#home" className={`${isDarkMode ? 'text-blue-200 hover:text-blue-400' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>Home</a>
                <a href="#about" className={`${isDarkMode ? 'text-blue-200 hover:text-blue-400' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>About</a>
                <a href="#evaluation" className={`${isDarkMode ? 'text-blue-200 hover:text-blue-400' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>Evaluation</a>
                <a 
                  href="mailto:lyu@cse.cuhk.edu.hk,ejli@cse.cuhk.edu.hk"
                  className={`${isDarkMode ? 'text-blue-200 hover:text-blue-400' : 'text-slate-600 hover:text-slate-900'} transition-colors`}
                >
                  Contact
                </a>
              </nav>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#1a2234]/80 text-blue-200 hover:bg-blue-900/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-colors`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="h-16"></div>

      {/* 统一的背景 */}
      <div className="fixed inset-0">
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-[#1a2333] to-slate-900' : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50'}`} />
        <div className={`absolute inset-0 bg-[url('/grid.svg')] ${isDarkMode ? 'opacity-[0.07]' : 'opacity-[0.03]'}`} />
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-slate-800/10 via-blue-900/5 to-slate-800/10' : 'from-blue-400/5 via-purple-400/5 to-blue-400/5'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        />
      </div>

      {/* Hero Section */}
      <main className="relative flex-grow flex flex-col items-center justify-center text-center px-4 pb-16" id="home">
        <div className="relative mt-[180px]">
          <motion.h1 
            className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Code TREAT
          </motion.h1>
          <motion.h2 
            className={`text-3xl ${isDarkMode ? 'text-blue-200' : 'text-slate-800'} mb-8 max-w-3xl mx-auto leading-relaxed`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Code LLM Trustworthiness/Reliability Evaluation and Testing
          </motion.h2>
          <motion.p 
            className={`text-xl ${isDarkMode ? 'text-blue-200/80' : 'text-slate-600'} mb-8 max-w-2xl mx-auto`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Ensuring the quality and reliability of AI-generated code through comprehensive testing and evaluation.
          </motion.p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.a
              href="https://arxiv.org/abs/2404.00160"
              target="_blank"
              rel="noopener noreferrer"
              className={`relative inline-flex items-center px-6 py-4 text-lg text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
                overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-6">
                <span className="relative z-10 flex items-center justify-center">
                  <svg 
                    aria-hidden="true" 
                    focusable="false" 
                    className="w-5 h-5" 
                    role="img" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 384 512"
                  >
                    <path 
                      fill="currentColor" 
                      d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z"
                    ></path>
                  </svg>
                </span>
                <span className="relative z-10">Paper</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 
                group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl 
                opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
            
            <motion.a
              href="https://github.com/CUHK-ARISE/Code-TREAT"
              target="_blank"
              rel="noopener noreferrer"
              className={`relative inline-flex items-center px-6 py-4 text-lg text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
                overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-6">
                <span className="relative z-10 flex items-center justify-center">
                  <svg 
                    aria-hidden="true" 
                    focusable="false" 
                    className="w-5 h-5" 
                    role="img" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 496 512"
                  >
                    <path 
                      fill="currentColor" 
                      d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
                    ></path>
                  </svg>
                </span>
                <span className="relative z-10">Code</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 
                group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl 
                opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
            
            <motion.a
              href="https://huggingface.co/datasets/CUHK-ARISE/Code-TREAT"
              target="_blank"
              rel="noopener noreferrer"
              className={`relative inline-flex items-center px-6 py-4 text-lg text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
                overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-6">
                <span className="relative z-10 flex items-center justify-center">
                  <svg 
                    aria-hidden="true" 
                    focusable="false" 
                    className="w-5 h-5" 
                    role="img" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 576 512"
                  >
                    <path 
                      fill="currentColor" 
                      d="M480 416v16c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V176c0-26.51 21.49-48 48-48h16v48H54a6 6 0 0 0-6 6v244a6 6 0 0 0 6 6h372a6 6 0 0 0 6-6v-10h48zm42-336H150a6 6 0 0 0-6 6v244a6 6 0 0 0 6 6h372a6 6 0 0 0 6-6V86a6 6 0 0 0-6-6zm6-48c26.51 0 48 21.49 48 48v256c0 26.51-21.49 48-48 48H144c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h384zM264 144c0 22.091-17.909 40-40 40s-40-17.909-40-40 17.909-40 40-40 40 17.909 40 40zm-72 96l39.515-39.515c4.686-4.686 12.284-4.686 16.971 0L288 240l103.515-103.515c4.686-4.686 12.284-4.686 16.971 0L480 208v80H192v-48z"
                    ></path>
                  </svg>
                </span>
                <span className="relative z-10">Data</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 
                group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl 
                opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
            
            <motion.a
              href="#evaluation"
              className={`relative inline-flex items-center px-6 py-4 text-lg text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
                overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-6">
                <span className="relative z-10 flex items-center justify-center">
                  <svg 
                    aria-hidden="true" 
                    focusable="false" 
                    className="w-5 h-5" 
                    role="img" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 576 512"
                  >
                    <path 
                      fill="currentColor" 
                      d="M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 35.7 22.5 72.4 61.9 100.7 31.5 22.7 69.8 37.1 110 41.7C203.3 338.5 240 360 240 360v72h-48c-35.3 0-64 20.7-64 56v12c0 6.6 5.4 12 12 12h296c6.6 0 12-5.4 12-12v-12c0-35.3-28.7-56-64-56h-48v-72s36.7-21.5 68.1-73.6c40.3-4.6 78.6-19 110-41.7 39.3-28.3 61.9-65 61.9-100.7V88c0-13.3-10.7-24-24-24zM99.3 192.8C74.9 175.2 64 155.6 64 144v-16h64.2c1 32.6 5.8 61.2 12.8 86.2-15.1-5.2-29.2-12.4-41.7-21.4zM512 144c0 16.1-17.7 36.1-35.3 48.8-12.5 9-26.7 16.2-41.8 21.4 7-25 11.8-53.6 12.8-86.2H512v16z"
                    ></path>
                  </svg>
                </span>
                <span className="relative z-10">Leaderboard</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 
                group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl 
                opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          </div>
        </div>
      </main>

      {/* About Section */}
      <section id="about" className="relative flex items-center py-8">
        <motion.div 
          className="relative w-full max-w-7xl mx-auto px-4 py-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text 
            bg-gradient-to-r from-blue-500 to-purple-500 mb-24">
            About Code TREAT
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className={`${isDarkMode ? 'bg-[#0f1729]/80' : 'bg-white/90'} backdrop-blur-sm p-6 rounded-xl text-center border ${isDarkMode ? 'border-blue-500/20' : 'border-slate-200'} shadow-sm`}>
              <h3 className="text-lg font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                Trustworthiness Analysis
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-slate-600'}`}>
                Evaluate the reliability of code generated by Large Language Models
              </p>
            </div>
            <div className={`${isDarkMode ? 'bg-[#0f1729]/80' : 'bg-white/90'} backdrop-blur-sm p-6 rounded-xl text-center border ${isDarkMode ? 'border-blue-500/20' : 'border-slate-200'} shadow-sm`}>
              <h3 className="text-lg font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                Reliability Testing
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-slate-600'}`}>
                Comprehensive testing framework for AI-generated code
              </p>
            </div>
            <div className={`${isDarkMode ? 'bg-[#0f1729]/80' : 'bg-white/90'} backdrop-blur-sm p-6 rounded-xl text-center border ${isDarkMode ? 'border-blue-500/20' : 'border-slate-200'} shadow-sm`}>
              <h3 className="text-lg font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                Performance Metrics
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-slate-600'}`}>
                Detailed analysis of code quality and performance
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Leaderboard Section */}
      <section id="evaluation" className="relative flex items-center pt-0">
        <div className="relative w-full max-w-7xl mx-auto px-4 py-0">
          <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-24 font-jetbrains-mono">
            Leaderboard
          </h1>

          {/* Task Filter */}
          <div className="w-full max-w-7xl mx-auto mb-2">
            <div className={`flex items-center ${isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'} backdrop-blur-sm border ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} rounded-xl overflow-hidden shadow-sm`}>
              {/* Previous Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePreviousPage}
                disabled={!hasPreviousPage()}
                className={`px-4 py-3 transition-all ${
                  hasPreviousPage()
                    ? isDarkMode 
                      ? 'text-slate-300 hover:bg-blue-900/20' 
                      : 'text-slate-600 hover:bg-slate-100'
                    : isDarkMode
                      ? 'text-slate-600'
                      : 'text-slate-400'
                } disabled:cursor-not-allowed`}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </motion.button>

              {/* Task Buttons */}
              <div className="flex flex-1">
                {getCurrentPageTasks().map((task) => (
                  <motion.button
                    key={task}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTaskChange(task as TaskType)}
                    className={`
                      flex-1 relative py-3 text-center transition-all duration-200 border-r ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} last:border-r-0
                      ${currentTask === task 
                        ? isDarkMode ? 'bg-blue-900 text-blue-100 font-semibold' : 'bg-blue-500 text-white font-semibold'
                        : isDarkMode ? 'text-slate-300 hover:bg-blue-900/20' : 'text-slate-600 hover:bg-slate-100'
                      }
                    `}
                  >
                    <span className="relative z-10 text-base font-medium">
                      {task.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                    {currentTask === task && (
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-blue-900 to-blue-800' : 'from-blue-600 to-blue-500'}`}
                        layoutId="activeTaskBackground"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Next Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextPage}
                disabled={!hasNextPage()}
                className={`px-4 py-3 transition-all ${
                  hasNextPage()
                    ? isDarkMode 
                      ? 'text-slate-300 hover:bg-blue-900/20' 
                      : 'text-slate-600 hover:bg-slate-100'
                    : isDarkMode
                      ? 'text-slate-600'
                      : 'text-slate-400'
                } disabled:cursor-not-allowed`}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Ability Filters */}
          <Card className={`w-full max-w-7xl mx-auto ${isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'} backdrop-blur-sm border ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} rounded-xl shadow-sm`}>
            <CardContent className="space-y-4 p-4">
              {/* Dataset Filter */}
              {taskAbilities[currentTask].dataset.length > 0 && (
                <div className="flex flex-col space-y-2">
                  <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">Dataset</p>
                  <div className="flex flex-wrap gap-2">
                    {taskAbilities[currentTask].dataset.map((value: string) => (
                      <motion.button
                        key={value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAbilityChange('dataset', value)}
                        className={`
                          px-4 py-2 rounded-lg text-center transition-all
                          ${selectedAbilities.dataset?.includes(value)
                            ? isDarkMode ? 'bg-blue-900 text-blue-100 border border-blue-700' : 'bg-blue-500 text-white border border-blue-400'
                            : isDarkMode ? 'bg-[#151d2a] text-slate-300 hover:bg-blue-900/20 border border-slate-700/50' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }
                        `}
                      >
                        {value}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* LLM Judge Filter */}
              {(currentTask === 'code summarization' || currentTask === 'code review') && availableLLMJudges.length > 0 && (
                <div className="flex flex-col space-y-2">
                  <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">LLM Judge</p>
                  <div className="flex flex-wrap gap-2">
                    {availableLLMJudges.map((judge: string) => (
                      <motion.button
                        key={judge}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAbilityChange('llmJudges', judge)}
                        className={`
                          px-4 py-2 rounded-lg text-center transition-all
                          ${selectedAbilities.llmJudges?.includes(judge)
                            ? isDarkMode ? 'bg-blue-900 text-blue-100 border border-blue-700' : 'bg-blue-500 text-white border border-blue-400'
                            : isDarkMode ? 'bg-[#151d2a] text-slate-300 hover:bg-blue-900/20 border border-slate-700/50' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }
                        `}
                      >
                        {judge}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Filters */}
              {(Object.entries(taskAbilities[currentTask]) as [keyof Ability, string[]][])
                .filter(([key]) => !['dataset', 'llmJudges'].includes(key))
                .map(([key, values]) => (
                  values.length > 0 && (
                    <div key={key} className="flex flex-col space-y-2">
                      <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value: string) => (
                          <motion.button
                            key={value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAbilityChange(key, value)}
                            className={`
                              px-4 py-2 rounded-lg text-center transition-all
                              ${selectedAbilities[key]?.includes(value)
                                ? isDarkMode ? 'bg-blue-900 text-blue-100 border border-blue-700' : 'bg-blue-500 text-white border border-blue-400'
                                : isDarkMode ? 'bg-[#151d2a] text-slate-300 hover:bg-blue-900/20 border border-slate-700/50' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }
                            `}
                          >
                            {value}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )
                ))}

              {/* Divider */}
              <div className={`border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} my-4`} />

              {/* Note about "-" symbol */}
              <div className={`flex items-center justify-end gap-2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <span className="font-mono">—</span>
                <span className="text-sm">Denotes data is not yet available.</span>
              </div>

              {/* Vulnerability Detection Metrics Explanation */}
              {currentTask === 'vulnerability detection' && (
                <div className={`mt-4 space-y-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>P-C:</span>
                        <span>Correctly predicts both elements</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>P-V:</span>
                        <span>Both predicted as vulnerable</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>P-B:</span>
                        <span>Both predicted as benign</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>P-R:</span>
                        <span>Inversely predicted labels</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs italic text-right">
                    Note: P-C + P-V + P-B + P-R = 100%
                  </div>
                </div>
              )}

              {/* Difficulty toggle */}
              <div className="flex justify-end mt-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showByDifficulty}
                    onChange={() => setShowByDifficulty(!showByDifficulty)}
                    className={`form-checkbox h-5 w-5 ${
                      isDarkMode 
                        ? 'text-blue-600 bg-[#151d2a] border-slate-700' 
                        : 'text-blue-600 bg-slate-100 border-slate-300'
                    } rounded focus:ring-blue-500`} 
                  />
                  <span className={`ml-2 text-sm ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Show results by difficulty
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card className={`mt-4 ${isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'} backdrop-blur-sm border ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} rounded-xl overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className={`min-w-full table-fixed divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-slate-200'}`}>
                <thead className={`bg-${isDarkMode ? 'slate-800' : 'slate-50'}`}>
                  <tr>
                    {getTableHeaders(currentTask).map((header) => (
                      <th 
                        key={header.key} 
                        className={`px-6 py-4 text-left text-base font-extrabold uppercase tracking-wider cursor-pointer font-jetbrains-mono ${header.width} ${
                          isDarkMode 
                            ? 'text-slate-300 bg-[#151d2a]' 
                            : 'text-slate-600 bg-slate-50'
                        }`}
                        onClick={() => {
                          // Enable sorting for all numeric columns including difficulty-based metrics
                          const sortableColumns = [
                            'rank', 
                            'pass@1', 'pass@3', 'pass@5', 
                            'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
                            'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
                            'easy_pass@5', 'medium_pass@5', 'hard_pass@5',
                            'CodeBLEU', 'LLMJudge', 'llmjudge', 'Execution',
                            // 漏洞检测特定指标
                            'Accuracy', 'Precision', 'Recall', 'F1 Score',
                            'P-C', 'P-V', 'P-B', 'P-R'
                          ];
                          if (sortableColumns.includes(header.key)) {
                            handleSort(header.key);
                          }
                        }}
                      >
                        <div className={`flex items-center ${['pass@1', 'pass@3', 'pass@5', 'easy_pass@1', 'medium_pass@1', 'hard_pass@1', 'easy_pass@3', 'medium_pass@3', 'hard_pass@3', 'easy_pass@5', 'medium_pass@5', 'hard_pass@5', 'CodeBLEU', 'Execution', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'P-C', 'P-V', 'P-B', 'P-R', 'llmjudge', 'LLMJudge'].includes(header.key) ? 'justify-center' : 'justify-start'}`}>
                          <span>{header.label}</span>
                          {/* Sort indicator */}
                          <span className="ml-1 text-xs opacity-50">
                            {sortConfig && sortConfig.key === header.key ? (
                              sortConfig.direction === 'asc' ? '↑' : '↓'
                            ) : '↕'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-slate-200'}`}>
                  {renderResultsTable()}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}