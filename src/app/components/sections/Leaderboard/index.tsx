import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { FilterOptions, TaskType, Ability } from '@/lib/types';
import TaskSelector from './TaskSelector';
import FilterPanel from './FilterPanel';
import ResultsTable from './ResultsTable';
import ModelComparisonModal from '@/app/components/ui/ModelComparisonModal';
import { getAvailableLLMJudges as getSummarizationJudges } from '@/lib/tasks/codeSummarization';
import { getAvailableLLMJudges as getReviewJudges } from '@/lib/tasks/codeReview';

// Import new configuration system
import { 
  getTaskHeaders, 
  getMinColumnWidth, 
  TASKS_WITH_DIFFICULTY 
} from '@/lib/leaderboardConfig';
import {
  initializeColumnWidths,
  getFilteredTableHeaders,
  updateColumnWidthsForFilteredHeaders,
  isColumnCentered,
  getColumnAlignment,
  getNumericStyles,
  getContentWidth,
  getStickyStyles,
  getStickyLeftPosition,
  getBackgroundColor,
  truncateText,
  getTaskSpecificColumnWidth,
  getDefaultSortConfig,
  supportsShowByDifficulty,
  sortResults,
  handleSortChange
} from '@/lib/leaderboardHelpers';

interface LeaderboardProps {
  taskAbilities: Record<TaskType, Ability>;
  isDarkMode: boolean;
}

  const Leaderboard: FC<LeaderboardProps> = ({ taskAbilities, isDarkMode }) => {
  const [currentTask, setCurrentTask] = useState<TaskType>('overall');
  const [selectedAbilities, setSelectedAbilities] = useState<Partial<Ability>>({});
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataComplete, setIsDataComplete] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    getDefaultSortConfig('overall')
  );
  const [availableLLMJudges, setAvailableLLMJudges] = useState<string[]>([]);
  const [currentTaskPage, setCurrentTaskPage] = useState(0);
  const [showByDifficulty, setShowByDifficulty] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    // Initialize with default values immediately to prevent layout shift
    return initializeColumnWidths('overall');
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  
  const TASKS_PER_PAGE = 4;

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

  const handleNextPage = () => {
    if (hasNextPage()) {
      setCurrentTaskPage(currentTaskPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentTaskPage > 0) {
      setCurrentTaskPage(currentTaskPage - 1);
    }
  };

  const handleTaskChange = (task: TaskType) => {
    setCurrentTask(task);
      setSortConfig(getDefaultSortConfig(task));
    setSelectedAbilities({});
    
    // Reset showByDifficulty if task doesn't support it
    if (!supportsShowByDifficulty(task)) {
      setShowByDifficulty(false);
    }
  };

  const handleAbilityChange = (key: keyof Ability, value: string) => {
    setSelectedAbilities(prev => {
      const currentValues = prev[key] || [];
      
      // Ensure currentValues is always an array
      const currentArray = Array.isArray(currentValues) ? currentValues : [];
      
      // Toggle behavior: if value exists, remove it; if not, add it
      const newValues = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)  // Remove if exists
        : [...currentArray, value];              // Add if doesn't exist
      
      return {
        ...prev,
        [key]: newValues
      };
    });
  };

  // Load LLM judges for tasks that support them
  useEffect(() => {
    const loadLLMJudges = async () => {
        try {
          let judges: string[] = [];
        if ((currentTask === 'code summarization' || currentTask === 'code review') && results.length > 0) {
          if (currentTask === 'code summarization') {
            judges = getSummarizationJudges(results);
          } else if (currentTask === 'code review') {
            judges = getReviewJudges(results);
          }
        }
        setAvailableLLMJudges(judges);
        } catch (error) {
        console.error('Error loading LLM judges:', error);
        setAvailableLLMJudges([]);
      }
    };
    
    loadLLMJudges();
  }, [currentTask, results]);

  // Memoize sorted results using new sorting function
  const sortedResults = useMemo(() => {
    if (!results.length) return [];
    return sortResults(results, sortConfig);
  }, [results, sortConfig]);

  // Handle sorting using new helper
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => handleSortChange(prev, key));
  }, []);

  // Reset showByDifficulty when task changes to one that doesn't support it
  useEffect(() => {
    if (!supportsShowByDifficulty(currentTask)) {
      setShowByDifficulty(false);
    }
  }, [currentTask]);

  // Load and process data using precomputed results or overall aggregation
  useEffect(() => {
    const loadAndProcessData = async () => {
        setIsLoading(true);
      try {
        // Create filter options for precomputed results
        const filterOptions: FilterOptions = {
          tasks: [currentTask],
          datasets: selectedAbilities.dataset || [],
          langs: [],
          modalities: selectedAbilities.modality || [],
          knowledge: selectedAbilities.knowledge || [],
          reasoning: selectedAbilities.reasoning || [],
          robustness: selectedAbilities.robustness || [],
          security: selectedAbilities.privacy || [],
          llmJudges: selectedAbilities.llmJudges || [],
          framework: selectedAbilities.framework || [],
          showByDifficulty
        };

        console.log(`Loading data for task: ${currentTask}`, filterOptions);

        if (currentTask === 'overall') {
          // Special handling for overall leaderboard - aggregate from other tasks
          const { getPrecomputedResults } = await import('@/lib/dataLoader');
          
          // Get the list of tasks to aggregate (excluding overall itself)
          const tasksToAggregate: TaskType[] = [
            'code generation', 'code translation', 'code summarization', 'code review',
            'input prediction', 'output prediction', 'vulnerability detection',
            'code-web', 'interaction-2-code', 'code-robustness', 'mr-web'
          ];
          
          // Load results from all tasks
          const allTaskResults = await Promise.all(
            tasksToAggregate.map(async (task) => {
              try {
                const taskFilterOptions = { ...filterOptions, tasks: [task] };
                const results = await getPrecomputedResults(task, taskFilterOptions);
                return { task, results: results || [] };
              } catch (error) {
                console.warn(`Failed to load data for task ${task}:`, error);
                return { task, results: [] };
              }
            })
          );
          
          // Aggregate results by model
          const modelAggregates = new Map<string, { 
            model: string, 
            taskCount: number, 
            totalScore: number, 
            taskScores: Record<string, number> 
          }>();
          
          allTaskResults.forEach(({ task, results }) => {
            results.forEach((result: any) => {
              const modelName = result.model;
              if (!modelName) return;
              
              if (!modelAggregates.has(modelName)) {
                modelAggregates.set(modelName, {
                  model: modelName,
                  taskCount: 0,
                  totalScore: 0,
                  taskScores: {}
                });
              }
              
              const aggregate = modelAggregates.get(modelName)!;
              
              // Get primary metric for each task type
              let primaryScore = 0;
              if (task === 'code summarization' || task === 'code review') {
                primaryScore = parseFloat(result['LLM Judge']) || 0;
              } else if (task === 'vulnerability detection') {
                primaryScore = parseFloat(result['F1 Score']) || 0;
              } else if (task === 'code-web' || task === 'interaction-2-code') {
                primaryScore = parseFloat(result['CLIP']) || 0;
              } else if (task === 'code-robustness') {
                primaryScore = parseFloat(result['ALL']) || 0;
              } else if (task === 'mr-web') {
                primaryScore = parseFloat(result['CLIP']) || 0;
              } else {
                // For other tasks, use pass@1
                primaryScore = parseFloat(result['pass@1']) || 0;
              }
              
              if (primaryScore > 0) {
                aggregate.taskScores[task] = primaryScore;
                aggregate.taskCount++;
                aggregate.totalScore += primaryScore;
              }
                  });
                });
          
          // Calculate final rankings
          const overallResults = Array.from(modelAggregates.values())
            .filter(aggregate => aggregate.taskCount > 0)
            .map(aggregate => ({
              model: aggregate.model,
              averageScore: aggregate.totalScore / aggregate.taskCount,
              taskCount: aggregate.taskCount
            }))
            .sort((a, b) => b.averageScore - a.averageScore)
            .map((result, index) => ({
              rank: index + 1,
              model: result.model,
              score: result.averageScore.toFixed(1),
              tasks: result.taskCount
            }));
          
          console.log(`Generated overall leaderboard with ${overallResults.length} models`);
          setResults(overallResults);
          setIsDataComplete(true);
          setIsLoading(false);
              } else {
          // Use precomputed results for specific tasks
          const { getPrecomputedResults } = await import('@/lib/dataLoader');
          const results = await getPrecomputedResults(currentTask, filterOptions);
          
          if (!results || results.length === 0) {
            console.warn(`No precomputed results available for task: ${currentTask}`);
                setResults([]);
            setIsDataComplete(false);
            setIsLoading(false);
            return;
          }

          console.log(`Loaded ${results.length} results for ${currentTask}`);
          setResults(results);
          setIsDataComplete(true);
                  setIsLoading(false);
                }
      } catch (error) {
        console.error('Error loading data:', error);
          setResults([]);
        setIsDataComplete(false);
          setIsLoading(false);
      }
    };
    
    loadAndProcessData();
  }, [currentTask, selectedAbilities, showByDifficulty]);

  // Get filtered table headers using new helper
  const getFilteredTableHeadersMemo = useCallback((task: TaskType) => {
    return getFilteredTableHeaders(task, showByDifficulty, sortedResults);
  }, [showByDifficulty, sortedResults]);

  // Initialize column widths when task changes
  useEffect(() => {
    const newWidths = initializeColumnWidths(currentTask, showByDifficulty);
    setColumnWidths(newWidths);
  }, [currentTask, showByDifficulty]);

  // Update column widths when filtered headers change
  useEffect(() => {
    if (sortedResults.length === 0) return;
    
    const filteredHeaders = getFilteredTableHeadersMemo(currentTask);
    const newWidths = updateColumnWidthsForFilteredHeaders(
      currentTask,
      filteredHeaders,
      columnWidths
    );
    
    // Only update if widths actually change
    const filteredHeaderKeys = new Set(filteredHeaders.map(h => h.key));
    if (Object.keys(newWidths).length !== Object.keys(columnWidths).length || 
        Object.keys(columnWidths).some(key => !filteredHeaderKeys.has(key))) {
      setColumnWidths(newWidths);
    }
  }, [currentTask, sortedResults, getFilteredTableHeadersMemo, showByDifficulty]);

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
  
  // Helper function to get minimum column width using new config system
  const getMinColumnWidthHelper = useCallback((key: string): number => {
    return getMinColumnWidth(currentTask, key) || 80;
  }, [currentTask]);

  // Column resizing functionality
  const handleResizeStart = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    setResizingColumn(key);
    
    const startX = e.clientX;
    const startWidth = columnWidths[key] || 100;
    const minWidth = getMinColumnWidthHelper(key);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(minWidth, startWidth + deltaX);
      
      setColumnWidths(prev => ({
          ...prev,
        [key]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Generate CSV data
  const csvData = useMemo(() => {
    const headers = getFilteredTableHeadersMemo(currentTask);
    const csvHeaders = headers.map(header => ({
      label: header.label,
      key: header.key
    }));
    
    const csvDataRows = sortedResults.map(result => {
      const row: any = {};
      headers.forEach(header => {
        row[header.key] = result[header.key] || '';
      });
      return row;
    });
    
    return {
      headers: csvHeaders,
      data: csvDataRows
    };
  }, [currentTask, sortedResults, getFilteredTableHeadersMemo]);

  // Generate CSV filename
  const csvFilename = useMemo(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const taskName = currentTask.replace(/\s+/g, '_').toLowerCase();
    const difficultyStr = showByDifficulty ? '_by_difficulty' : '';
    return `${taskName}_leaderboard${difficultyStr}_${timestamp}.csv`;
  }, [currentTask, showByDifficulty]);

  return (
    <section id="evaluation" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
            CODE-TREAT Leaderboard
        </h1>
          <p className={`text-xl ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} max-w-3xl mx-auto leading-relaxed`}>
            Compare the performance of different language models across various code-related tasks. 
            Our comprehensive evaluation covers code generation, translation, summarization, and more.
          </p>
        </div>

        <TaskSelector 
          currentTask={currentTask}
          currentTaskPage={currentTaskPage}
          handleTaskChange={handleTaskChange}
          handlePreviousPage={handlePreviousPage}
          handleNextPage={handleNextPage}
          hasPreviousPage={() => currentTaskPage > 0}
          hasNextPage={() => hasNextPage()}
          getCurrentPageTasks={getCurrentPageTasks}
          isDarkMode={isDarkMode}
        />

        <FilterPanel 
          currentTask={currentTask}
          taskAbilities={taskAbilities}
          selectedAbilities={selectedAbilities}
          handleAbilityChange={handleAbilityChange}
          availableLLMJudges={availableLLMJudges}
          showByDifficulty={showByDifficulty}
          setShowByDifficulty={setShowByDifficulty}
          isDarkMode={isDarkMode}
        />

        <ResultsTable 
          currentTask={currentTask}
          results={results}
          sortedResults={sortedResults}
          isLoading={isLoading}
          sortConfig={sortConfig}
          setIsComparisonModalOpen={setIsComparisonModalOpen}
          getTableHeaders={getFilteredTableHeadersMemo}
          columnWidths={columnWidths}
          resizingColumn={resizingColumn}
          csvData={csvData}
          csvFilename={csvFilename}
          handleSort={handleSort}
          handleResizeStart={handleResizeStart}
          getContentWidth={getContentWidth}
          isColumnCentered={isColumnCentered}
          getStickyStyles={(key: string) => getStickyStyles(currentTask, key)}
          getStickyLeftPosition={(key: string) => getStickyLeftPosition(currentTask, key, columnWidths)}
          getBackgroundColor={(key: string, isHeaderCell?: boolean) => 
            getBackgroundColor(currentTask, key, isDarkMode, isHeaderCell)
          }
          getColumnAlignment={getColumnAlignment}
          getNumericStyles={getNumericStyles}
          truncateText={truncateText}
          getTaskSpecificColumnWidth={(task: TaskType, key: string) => 
            getTaskSpecificColumnWidth(task, key)
          }
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