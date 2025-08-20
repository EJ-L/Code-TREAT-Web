import React, { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { FilterOptions, TaskType, Ability } from '@/lib/types';
import { MODEL_PUBLISH_DATES, canonicalizeModelName, getBaseModelName } from '@/lib/constants';

import FilterPanel from './FilterPanel';
import ResultsTable from './ResultsTable';
import LeaderboardHeader from './LeaderboardHeader';
import { TimelineFilter } from './FilterComponents';
import ModelComparisonModal from '@/app/components/ui/ModelComparisonModal';
import { AnimatedResultsWrapper } from '@/app/components/ui/AnimatedResultsWrapper';
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
  sortResults,
  handleSortChange,
  getMaxColumnWidth
} from '@/lib/leaderboardHelpers';
import { debug } from '@/lib/debug';
import { filterConditions } from '@/lib/filterConfig';

interface LeaderboardProps {
  taskAbilities: Record<TaskType, Ability>;
  isDarkMode: boolean;
  initialTask?: TaskType;
}

  const Leaderboard: FC<LeaderboardProps> = ({ taskAbilities, isDarkMode, initialTask }) => {
  const [currentTask, setCurrentTask] = useState<TaskType>(initialTask || 'overall');
  const [timelineRange, setTimelineRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedAbilities, setSelectedAbilities] = useState<Partial<Ability>>({});
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataComplete, setIsDataComplete] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    getDefaultSortConfig(initialTask || 'overall')
  );
  const [availableLLMJudges, setAvailableLLMJudges] = useState<string[]>([]);
  const [showByDifficulty, setShowByDifficulty] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    // Initialize with default values immediately to prevent layout shift
    return initializeColumnWidths(initialTask || 'overall');
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'scatter'>('table');
  
  // Helper function to check if a task supports chart view
  const supportsChartView = useCallback((task: TaskType) => {
    return task !== 'overall';
  }, []);
  
  // Update currentTask when initialTask changes
  useEffect(() => {
    if (initialTask && initialTask !== currentTask) {
      setCurrentTask(initialTask);
      // Reset filters and settings when task changes
      setSelectedAbilities({});
      setSortConfig(getDefaultSortConfig(initialTask));
      
      // Reset showByDifficulty if task doesn't support it
      if (!filterConditions.shouldShowDifficultyToggle(initialTask)) {
        setShowByDifficulty(false);
      }
      
      // Reset viewMode to table if switching to a task that doesn't support chart view
      if (!supportsChartView(initialTask)) {
        setViewMode('table');
      }
      
      // Close comparison modal when task changes
      setIsComparisonModalOpen(false);
    }
  }, [initialTask, currentTask, supportsChartView]);
  
  // Callback for when column widths change to trigger scroll check
  const handleColumnWidthChange = useCallback(() => {
    // This will be handled by ResultsTable's internal effects
  }, []);
  


  const handleTaskChange = (task: TaskType) => {
    setCurrentTask(task);
    setSortConfig(getDefaultSortConfig(task));
    setSelectedAbilities({});
    
    // Reset showByDifficulty if task doesn't support it
    if (!filterConditions.shouldShowDifficultyToggle(task)) {
      setShowByDifficulty(false);
    }
    
    // Reset viewMode to table if switching to a task that doesn't support chart view
    if (!supportsChartView(task)) {
      setViewMode('table');
    }
    
    // Close comparison modal when task changes
    setIsComparisonModalOpen(false);
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

  // Handle timeline range changes
  const handleTimelineChange = useCallback((startDate: Date, endDate: Date) => {
    debug.leaderboard('Timeline changed:', { startDate, endDate });
    setTimelineRange({ start: startDate, end: endDate });
  }, []);

  // Reset timeline when task or difficulty mode changes
  useEffect(() => {
    setTimelineRange(null);
  }, [currentTask, showByDifficulty]);

  // Close comparison modal when task changes (additional safety net)
  useEffect(() => {
    setIsComparisonModalOpen(false);
  }, [currentTask]);

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
        debug.error('Error loading LLM judges:', error);
        setAvailableLLMJudges([]);
      }
    };
    
    loadLLMJudges();
  }, [currentTask, results]);

  // Memoize filtered and sorted results
  const sortedResults = useMemo(() => {
    if (!results.length) return [];
    
    // Apply timeline filtering first
    let filtered = results;
    if (timelineRange) {
      filtered = results.filter(result => {
        if (!result.model) return true; // Include if no model name
        const canonicalName = canonicalizeModelName(result.model);
        let modelReleaseDate = MODEL_PUBLISH_DATES[canonicalName] || MODEL_PUBLISH_DATES[result.model];
        
        // If no date found and model is CoT variant, try base model name
        if (!modelReleaseDate && result.model.includes('(CoT)')) {
          const baseName = getBaseModelName(result.model);
          const canonicalBaseName = canonicalizeModelName(baseName);
          modelReleaseDate = MODEL_PUBLISH_DATES[canonicalBaseName] || MODEL_PUBLISH_DATES[baseName];
        }
        
        if (!modelReleaseDate) return true; // Include if no release date available
        
        const releaseDate = new Date(modelReleaseDate);
        return releaseDate >= timelineRange.start && releaseDate <= timelineRange.end;
      });
      debug.leaderboard(`Timeline filtered: ${filtered.length}/${results.length} results`);
    }
    
    const sorted = sortResults(filtered, sortConfig);
    debug.leaderboard(`Sorted ${sorted.length} results. Sample sorted:`, sorted.slice(0, 3));
    return sorted;
  }, [results, sortConfig, timelineRange, currentTask]);

  // Handle sorting using new helper
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => handleSortChange(prev, key));
  }, []);

  // Reset showByDifficulty when task changes to one that doesn't support it
  useEffect(() => {
    if (!filterConditions.shouldShowDifficultyToggle(currentTask)) {
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
          datasets: (selectedAbilities.dataset && selectedAbilities.dataset.length > 0) ? selectedAbilities.dataset : [],
          langs: [],
          modalities: (selectedAbilities.modality && selectedAbilities.modality.length > 0) ? selectedAbilities.modality : [],
          knowledge: (selectedAbilities.knowledge && selectedAbilities.knowledge.length > 0) ? selectedAbilities.knowledge : [],
          reasoning: (selectedAbilities.reasoning && selectedAbilities.reasoning.length > 0) ? selectedAbilities.reasoning : [],
          robustness: (selectedAbilities.robustness && selectedAbilities.robustness.length > 0) ? selectedAbilities.robustness : [],
          security: (selectedAbilities.privacy && selectedAbilities.privacy.length > 0) ? selectedAbilities.privacy : [],
          llmJudges: (selectedAbilities.llmJudges && selectedAbilities.llmJudges.length > 0) ? selectedAbilities.llmJudges : undefined,
          framework: (selectedAbilities.framework && selectedAbilities.framework.length > 0) ? selectedAbilities.framework : [],
          showByDifficulty
        };

        debug.leaderboard(`Loading data for task: ${currentTask}`, filterOptions);

        if (currentTask === 'overall') {
          // Special handling for overall leaderboard - aggregate from other tasks
          const { getPrecomputedResults } = await import('@/lib/dataLoader');
          
          // Get the list of tasks to aggregate (excluding overall itself)
          const tasksToAggregate: TaskType[] = [
            'code generation', 'code translation', 'code summarization', 'code review',
            'input prediction', 'output prediction', 'vulnerability detection'
          ];
          
          // Load results from all tasks
          const allTaskResults = await Promise.all(
            tasksToAggregate.map(async (task) => {
              try {
                const taskFilterOptions = { ...filterOptions, tasks: [task] };
                let results = await getPrecomputedResults(task, taskFilterOptions);
                results = results || [];
                // Exclude Code Summarization Human Baseline from overall aggregation
                if (task === 'code summarization') {
                  results = results.filter((r: any) => r.model !== 'Code Summarization Human Baseline');
                }
                return { task, results };
              } catch (error) {
                debug.warn(`Failed to load data for task ${task}:`, error);
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
              const modelName = canonicalizeModelName(result.model);
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
          
          debug.leaderboard(`Generated overall leaderboard with ${overallResults.length} models`, overallResults.slice(0, 3));
          setResults(overallResults);
          setIsDataComplete(true);
          setIsLoading(false);
              } else {
          // Use precomputed results for specific tasks
          const { getPrecomputedResults } = await import('@/lib/dataLoader');
          const results = await getPrecomputedResults(currentTask, filterOptions);
          
          if (!results || results.length === 0) {
            debug.warn(`No precomputed results available for task: ${currentTask}`);
                setResults([]);
            setIsDataComplete(false);
            setIsLoading(false);
            return;
          }

          debug.leaderboard(`Loaded ${results.length} results for ${currentTask}`, results.slice(0, 3));
          debug.leaderboard(`Sample result object keys:`, results.length > 0 ? Object.keys(results[0]) : 'No results');
          setResults(results);
          setIsDataComplete(true);
                  setIsLoading(false);
                }
      } catch (error) {
        debug.error('Error loading data:', error);
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
        // Change to the specified task
        handleTaskChange(task as TaskType);
      }
    };

    window.addEventListener('changeLeaderboardTask', handleTaskChangeEvent as EventListener);
    
    return () => {
      window.removeEventListener('changeLeaderboardTask', handleTaskChangeEvent as EventListener);
    };
  }, [taskAbilities, handleTaskChange]);
  
  // Helper function to get minimum column width using new config system
  const getMinColumnWidthHelper = useCallback((key: string): number => {
    return getMinColumnWidth(currentTask, key) || 80;
  }, [currentTask]);

  // Helper function to get maximum column width
  const getMaxColumnWidthHelper = useCallback((key: string): number => {
    return getMaxColumnWidth(currentTask, key) || 800;
  }, [currentTask]);

  // Column resizing functionality
  const handleResizeStart = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    setResizingColumn(key);
    
    const startX = e.clientX;
    const startWidth = columnWidths[key] || 100;
    const minWidth = getMinColumnWidthHelper(key);
    const maxWidth = getMaxColumnWidthHelper(key);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
      
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

  // Get available numeric metrics for scatter chart
  const availableMetrics = useMemo(() => {
    if (!results || !results.length) return [];
    
    const headers = getFilteredTableHeadersMemo(currentTask);
    return headers
      .filter(header => {
        // Skip non-numeric columns
        if (['rank', 'model', 'model_url', 'ability', 'task'].includes(header.key)) {
          return false;
        }
        
        // Check if this metric has numeric data in the results
        const hasNumericData = results.some(result => {
          const value = result[header.key];
          return value !== '-' && value !== undefined && !isNaN(Number(value));
        });
        
        return hasNumericData;
      })
      .map(header => header.key);
  }, [results, currentTask, getFilteredTableHeadersMemo]);

  // Check if chart view button should be shown
  const shouldShowChartButton = useMemo(() => {
    return supportsChartView(currentTask) && availableMetrics.length > 0 && results.length > 0;
  }, [currentTask, availableMetrics.length, results.length, supportsChartView]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: isDarkMode ? '#0f1729' : 'white', position: 'relative', zIndex: 1 }}>
        {/* Main Leaderboard Header - Always at top */}
        <LeaderboardHeader
          currentTask={currentTask}
          isDarkMode={isDarkMode}
          viewMode={viewMode}
          setViewMode={setViewMode}
          setIsComparisonModalOpen={setIsComparisonModalOpen}
          shouldShowChartButton={shouldShowChartButton}
          csvData={csvData}
          csvFilename={csvFilename}
        />

      <section className="py-4">
        <div className="container mx-auto px-4">

          <FilterPanel 
            currentTask={currentTask}
            taskAbilities={taskAbilities}
            selectedAbilities={selectedAbilities}
            handleAbilityChange={handleAbilityChange}
            availableLLMJudges={availableLLMJudges}
            showByDifficulty={showByDifficulty}
            setShowByDifficulty={setShowByDifficulty}
            isDarkMode={isDarkMode}
            timelineRange={timelineRange}
            onTimelineChange={handleTimelineChange}
          />

          {/* Timeline Filter - positioned between filter panel and table */}
          {filterConditions.shouldShowTimeline(currentTask) && (
            <div className="w-full max-w-7xl mx-auto mt-4 mb-4">
              <TimelineFilter 
                taskType={currentTask}
                isDarkMode={isDarkMode}
                timelineRange={timelineRange}
                onTimelineChange={handleTimelineChange}
              />
            </div>
          )}

          <AnimatedResultsWrapper
            timelineRange={timelineRange}
            currentTask={currentTask}
            resultCount={sortedResults.length}
          >
            <ResultsTable 
              currentTask={currentTask}
              results={results}
              sortedResults={sortedResults}
              isLoading={isLoading}
              sortConfig={sortConfig}
              getTableHeaders={getFilteredTableHeadersMemo}
              columnWidths={columnWidths}
              resizingColumn={resizingColumn}
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
              onColumnWidthChange={handleColumnWidthChange}
              timelineRange={timelineRange}
              onTimelineChange={handleTimelineChange}
              taskAbilities={taskAbilities}
              selectedAbilities={selectedAbilities}
              handleAbilityChange={handleAbilityChange}
              showByDifficulty={showByDifficulty}
              setShowByDifficulty={setShowByDifficulty}
              availableLLMJudges={availableLLMJudges}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </AnimatedResultsWrapper>

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
    </div>
  );
};

export default Leaderboard; 