import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { FilterOptions, TaskType, Ability } from '@/lib/types';
import TaskSelector from './TaskSelector';
import FilterPanel from './FilterPanel';
import ResultsTable from './ResultsTable';
import ModelComparisonModal from '@/app/components/ui/ModelComparisonModal';
import { processResults, formatResults } from '@/lib/resultProcessor';
import { getAvailableLLMJudges as getSummarizationJudges } from '@/lib/tasks/codeSummarization';
import { getAvailableLLMJudges as getReviewJudges } from '@/lib/tasks/codeReview';
import { loadAllData } from '@/lib/dataLoader';


interface LeaderboardProps {
  taskAbilities: Record<TaskType, Ability>;
  isDarkMode: boolean;
}

  const Leaderboard: FC<LeaderboardProps> = ({ taskAbilities, isDarkMode }) => {
  const [currentTask, setCurrentTask] = useState<TaskType>('overall');
  const [selectedAbilities, setSelectedAbilities] = useState<Partial<Ability>>({});
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'pass@1', direction: 'desc' });
  const [availableLLMJudges, setAvailableLLMJudges] = useState<string[]>([]);
  const [currentTaskPage, setCurrentTaskPage] = useState(0);
  const [showByDifficulty, setShowByDifficulty] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  
  const TASKS_PER_PAGE = 4;
  // Define tasks that have difficulty-based results
  const tasksWithDifficulty = ['overall', 'code generation', 'code translation', 'input prediction', 'output prediction'];

  // Helper function to get tasks for current page
  const getCurrentPageTasks = useCallback(() => {
    const allTasks = Object.keys(taskAbilities);
    const startIndex = currentTaskPage * TASKS_PER_PAGE;
    return allTasks.slice(startIndex, startIndex + TASKS_PER_PAGE);
  }, [currentTaskPage, taskAbilities]);

  // Helper function to check if there are more tasks
  const hasNextPage = useCallback(() => {
    const allTasks = Object.keys(taskAbilities);
    return (currentTaskPage + 1) * TASKS_PER_PAGE < allTasks.length;
  }, [currentTaskPage, taskAbilities]);

  // Helper function to check if there are previous tasks
  const hasPreviousPage = useCallback(() => {
    return currentTaskPage > 0;
  }, [currentTaskPage]);

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
      case 'code-web':
        return { key: 'CLIP', direction: 'desc' as const };
      case 'interaction-2-code':
        return { key: 'CLIP', direction: 'desc' as const };
      case 'code-robustness':
        return { key: 'VAN', direction: 'desc' as const };
      case 'mr-web':
        return { key: 'MAE', direction: 'desc' as const };
      default:
        return { key: 'pass@1', direction: 'desc' as const };
    }
  };

  // 处理任务切换
  const handleTaskChange = (task: TaskType) => {
    setCurrentTask(task);
    setIsComparisonModalOpen(false);  // Close comparison modal when switching tasks
    
    // Auto-select only the first available dataset for tasks that have them
    const newSelectedAbilities: Partial<Ability> = {};
    
    // For tasks other than 'overall' and 'interaction-2-code', auto-select first dataset only
    if (task !== 'overall' && task !== 'interaction-2-code') {
      const taskAbility = taskAbilities[task];
      
      // Auto-select first dataset if available
      if (taskAbility.dataset && taskAbility.dataset.length > 0) {
        newSelectedAbilities.dataset = [taskAbility.dataset[0]];
      }
    }
    
    setSelectedAbilities(newSelectedAbilities);
    
    // 注意：对于code review任务，我们暂时不应用任何过滤器
    if (task === 'code review') {
      // 不应用llmJudge过滤器，以便查看所有结果
      setSortConfig({ key: 'llmjudge', direction: 'desc' });
    } else if (task === 'overall') {
      // 对于overall任务，我们使用未过滤的数据计算平均值
      setSortConfig({ key: 'pass@1', direction: 'desc' });
    } else {
      setSortConfig(getDefaultSortConfig(task));
    }

    // Initialize column widths for the new task
    initializeColumnWidths();
  };

  // Handle filter selection
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

  // Load available LLM Judges
  useEffect(() => {
    const loadLLMJudges = async () => {
      if (currentTask === 'code summarization' || currentTask === 'code review' || currentTask === 'overall') {
        try {
          const rawData = await loadAllData();
          
          // Choose the appropriate judge detection function based on task type
          let judges: string[] = [];
          if (currentTask === 'code review') {
            judges = getReviewJudges(rawData);
          } else {
            judges = getSummarizationJudges(rawData);
          }
          
          setAvailableLLMJudges(judges);
          
          // Update available judges for the task
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
  }, [currentTask, taskAbilities]);

  // Sorting function
  const sortResults = useCallback((data: any[]) => {
    if (!sortConfig) return data;

    const sortableData = [...data];
    
    sortableData.sort((a, b) => {
      // Special handling for model names (string sorting)
      if (sortConfig.key === 'model') {
        const aModel = String(a[sortConfig.key] || '').toLowerCase();
        const bModel = String(b[sortConfig.key] || '').toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aModel.localeCompare(bModel);
        } else {
          return bModel.localeCompare(aModel);
        }
      }

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
  }, [sortConfig]);

  // Memoize sorted results
  const sortedResults = useMemo(() => {
    if (!results.length) return [];
    return sortResults(results);
  }, [results, sortConfig, sortResults]);

  // Handle sorting
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
      // Vulnerability detection metrics
      'Accuracy', 'Precision', 'Recall', 'F1 Score',
      'P-C', 'P-V', 'P-B', 'P-R',
      // Code-web metrics
      'CLIP', 'Compilation',
      // Interaction-2-code metrics
      'SSIM', 'Text', 'Position', 'Implement Rate',
      // Code-robustness metrics
      'VAN', 'REN', 'RTF', 'GBC', 'ALL', 'MDC', 'MPS', 'MHC',
      // MR-Web metrics
      'MAE', 'NEMD', 'RER'
    ];
    
    // For rank and model, we sort low-to-high (asc) alphabetically
    if (key === 'rank' || key === 'model') {
      initialDirection = 'asc';
    } else if (highToLowMetrics.includes(key)) {
      initialDirection = 'desc'; // Higher values are better
    }

    setSortConfig({ key, direction: initialDirection });
  }, [sortConfig]);

  // Reset showByDifficulty when task changes to overall
  useEffect(() => {
    if (currentTask === 'overall') {
      setShowByDifficulty(false);
    }
  }, [currentTask]);

  // Handle showByDifficulty changes - ensure HackerRank is selected when enabled
  useEffect(() => {
    if (showByDifficulty && currentTask === 'code translation') {
      // Automatically select HackerRank dataset when showing by difficulty
      setSelectedAbilities(prev => {
        // Check if HackerRank is already in the dataset
        const hasHackerRank = prev.dataset?.includes('HackerRank');
        
        if (!hasHackerRank) {
          // Add HackerRank to the dataset selection
          return {
            ...prev,
            dataset: [...(prev.dataset || []), 'HackerRank']
          };
        }
        
        return prev;
      });
    }
  }, [showByDifficulty, currentTask]);

  // Load and process data when filters change
  useEffect(() => {
    let isMounted = true;
    
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
          framework: selectedAbilities.framework || [],
          showByDifficulty: currentTask === 'overall' ? false : showByDifficulty
        };
        
        // Special handling for code review task
        if (currentTask === 'code review') {
          filterOptions.llmJudges = [];
          filterOptions.langs = [];
          filterOptions.datasets = [];
        }
        
        // Special handling for overall task
        if (currentTask === 'overall') {
          filterOptions.llmJudges = [];
          filterOptions.langs = [];
          filterOptions.datasets = [];
          filterOptions.modalities = [];
          filterOptions.knowledge = [];
          filterOptions.reasoning = [];
          filterOptions.robustness = [];
          filterOptions.security = [];
          filterOptions.showByDifficulty = false;
        }
        
        // Special handling for new tasks
        if (currentTask === 'code-web' || currentTask === 'interaction-2-code' || currentTask === 'code-robustness' || currentTask === 'mr-web') {
          filterOptions.llmJudges = [];
          filterOptions.showByDifficulty = false;
          
          // For interaction-2-code, disable most filters except datasets if needed
          if (currentTask === 'interaction-2-code') {
            filterOptions.langs = [];
            filterOptions.modalities = [];
            filterOptions.knowledge = [];
            filterOptions.reasoning = [];
            filterOptions.robustness = [];
            filterOptions.security = [];
            filterOptions.datasets = [];  // No filtering for interaction-2-code
            filterOptions.framework = [];
          }
          
          // For code-robustness, disable filters except datasets
          if (currentTask === 'code-robustness') {
            filterOptions.langs = [];
            filterOptions.modalities = [];
            filterOptions.knowledge = [];
            filterOptions.reasoning = [];
            filterOptions.robustness = [];
            filterOptions.security = [];
            filterOptions.framework = [];
          }
          
          // For code-web, disable unnecessary filters
          if (currentTask === 'code-web') {
            filterOptions.langs = [];
            filterOptions.modalities = [];
            filterOptions.knowledge = [];
            filterOptions.reasoning = [];
            filterOptions.robustness = [];
            filterOptions.security = [];
            // Keep framework and datasets for code-web
          }
          
          // For mr-web, disable unnecessary filters except Task and Method
          if (currentTask === 'mr-web') {
            filterOptions.langs = [];
            filterOptions.modalities = [];
            filterOptions.robustness = [];
            filterOptions.security = [];
            filterOptions.framework = [];
            filterOptions.datasets = [];
            // Keep only knowledge (Task) and reasoning (Method) filtering for mr-web
          }
        }
        
        // Use setTimeout to allow the UI to update the loading state
        setTimeout(async () => {
          if (!isMounted) return;
          
          try {
            // Process data (this will handle data loading internally)
            const processedResults = await processResults(currentTask, filterOptions);
            
            if (processedResults.length > 0 && isMounted) {
              // Format results
              const formattedResults = formatResults(processedResults, filterOptions);
              
              if (formattedResults.length > 0 && isMounted) {
                setResults(formattedResults as any[]);
              } else {
                console.warn('No results after formatting');
                setResults([]);
              }
            } else {
              console.warn('No results after processing');
              setResults([]);
            }
          } catch (error) {
            console.error('Error processing data:', error);
            setResults([]);
          } finally {
            if (isMounted) {
              setIsLoading(false);
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error loading data:', error);
        if (isMounted) {
          setResults([]);
          setIsLoading(false);
        }
      }
    };
    
    loadAndProcessData();
    
    return () => {
      isMounted = false;
    };
  }, [currentTask, selectedAbilities, showByDifficulty]);

  // Handle sorting separately to avoid reloading data
  useEffect(() => {
    if (results.length === 0) return;
    setIsLoading(true);
    
    // Use requestAnimationFrame to delay sorting for UI responsiveness
    requestAnimationFrame(() => {
      setIsLoading(false);
    });
  }, [sortConfig]);

  // Define table headers helper function
  const tableHeadersHelper = (task: TaskType) => {
    // Task-specific header configurations
    const tableHeaders = {
      'overall': [
        { key: 'rank', label: 'Rank', width: 'w-32', description: '' },
        { key: 'model', label: 'Model Name', width: 'w-192', description: '' }
      ],
      'code generation': [
        { key: 'pass@1', label: 'Pass@1', width: 'w-36', description: 'Pass@1 is the probability of passing a given problem in one attempt.' },
        { key: 'pass@3', label: 'Pass@3', width: 'w-36', description: 'Pass@3 is the probability of passing a given problem in three attempts.' },
        { key: 'pass@5', label: 'Pass@5', width: 'w-36', description: 'Pass@5 is the probability of passing a given problem in five attempts.' }
      ],
      'code translation': [
        { key: 'pass@1', label: 'Pass@1', width: 'w-36', description: 'Pass@1 is the probability of passing a given problem in one attempt.' },
        { key: 'pass@3', label: 'Pass@3', width: 'w-36', description: 'Pass@3 is the probability of passing a given problem in three attempts.' },
        { key: 'pass@5', label: 'Pass@5', width: 'w-36', description: 'Pass@5 is the probability of passing a given problem in five attempts.' },
        { key: 'CodeBLEU', label: 'CodeBLEU', width: 'w-32', description: '' }
      ],
      'code summarization': [
        { key: 'llmjudge', label: 'LLM Judge', width: 'w-28', description: '' }
      ],
      'code review': [
        { key: 'llmjudge', label: 'LLM Judge', width: 'w-28', description: '' }
      ],
      'input prediction': [
        { key: 'pass@1', label: 'Pass@1', width: 'w-24', description: 'Pass@1 is the probability of passing a given problem in one attempt.' },
        { key: 'pass@3', label: 'Pass@3', width: 'w-24', description: 'Pass@3 is the probability of passing a given problem in three attempts.' },
        { key: 'pass@5', label: 'Pass@5', width: 'w-24', description: 'Pass@5 is the probability of passing a given problem in five attempts.' }
      ],
      'output prediction': [
        { key: 'pass@1', label: 'Pass@1', width: 'w-24', description: 'Pass@1 is the probability of passing a given problem in one attempt.' },
        { key: 'pass@3', label: 'Pass@3', width: 'w-24', description: 'Pass@3 is the probability of passing a given problem in three attempts.' },
        { key: 'pass@5', label: 'Pass@5', width: 'w-24', description: 'Pass@5 is the probability of passing a given problem in five attempts.' }
      ],
      'vulnerability detection': [
        { key: 'Accuracy', label: 'Accuracy', width: 'w-24', description: '' },
        { key: 'Precision', label: 'Precision', width: 'w-24', description: '' },
        { key: 'Recall', label: 'Recall', width: 'w-24', description: '' },
        { key: 'F1 Score', label: 'F1 Score', width: 'w-24', description: '' },
        { key: 'P-C', label: 'P-C', width: 'w-16', description: 'Correctly predicts both elements' },
        { key: 'P-V', label: 'P-V', width: 'w-16', description: 'Both predicted as vulnerable' },
        { key: 'P-B', label: 'P-B', width: 'w-16', description: 'Both predicted as benign' },
        { key: 'P-R', label: 'P-R', width: 'w-16', description: 'Inversely predicted labels' }
      ],
      'code-web': [
        { key: 'CLIP', label: 'CLIP', width: 'w-24', description: 'CLIP score for image similarity' },
        { key: 'Compilation', label: 'Compilation', width: 'w-28', description: 'Code compilation success rate' }
      ],
      'interaction-2-code': [
        { key: 'CLIP', label: 'CLIP', width: 'w-24', description: 'CLIP score for image similarity' },
        { key: 'SSIM', label: 'SSIM', width: 'w-24', description: 'Structural similarity index' },
        { key: 'Text', label: 'Text', width: 'w-24', description: 'Text accuracy score' },
        { key: 'Position', label: 'Position', width: 'w-24', description: 'Position accuracy score' },
        { key: 'Implement Rate', label: 'Implement Rate', width: 'w-36', description: 'Implementation success rate' }
      ],
      'code-robustness': [
        { key: 'VAN', label: 'VAN', width: 'w-24', description: 'Variable Name robustness score' },
        { key: 'ALL', label: 'ALL', width: 'w-24', description: 'All transformations robustness score' },
        { key: 'MDC', label: 'MDC', width: 'w-24', description: 'Missing Docstring Comment robustness score' },
        { key: 'MPS', label: 'MPS', width: 'w-24', description: 'Missing Parameter Specification robustness score' },
        { key: 'MHC', label: 'MHC', width: 'w-26', description: 'Missing Header Comment robustness score' },
        { key: 'REN', label: 'REN', width: 'w-24', description: 'Renaming robustness score' },
        { key: 'RTF', label: 'RTF', width: 'w-24', description: 'Runtime Function robustness score' },
        { key: 'GBC', label: 'GBC', width: 'w-24', description: 'Global Block Comment robustness score' }
      ],
      'mr-web': [
        { key: 'MAE', label: 'MAE', width: 'w-24', description: 'Mean Absolute Error' },
        { key: 'NEMD', label: 'NEMD', width: 'w-24', description: 'Normalized Edit Distance' },
        { key: 'CLIP', label: 'CLIP', width: 'w-24', description: 'CLIP score for image similarity' },
        { key: 'RER', label: 'RER', width: 'w-24', description: 'Request Element Recognition' }
      ],
    };

    // Difficulty-specific header configurations
    const difficultyHeaders: Record<TaskType, any> = {
      'overall': [
        { key: 'easy_pass@1', label: 'Easy Pass@1', width: 'w-32', description: 'Easy Pass@1 on problems with easy difficulty.' },
        { key: 'medium_pass@1', label: 'Medium Pass@1', width: 'w-32', description: 'Medium Pass@1 on problems with medium difficulty.' },
        { key: 'hard_pass@1', label: 'Hard Pass@1', width: 'w-32', description: 'Hard Pass@1 on problems with hard difficulty.' },
        // ...more headers
      ],
      'code generation': [
        { key: 'easy_pass@1', label: 'Easy Pass@1', width: 'w-32', description: 'Easy Pass@1 on problems with easy difficulty.' },
        { key: 'medium_pass@1', label: 'Medium Pass@1', width: 'w-32', description: 'Medium Pass@1 on problems with medium difficulty.' },
        { key: 'hard_pass@1', label: 'Hard Pass@1', width: 'w-32', description: 'Hard Pass@1 on problems with hard difficulty.' },
        { key: 'easy_pass@3', label: 'Easy Pass@3', width: 'w-32', description: 'Easy Pass@3 on problems with easy difficulty.' },
        { key: 'medium_pass@3', label: 'Medium Pass@3', width: 'w-32', description: 'Medium Pass@3 on problems with medium difficulty.' },
        { key: 'hard_pass@3', label: 'Hard Pass@3', width: 'w-32', description: 'Hard Pass@3 on problems with hard difficulty.' },
        { key: 'easy_pass@5', label: 'Easy Pass@5', width: 'w-32', description: 'Easy Pass@5 on problems with easy difficulty.' },
        { key: 'medium_pass@5', label: 'Medium Pass@5', width: 'w-32', description: 'Medium Pass@5 on problems with medium difficulty.' },
        { key: 'hard_pass@5', label: 'Hard Pass@5', width: 'w-32', description: 'Hard Pass@5 on problems with hard difficulty.' }
      ],
      'code translation': [
        { key: 'easy_pass@1', label: 'Easy Pass@1', width: 'w-32', description: 'Easy Pass@1 on problems with easy difficulty.' },
        { key: 'medium_pass@1', label: 'Medium Pass@1', width: 'w-32', description: 'Medium Pass@1 on problems with medium difficulty.' },
        { key: 'hard_pass@1', label: 'Hard Pass@1', width: 'w-32', description: 'Hard Pass@1 on problems with hard difficulty.' },
        { key: 'easy_pass@3', label: 'Easy Pass@3', width: 'w-32', description: 'Easy Pass@3 on problems with easy difficulty.' },
        { key: 'medium_pass@3', label: 'Medium Pass@3', width: 'w-32', description: 'Medium Pass@3 on problems with medium difficulty.' },
        { key: 'hard_pass@3', label: 'Hard Pass@3', width: 'w-32', description: 'Hard Pass@3 on problems with hard difficulty.' },
        { key: 'easy_pass@5', label: 'Easy Pass@5', width: 'w-32', description: 'Easy Pass@5 on problems with easy difficulty.' },
        { key: 'medium_pass@5', label: 'Medium Pass@5', width: 'w-32', description: 'Medium Pass@5 on problems with medium difficulty.' },
        { key: 'hard_pass@5', label: 'Hard Pass@5', width: 'w-32', description: 'Hard Pass@5 on problems with hard difficulty.' },
        { key: 'CodeBLEU', label: 'CodeBLEU', width: 'w-28', description: '' }
      ],
      'code summarization': [
        { key: 'llmjudge', label: 'LLM Judge', width: 'w-28', description: '' }
      ],
      'code review': [
        { key: 'llmjudge', label: 'LLM Judge', width: 'w-28', description: '' }
      ],
      'input prediction': [
        { key: 'easy_pass@1', label: 'Easy Pass@1', width: 'w-32', description: 'Easy Pass@1 on problems with easy difficulty.' },
        { key: 'medium_pass@1', label: 'Medium Pass@1', width: 'w-32', description: 'Medium Pass@1 on problems with medium difficulty.' },
        { key: 'hard_pass@1', label: 'Hard Pass@1', width: 'w-32', description: 'Hard Pass@1 on problems with hard difficulty.' },
        { key: 'easy_pass@3', label: 'Easy Pass@3', width: 'w-32', description: 'Easy Pass@3 on problems with easy difficulty.' },
        { key: 'medium_pass@3', label: 'Medium Pass@3', width: 'w-32', description: 'Medium Pass@3 on problems with medium difficulty.' },
        { key: 'hard_pass@3', label: 'Hard Pass@3', width: 'w-32', description: 'Hard Pass@3 on problems with hard difficulty.' },
        { key: 'easy_pass@5', label: 'Easy Pass@5', width: 'w-32', description: 'Easy Pass@5 on problems with easy difficulty.' },
        { key: 'medium_pass@5', label: 'Medium Pass@5', width: 'w-32', description: 'Medium Pass@5 on problems with medium difficulty.' },
        { key: 'hard_pass@5', label: 'Hard Pass@5', width: 'w-32', description: 'Hard Pass@5 on problems with hard difficulty.' }
      ],
      'output prediction': [
        { key: 'easy_pass@1', label: 'Easy Pass@1', width: 'w-32', description: 'Easy Pass@1 on problems with easy difficulty.' },
        { key: 'medium_pass@1', label: 'Medium Pass@1', width: 'w-32', description: 'Medium Pass@1 on problems with medium difficulty.' },
        { key: 'hard_pass@1', label: 'Hard Pass@1', width: 'w-32', description: 'Hard Pass@1 on problems with hard difficulty.' },
        { key: 'easy_pass@3', label: 'Easy Pass@3', width: 'w-32', description: 'Easy Pass@3 on problems with easy difficulty.' },
        { key: 'medium_pass@3', label: 'Medium Pass@3', width: 'w-32', description: 'Medium Pass@3 on problems with medium difficulty.' },
        { key: 'hard_pass@3', label: 'Hard Pass@3', width: 'w-32', description: 'Hard Pass@3 on problems with hard difficulty.' },
        { key: 'easy_pass@5', label: 'Easy Pass@5', width: 'w-32', description: 'Easy Pass@5 on problems with easy difficulty.' },
        { key: 'medium_pass@5', label: 'Medium Pass@5', width: 'w-32', description: 'Medium Pass@5 on problems with medium difficulty.' },
        { key: 'hard_pass@5', label: 'Hard Pass@5', width: 'w-32', description: 'Hard Pass@5 on problems with hard difficulty.' }
      ],
      'vulnerability detection': [
        { key: 'Accuracy', label: 'Accuracy', width: 'w-24', description: '' },
        { key: 'Precision', label: 'Precision', width: 'w-24', description: '' },
        { key: 'Recall', label: 'Recall', width: 'w-24', description: '' },
        { key: 'F1 Score', label: 'F1 Score', width: 'w-24', description: '' },
        { key: 'P-C', label: 'P-C', width: 'w-16', description: 'Correctly predicts both elements' },
        { key: 'P-V', label: 'P-V', width: 'w-16', description: 'Both predicted as vulnerable' },
        { key: 'P-B', label: 'P-B', width: 'w-16', description: 'Both predicted as benign' },
        { key: 'P-R', label: 'P-R', width: 'w-16', description: 'Inversely predicted labels' }
      ],
      'code-web': [
        { key: 'CLIP', label: 'CLIP', width: 'w-24', description: 'CLIP score for image similarity' },
        { key: 'Compilation', label: 'Compilation', width: 'w-28', description: 'Code compilation success rate' }
      ],
      'interaction-2-code': [
        { key: 'CLIP', label: 'CLIP', width: 'w-24', description: 'CLIP score for image similarity' },
        { key: 'SSIM', label: 'SSIM', width: 'w-24', description: 'Structural similarity index' },
        { key: 'Text', label: 'Text', width: 'w-24', description: 'Text accuracy score' },
        { key: 'Position', label: 'Position', width: 'w-24', description: 'Position accuracy score' },
        { key: 'Implement Rate', label: 'Implement Rate', width: 'w-36', description: 'Implementation success rate' }
      ],
      'code-robustness': [
        { key: 'VAN', label: 'VAN', width: 'w-24', description: 'Variable Name robustness score' },
        { key: 'ALL', label: 'ALL', width: 'w-24', description: 'All transformations robustness score' },
        { key: 'MDC', label: 'MDC', width: 'w-24', description: 'Missing Docstring Comment robustness score' },
        { key: 'MPS', label: 'MPS', width: 'w-24', description: 'Missing Parameter Specification robustness score' },
        { key: 'MHC', label: 'MHC', width: 'w-24', description: 'Missing Header Comment robustness score' },
        { key: 'REN', label: 'REN', width: 'w-24', description: 'Renaming robustness score' },
        { key: 'RTF', label: 'RTF', width: 'w-24', description: 'Runtime Function robustness score' },
        { key: 'GBC', label: 'GBC', width: 'w-24', description: 'Global Block Comment robustness score' }
      ],
      'mr-web': [
        { key: 'MAE', label: 'MAE', width: 'w-24', description: 'Mean Absolute Error' },
        { key: 'NEMD', label: 'NEMD', width: 'w-24', description: 'Normalized Edit Distance' },
        { key: 'CLIP', label: 'CLIP', width: 'w-24', description: 'CLIP score for image similarity' },
        { key: 'RER', label: 'RER', width: 'w-24', description: 'Request Element Recognition' }
      ]
    };

    const commonHeaders = [
      { key: 'rank', label: 'Rank', width: 'w-28', description: '' },
      { key: 'model', label: 'Model Name', width: 'w-48', description: '' },
    ];

    // If showing by difficulty, use difficulty-specific headers
    if (showByDifficulty) {
      return [...commonHeaders, ...(difficultyHeaders[task] || [])];
    }

    // For overall task, return only the overall headers without adding common headers
    if (task === 'overall') {
      return tableHeaders[task];
    }

    // Otherwise, use standard headers
    return [...commonHeaders, ...(tableHeaders[task] || [])];
  };

  // Memoize the getTableHeaders function
  const getTableHeaders = useCallback((task: TaskType) => tableHeadersHelper(task), [showByDifficulty]);

  // Function to filter out headers that have no data in their columns
  const getFilteredTableHeaders = useCallback((task: TaskType) => {
    const allHeaders = tableHeadersHelper(task);
    
    // Keep rank and model headers
    const fixedHeaders = allHeaders.filter(header => header.key === 'rank' || header.key === 'model');
    
    // Filter metric headers based on data availability
    const metricHeaders = allHeaders.filter(header => header.key !== 'rank' && header.key !== 'model');
    
    // Only keep headers where at least one result has a non-empty value
    const filteredMetricHeaders = metricHeaders.filter(header => {
      return sortedResults.some(result => {
        const value = result[header.key];
        return value !== null && value !== undefined && value !== '-' && value !== '';
      });
    });
    
    return [...fixedHeaders, ...filteredMetricHeaders];
  }, [tableHeadersHelper, sortedResults]);

  // Function to initialize column widths with all headers (first pass)
  const initializeColumnWidths = useCallback(() => {
    const newWidths: Record<string, number> = {};
    const headers = getTableHeaders(currentTask);
    
    headers.forEach(header => {
      if (header.key === 'rank') {
        newWidths[header.key] = 100;
      } 
      else if (header.key === 'model') {
        if (currentTask === 'code summarization' || currentTask === 'code review') {
          newWidths[header.key] = 250;
        } else if (currentTask === 'code generation') {
          newWidths[header.key] = 320;
        } else if (currentTask === 'vulnerability detection') {
          newWidths[header.key] = 350; // Wider width for vulnerability detection
        } else if (currentTask === 'code-web') {
          newWidths[header.key] = 360;
        } else if (currentTask === 'interaction-2-code') {
          newWidths[header.key] = 220; // Reduced width for interaction-2-code to make room for other columns
        } else if (currentTask === 'code-robustness') {
          newWidths[header.key] = 400; // Larger width for code-robustness since there's extra space
        } else {
          newWidths[header.key] = 300;
        }
      }
      else if (header.key === 'llmjudge') {
        if (currentTask === 'code summarization' || currentTask === 'code review') {
          newWidths[header.key] = 370;
        } else {
          newWidths[header.key] = 160;
        }
      }
      else if (header.key.indexOf('easy_') === 0 || header.key.indexOf('medium_') === 0 || header.key.indexOf('hard_') === 0) {
        newWidths[header.key] = 140;
      }
      else if (['pass@1', 'pass@3', 'pass@5'].includes(header.key)) {
        newWidths[header.key] = 110;
      }
      else if (['CodeBLEU'].includes(header.key)) {
        newWidths[header.key] = 140;
      }
      else if (['Accuracy', 'Precision', 'Recall', 'F1 Score'].includes(header.key)) {
        newWidths[header.key] = 145;
      }
      else if (['P-C', 'P-V', 'P-B', 'P-R'].includes(header.key)) {
        newWidths[header.key] = 90;
      }
      else if (['CLIP', 'SSIM', 'Text', 'VAN', 'REN', 'RTF', 'GBC', 'ALL', 'MDC', 'MPS', 'MHC'].includes(header.key)) {
        newWidths[header.key] = 110;
      }
      else if (header.key === 'Compilation') {
        newWidths[header.key] = 200; // Wider for code-web compilation column to avoid truncation
      }
      else if (header.key === 'Implement Rate') {
        newWidths[header.key] = 230;
      }
      else if (['Position'].includes(header.key)) {
        newWidths[header.key] = 150; // Wider for interaction-2-code position and implement rate columns
      }
      else {
        newWidths[header.key] = Math.max(100, header.label.length * 12 + 40);
      }
    });
    
    setColumnWidths(newWidths);
  }, [currentTask, getTableHeaders]);

  // Initialize column widths when task changes (first pass with all headers)
  useEffect(() => {
    initializeColumnWidths();
  }, [currentTask, initializeColumnWidths]);

  // Listen for task change events from PaperCitationModal
  useEffect(() => {
    const handleTaskChangeEvent = (event: CustomEvent) => {
      const { task } = event.detail;
      if (task && Object.keys(taskAbilities).includes(task)) {
        const allTasks = Object.keys(taskAbilities);
        const taskIndex = allTasks.indexOf(task);
        const newPage = Math.floor(taskIndex / TASKS_PER_PAGE);
        
        // Update task page if necessary
        if (newPage !== currentTaskPage) {
          setCurrentTaskPage(newPage);
        }
        
        // Change to the specified task
        handleTaskChange(task as TaskType);
      }
    };

    window.addEventListener('changeLeaderboardTask', handleTaskChangeEvent as EventListener);
    
    return () => {
      window.removeEventListener('changeLeaderboardTask', handleTaskChangeEvent as EventListener);
    };
  }, [taskAbilities, currentTaskPage, handleTaskChange]);
  
  // Update column widths when filtered headers are available
  useEffect(() => {
    if (sortedResults.length === 0) return;
    
    const newWidths: Record<string, number> = {};
    const filteredHeaders = getFilteredTableHeaders(currentTask);
    const filteredHeaderKeys = new Set(filteredHeaders.map(h => h.key));
    
    // Only initialize widths for filtered headers
    filteredHeaders.forEach(header => {
      // If we already have a width for this header, use it
      if (columnWidths[header.key]) {
        newWidths[header.key] = columnWidths[header.key];
      } 
      // Otherwise calculate a new width
      else {
        if (header.key === 'rank') {
          newWidths[header.key] = 100;
        } 
        else if (header.key === 'model') {
          if (currentTask === 'code summarization' || currentTask === 'code review') {
            newWidths[header.key] = 250;
          } else if (currentTask === 'code generation') {
            newWidths[header.key] = 320;
          } else if (currentTask === 'vulnerability detection') {
            newWidths[header.key] = 350; // Wider width for vulnerability detection
          } else if (currentTask === 'code-web') {
            newWidths[header.key] = 360;
          } else if (currentTask === 'interaction-2-code') {
            newWidths[header.key] = 220; // Reduced width for interaction-2-code to make room for other columns
          } else if (currentTask === 'code-robustness') {
            newWidths[header.key] = 400; // Larger width for code-robustness since there's extra space
          } else if (currentTask === 'mr-web') {
            newWidths[header.key] = 300; // Standard width for mr-web
          } else {
            newWidths[header.key] = 300;
          }
        }
        else if (header.key === 'llmjudge') {
          if (currentTask === 'code summarization' || currentTask === 'code review') {
            newWidths[header.key] = 370;
          } else {
            newWidths[header.key] = 160;
          }
        }
        else if (header.key.indexOf('easy_') === 0 || header.key.indexOf('medium_') === 0 || header.key.indexOf('hard_') === 0) {
          newWidths[header.key] = 140;
        }
        else if (['pass@1', 'pass@3', 'pass@5'].includes(header.key)) {
          newWidths[header.key] = 110;
        }
        else if (['CodeBLEU'].includes(header.key)) {
          newWidths[header.key] = 140;
        }
        else if (['Accuracy', 'Precision', 'Recall', 'F1 Score'].includes(header.key)) {
          newWidths[header.key] = 145;
        }
        else if (['P-C', 'P-V', 'P-B', 'P-R'].includes(header.key)) {
          newWidths[header.key] = 90;
        }
        else if (['CLIP', 'SSIM', 'Text', 'VAN', 'REN', 'RTF', 'GBC', 'ALL', 'MDC', 'MPS', 'MHC', 'MAE', 'NEMD', 'RER'].includes(header.key)) {
          newWidths[header.key] = 110;
        }
        else if (header.key === 'Compilation') {
          newWidths[header.key] = 180; // Wider for code-web compilation column to avoid truncation
        }
        else if (header.key === 'Implement Rate') {
          newWidths[header.key] = 230;
        }
        else if (['Position'].includes(header.key)) {
          newWidths[header.key] = 150; // Wider for interaction-2-code position and implement rate columns
        }
        else {
          newWidths[header.key] = Math.max(100, header.label.length * 12 + 40);
        }
      }
    });
    
    // Only update if widths actually change (removed columnWidths from comparison to prevent resize reset)
    if (Object.keys(newWidths).length !== Object.keys(columnWidths).length || 
        Object.keys(columnWidths).some(key => !filteredHeaderKeys.has(key))) {
      setColumnWidths(newWidths);
    }
  }, [currentTask, sortedResults, getFilteredTableHeaders]); // Removed columnWidths dependency to prevent resize reset

  // Helper function to get minimum column width
  const getMinColumnWidth = useCallback((key: string): number => {
    let minWidth = 40;
    
    if (key === 'model') {
      if (currentTask === 'overall') {
        minWidth = 800;
      } else if (currentTask === 'code-web') {
        minWidth = 320; // Set higher minimum width for code-web to prevent truncation issues
      } else {
        minWidth = 300;
      }
    } else if (key === 'rank') {
      minWidth = 60;
    } else if (key.includes('pass') || key.includes('Pass')) {
      if (key.indexOf('easy_') === 0 || key.indexOf('medium_') === 0 || key.indexOf('hard_') === 0) {
        minWidth = 130;
      } else {
        minWidth = 80;
      }
    } else if (key === 'llmjudge' || key === 'LLMJudge') {
      minWidth = 100;
    } else if (key === 'CodeBLEU') {
      minWidth = 90;
    } else if (['Accuracy', 'Precision', 'Recall', 'F1 Score'].includes(key)) {
      minWidth = 80;
    } else if (['P-C', 'P-V', 'P-B', 'P-R'].includes(key)) {
      minWidth = 60;
    } else {
      const header = getTableHeaders(currentTask).find(h => h.key === key);
      minWidth = header?.label.length ? header.label.length * 8 + 24 : 80;
    }
    
    return minWidth;
  }, [currentTask, getTableHeaders]);

  // Handle column resize start
  const handleResizeStart = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    setResizingColumn(key);
    
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('select-none');

    // Create resize indicator
    const resizeIndicator = document.createElement('div');
    resizeIndicator.id = 'column-resize-indicator';
    resizeIndicator.style.position = 'absolute';
    resizeIndicator.style.top = '0';
    resizeIndicator.style.bottom = '0';
    resizeIndicator.style.width = '2px';
    resizeIndicator.style.backgroundColor = isDarkMode ? 'rgba(200, 200, 200, 0.7)' : 'rgba(20, 20, 20, 0.7)';
    resizeIndicator.style.left = `${e.currentTarget.getBoundingClientRect().right}px`;
    resizeIndicator.style.zIndex = '50';
    document.body.appendChild(resizeIndicator);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      
      if (resizeIndicator) {
        resizeIndicator.style.left = `${moveEvent.clientX}px`;
      }
      
      setColumnWidths(prev => {
        // Calculate new width
        const newWidth = prev[key] + moveEvent.movementX;
        
        // Get minimum width
        const minWidth = getMinColumnWidth(key);
        
        return {
          ...prev,
          [key]: Math.max(minWidth, newWidth)
        };
      });
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      document.body.style.cursor = '';
      document.body.classList.remove('select-none');
      
      // Remove indicator
      const indicator = document.getElementById('column-resize-indicator');
      if (indicator) {
        indicator.remove();
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Define column alignment and styling helpers
  const isColumnCentered = useCallback((key: string) => {
    return key !== 'model';
  }, []);

  const getColumnAlignment = useCallback((key: string) => {
    if (key === 'model') {
      return 'text-left';
    } else {
      return 'text-center';
    }
  }, []);

  const getNumericStyles = useCallback((key: string) => {
    if (isColumnCentered(key)) {
      return 'tabular-nums lining-nums';
    }
    return '';
  }, [isColumnCentered]);

  // Compute available content width for a column
  const getContentWidth = useCallback((columnWidth: number) => {
    return Math.max(columnWidth - 40, 20);
  }, []);

  // Helper for sticky columns
  const getStickyStyles = useCallback((key: string) => {
    if (currentTask === 'overall' || currentTask === 'code summarization' || currentTask === 'code review' ||
        currentTask === 'code-web' || currentTask === 'interaction-2-code' || currentTask === 'code-robustness' || currentTask === 'mr-web') {
      return '';
    }
    
    if (key === 'rank' || key === 'model') {
      return 'sticky left-0 z-10';
    }
    return '';
  }, [currentTask]);

  // Calculate left position for sticky columns
  const getStickyLeftPosition = useCallback((key: string) => {
    if (currentTask === 'overall' || currentTask === 'code summarization' || currentTask === 'code review' ||
        currentTask === 'code-web' || currentTask === 'interaction-2-code' || currentTask === 'code-robustness' || currentTask === 'mr-web') {
      return 'auto';
    }
    
    if (key === 'rank') {
      return '0px';
    } else if (key === 'model') {
      // Use fixed width for vulnerability detection to ensure correct initial position
      if (currentTask === 'vulnerability detection') {
        return '100px'; // Fixed position for rank width in vulnerability detection
      }
      return `var(--rank-width, ${columnWidths['rank'] || 80}px)`;
    }
    return 'auto';
  }, [currentTask, columnWidths]);

  // Update CSS variable for rank width
  useEffect(() => {
    const updateRankWidth = () => {
      const rankHeader = document.querySelector('th[data-key="rank"]');
      if (rankHeader) {
        document.documentElement.style.setProperty('--rank-width', `${rankHeader.clientWidth}px`);
      }
    };

    updateRankWidth();
    window.addEventListener('resize', updateRankWidth);
    
    return () => {
      window.removeEventListener('resize', updateRankWidth);
    };
  }, [columnWidths]);

  // Helper for background colors
  const getBackgroundColor = useCallback((key: string, isHeaderCell: boolean = false) => {
    if ((key === 'rank' || key === 'model') && 
        !(currentTask === 'overall' || currentTask === 'code summarization' || currentTask === 'code review' ||
          currentTask === 'code-web' || currentTask === 'interaction-2-code' || currentTask === 'code-robustness' || currentTask === 'mr-web')) {
      if (isHeaderCell) {
        return isDarkMode ? 'bg-[#151d2a]' : 'bg-slate-50';
      } else {
        return isDarkMode ? 'bg-[#0f1729]' : 'bg-white';
      }
    }
    return '';
  }, [currentTask, isDarkMode]);

  // Helper for text truncation
  const truncateText = useCallback((text: string, maxWidth: number) => {
    if (!text) return '';
    
    const charWidth = 6;
    const maxChars = Math.floor(maxWidth / charWidth);
    
    if (text.length <= maxChars) return text;
    
    if (maxChars <= 7) return text.substring(0, maxChars);
    
    return text.substring(0, maxChars - 2) + '...';
  }, []);

  // Generate CSV data for export
  const csvData = useMemo(() => {
    if (!sortedResults.length) return {
      headers: [],
      data: []
    };
    
    const headers = getFilteredTableHeaders(currentTask).map(header => ({
      label: header.label,
      key: header.key
    }));
    
    const formattedData = sortedResults.map(result => {
      const csvRow: Record<string, string | number> = {};
      
      Object.entries(result).forEach(([key, value]) => {
        // Only include keys that are in the filtered headers
        if (headers.some(header => header.key === key)) {
          if (typeof value === 'number') {
            if (key === 'rank') {
              csvRow[key] = value;
            } else if ([
              'pass@1', 'pass@3', 'pass@5', 'CodeBLEU', 'Execution',
              'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
              'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
              'easy_pass@5', 'medium_pass@5', 'hard_pass@5',
              'Accuracy', 'Precision', 'Recall', 'F1 Score',
              'P-C', 'P-V', 'P-B', 'P-R'
            ].includes(key)) {
              csvRow[key] = (value * 100).toFixed(1);
            } else if (key === 'llmjudge' || key === 'LLMJudge') {
              csvRow[key] = ((value / 5) * 100).toFixed(1);
            } else {
              csvRow[key] = value;
            }
          } else if (value === '-' || value === undefined) {
            csvRow[key] = 'N/A';
          } else {
            csvRow[key] = value as string;
          }
        }
      });
      
      return csvRow;
    });
    
    return {
      headers,
      data: formattedData
    };
  }, [sortedResults, currentTask, getFilteredTableHeaders]);

  // CSV filename based on current task
  const csvFilename = useMemo(() => {
    const date = new Date().toISOString().split('T')[0];
    return `code-treat-${currentTask.replace(/\s+/g, '-')}-${date}.csv`;
  }, [currentTask]);
  
  // Column width helper
  const getTaskSpecificColumnWidth = useCallback((task: TaskType, key: string): string => {
    if (columnWidths[key]) {
      return `${columnWidths[key]}px`;
    }
    
    if (key === 'model') {
      if (task === 'code summarization' || task === 'code review') {
        return '250px';
      } else if (task === 'vulnerability detection') {
        return '350px';
      }
      return '300px';
    }
    
    if (key === 'rank') {
      return '80px';
    }
    
    if (key === 'llmjudge') {
      if (task === 'code summarization' || task === 'code review') {
        return '370px';
      }
      return '160px';
    }
    
    return '100px';
  }, [columnWidths]);

  return (
    <section id="evaluation" className="relative flex items-center pt-0">
      <div className="relative w-full max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-24 font-jetbrains-mono">
          Leaderboard
        </h1>

        {/* Task Selector */}
        <TaskSelector 
          currentTask={currentTask}
          currentTaskPage={currentTaskPage}
          handleTaskChange={handleTaskChange}
          handlePreviousPage={handlePreviousPage}
          handleNextPage={handleNextPage}
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          getCurrentPageTasks={getCurrentPageTasks}
          isDarkMode={isDarkMode}
        />

        {/* Filter Panel */}
        <FilterPanel 
          currentTask={currentTask}
          taskAbilities={taskAbilities}
          selectedAbilities={selectedAbilities}
          handleAbilityChange={handleAbilityChange}
          showByDifficulty={showByDifficulty}
          setShowByDifficulty={setShowByDifficulty}
          availableLLMJudges={availableLLMJudges}
          isDarkMode={isDarkMode}
        />

        {/* Results Table */}
        <ResultsTable 
          currentTask={currentTask}
          results={results}
          sortedResults={sortedResults}
          isLoading={isLoading}
          sortConfig={sortConfig}
          setIsComparisonModalOpen={setIsComparisonModalOpen}
          getTableHeaders={getFilteredTableHeaders}
          columnWidths={columnWidths}
          resizingColumn={resizingColumn}
          csvData={csvData}
          csvFilename={csvFilename}
          handleSort={handleSort}
          handleResizeStart={handleResizeStart}
          getContentWidth={getContentWidth}
          isColumnCentered={isColumnCentered}
          getStickyStyles={getStickyStyles}
          getStickyLeftPosition={getStickyLeftPosition}
          getBackgroundColor={getBackgroundColor}
          getColumnAlignment={getColumnAlignment}
          getNumericStyles={getNumericStyles}
          truncateText={truncateText}
          getTaskSpecificColumnWidth={getTaskSpecificColumnWidth}
          isDarkMode={isDarkMode}
        />

        {/* Comparison Modal */}
        <ModelComparisonModal 
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          results={sortedResults}
          isDarkMode={isDarkMode}
          currentTask={currentTask}
          selectedAbilities={selectedAbilities}
          showByDifficulty={showByDifficulty}
        />
      </div>
    </section>
  );
};

export default Leaderboard; 