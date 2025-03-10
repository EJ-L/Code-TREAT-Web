"use client";
// import Image from "next/image";
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { processResults, formatResults } from '@/lib/resultProcessor';
import { FilterOptions, TaskType, Ability } from '@/lib/types';
import { getAvailableLLMJudges } from '@/lib/tasks/codeSummarization';
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
    dataset: ['HackerRank', 'GeeksForGeeks', 'PolyHumanEval', 'CodeTransOcean', 'GitHub'],
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
  'code execution': {
    modality: ['Python', 'Java'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['HackerRank', 'GeeksForGeeks'],
    robustness: [],
    privacy: [],
  }
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
  'pass@1'?: string | number;
  'pass@3'?: string | number;
  'pass@5'?: string | number;
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

  // 获取默认排序配置
  const getDefaultSortConfig = (task: TaskType) => {
    console.log('Getting default sort config for task:', task);
    switch (task) {
      case 'code summarization':
        return { key: 'llmjudge', direction: 'desc' as const };
      default:
        return { key: 'pass@1', direction: 'desc' as const };
    }
  };

  // 处理任务切换
  const handleTaskChange = (task: TaskType) => {
    console.log('Task changed to:', task);
    setCurrentTask(task);
    setSelectedAbilities({});
    setSortConfig(getDefaultSortConfig(task));
  };

  // 处理过滤器选择
  const handleAbilityChange = (key: keyof Ability, value: string) => {
    console.log('Ability filter changed:', key, value);
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
    console.log('Loading LLM Judges effect triggered');
    const loadLLMJudges = async () => {
      console.log('Starting to load LLM Judges');
      if (currentTask === 'code summarization' || currentTask === 'overall') {
        try {
          console.log('Loading all data for LLM Judges');
          const rawData = await loadAllData();
          console.log('Raw data loaded:', !!rawData);
          const judges = getAvailableLLMJudges(rawData);
          console.log('Available judges:', judges);
          setAvailableLLMJudges(judges);
          
          taskAbilities['code summarization'].llmJudges = judges;
          taskAbilities['overall'].llmJudges = judges;
        } catch (error) {
          console.error('Error loading LLM Judges:', error);
        }
      }
    };
    
    loadLLMJudges();
  }, [currentTask]);

  // 排序函数
  const sortResults = (data: ResultItem[]) => {
    console.log('Sorting results with config:', sortConfig);
    if (!sortConfig) return data;

    // 先进行排序
    const sortedData = [...data].sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // 处理百分比字符串
      const parseValue = (value: string | number | undefined) => {
        if (value === undefined || value === '-') return -Infinity;
        if (typeof value === 'string' && value.endsWith('%')) {
          return parseFloat(value.replace('%', ''));
        }
        return typeof value === 'number' ? value : -Infinity;
      };

      const aNum = parseValue(aValue);
      const bNum = parseValue(bValue);

      if (aNum === bNum) return 0;
      if (aNum === -Infinity && bNum === -Infinity) return 0;
      if (aNum === -Infinity) return 1;
      if (bNum === -Infinity) return -1;

      const comparison = aNum < bNum ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    // 重新计算 rank
    return sortedData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  };

  // 处理排序
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // 处理数据加载和过滤
  useEffect(() => {
    console.log('Data loading and filtering effect triggered');
    let isMounted = true;

    const loadAndProcessData = async () => {
      console.log('Starting to load and process data');
      try {
        const filters: FilterOptions = {
          tasks: [],
          datasets: selectedAbilities.dataset || [],
          langs: selectedAbilities.modality || [],
          modalities: selectedAbilities.modality || [],
          knowledge: selectedAbilities.knowledge || [],
          reasoning: selectedAbilities.reasoning || [],
          robustness: selectedAbilities.robustness || [],
          security: selectedAbilities.privacy || [],
          llmJudges: selectedAbilities.llmJudges || [],
        };
        console.log('Applied filters:', filters);

        console.log('Processing results for task:', currentTask);
        const processedResults = await processResults(currentTask, filters);
        console.log('Results processed:', !!processedResults);
        
        const formattedResults = formatResults(processedResults, filters);
        console.log('Results formatted:', formattedResults.length);
        
        if (isMounted) {
          if (formattedResults.length > 0) {
            console.log('Setting new results');
            setResults(formattedResults as ResultItem[]);
            setSortConfig(getDefaultSortConfig(currentTask));
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in loadAndProcessData:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAndProcessData();

    return () => {
      isMounted = false;
      console.log('Component cleanup');
    };
  }, [currentTask, selectedAbilities]);

  // 根据任务类型返回表头
  const getTableHeaders = (task: TaskType) => {
    const commonHeaders = [
      { key: 'rank', label: 'Rank' },
      { key: 'model', label: 'Model Name' },
    ];

    const taskSpecificHeaders = {
      'overall': [
        { key: 'pass@1', label: 'Pass@1' },
        { key: 'pass@3', label: 'Pass@3' },
        { key: 'pass@5', label: 'Pass@5' },
        { key: 'CodeBLEU', label: 'CodeBLEU' },
        { key: 'LLMJudge', label: 'LLMJudge' },
        { key: 'Execution', label: 'Execution' },
      ],
      'code generation': [
        { key: 'pass@1', label: 'Pass@1' },
        { key: 'pass@3', label: 'Pass@3' },
        { key: 'pass@5', label: 'Pass@5' },
      ],
      'code translation': [
        { key: 'pass@1', label: 'Pass@1' },
        { key: 'pass@3', label: 'Pass@3' },
        { key: 'pass@5', label: 'Pass@5' },
        { key: 'CodeBLEU', label: 'CodeBLEU' },
      ],
      'code summarization': [
        { key: 'llmjudge', label: 'LLMJudge Score' },
      ],
      'code execution': [
        { key: 'pass@1', label: 'Pass@1' },
        { key: 'pass@3', label: 'Pass@3' },
        { key: 'pass@5', label: 'Pass@5' },
      ],
    };

    const abilityHeaders = [
      { key: 'ability', label: 'Ability' },
      { key: 'task', label: 'Task' },
    ];

    return [...commonHeaders, ...taskSpecificHeaders[task], ...abilityHeaders];
  };

  // Results Table 部分
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
    if (results.length > 0) {
      return sortResults(results).map((result, index) => (
        <tr key={index} className={isDarkMode ? 'hover:bg-[#1f2b3d]' : 'hover:bg-slate-50'}>
          {getTableHeaders(currentTask).map(header => (
            <td 
              key={header.key}
              className={`px-6 py-4 whitespace-nowrap text-sm ${
                header.key === 'model' 
                  ? isDarkMode ? 'text-slate-200 font-medium' : 'text-slate-900 font-medium'
                  : isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {(() => {
                const value = result[header.key as keyof typeof result];
                if (typeof value === 'number') {
                  if (['pass@1', 'pass@3', 'pass@5', 'CodeBLEU', 'Execution'].includes(header.key)) {
                    return (value * 100).toFixed(2) + '%';
                  } else if (header.key === 'llmjudge' || header.key === 'LLMJudge') {
                    return ((value / 5) * 100).toFixed(2) + '%';
                  }
                }
                return value || '-';
              })()}
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
          <motion.a
            href="#evaluation"
            className={`relative inline-flex px-10 py-4 text-lg text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
              overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 
              group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl 
              opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.a>
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
          <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-24">
            Leaderboard
          </h1>

          {/* Task Filter */}
          <div className="w-full max-w-7xl mx-auto mb-2">
            <div className={`flex ${isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'} backdrop-blur-sm border ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} rounded-xl overflow-hidden shadow-sm`}>
              {Object.keys(taskAbilities).map((task) => (
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
              {currentTask === 'code summarization' && availableLLMJudges.length > 0 && (
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
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card className={`mt-4 ${isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'} backdrop-blur-sm border ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} rounded-xl overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-slate-200'}`}>
                <thead>
                  <tr>
                    {getTableHeaders(currentTask).map((header) => (
                      <th 
                        key={header.key} 
                        className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${
                          isDarkMode 
                            ? 'text-slate-400 bg-[#151d2a]' 
                            : 'text-slate-500 bg-slate-50'
                        }`}
                        onClick={() => {
                          // 只对数值列启用排序
                          if (['rank', 'pass@1', 'pass@3', 'pass@5', 'CodeBLEU', 'LLMJudge', 'llmjudge', 'Execution'].includes(header.key)) {
                            handleSort(header.key);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{header.label}</span>
                          {['rank', 'pass@1', 'pass@3', 'pass@5', 'CodeBLEU', 'LLMJudge', 'llmjudge', 'Execution'].includes(header.key) && (
                            <span className="text-xs opacity-50">
                              {sortConfig?.key === header.key ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          )}
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

      {/* Footer */}
      <footer className={`relative py-3 border-t ${isDarkMode ? 'border-blue-500/20' : 'border-slate-200'}`}>
        <div className={`max-w-7xl mx-auto text-center ${isDarkMode ? 'text-blue-200/60' : 'text-slate-500'} text-sm`}>
          © 2024 Code TREAT. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
