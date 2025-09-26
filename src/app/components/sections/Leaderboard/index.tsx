import React, { FC, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FilterOptions, TaskType, Ability, ProcessedResult } from '@/lib/types';
import { MODEL_PUBLISH_DATES, getBaseModelName } from '@/lib/constants';

import FilterPanel from './FilterPanel';
import ResultsTable from './ResultsTable';
import LeaderboardHeader from './LeaderboardHeader';
import MultiLeaderboardHeader from './MultiLeaderboardHeader';
import CompactMultiLeaderboardHeader from './CompactMultiLeaderboardHeader';
import { ScatterChartRef } from '@/app/components/ui/ModelScatterChart';
import { TimelineFilter, SecondaryFiltersBar } from './FilterComponents';
import ModelComparisonModal from '@/app/components/ui/ModelComparisonModal';
import { AnimatedResultsWrapper } from '@/app/components/ui/AnimatedResultsWrapper';
import { getAvailableLLMJudges as getSummarizationJudges } from '@/lib/tasks/codeSummarization';
import { getAvailableLLMJudges as getReviewJudges } from '@/lib/tasks/codeReview';

// Import new configuration system
import { 
  getMinColumnWidth, 
  isMultiLeaderboardTask,
  getMultiLeaderboardConfig
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
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setIsDataComplete] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    getDefaultSortConfig(initialTask || 'overall')
  );
  const [availableLLMJudges, setAvailableLLMJudges] = useState<string[]>([]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    // Initialize with default values immediately to prevent layout shift
    return initializeColumnWidths(initialTask || 'overall');
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'scatter'>('table');
  
  // Multi-leaderboard state
  const [selectedMultiTab, setSelectedMultiTab] = useState<string>('All');
  
  // Chart export ref
  const chartExportRef = useRef<ScatterChartRef>(null);
  
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
      
      // Reset multi-leaderboard tab when task changes
      const config = getMultiLeaderboardConfig(initialTask);
      if (config) {
        setSelectedMultiTab(config.overallTab);
        
        // Special case: For code-robustness "All" tab, apply specialized filter on initial load
        if (initialTask === 'code-robustness' && config.overallTab === 'All') {
          setSelectedAbilities({
            dataset: ['Merge-HR+GFG']
          });
        }
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
  


  const handleTaskChange = useCallback((task: TaskType) => {
    setCurrentTask(task);
    setSortConfig(getDefaultSortConfig(task));
    setSelectedAbilities({});

    // Reset multi-leaderboard tab when task changes
    const config = getMultiLeaderboardConfig(task);
    if (config) {
      setSelectedMultiTab(config.overallTab);
      
      // Special case: For code-robustness "All" tab, apply specialized filter
      if (task === 'code-robustness' && config.overallTab === 'All') {
        setSelectedAbilities({
          dataset: ['Merge-HR+GFG']
        });
      }
    }
    
    // Reset viewMode to table if switching to a task that doesn't support chart view
    if (!supportsChartView(task)) {
      setViewMode('table');
    }
    
    // Close comparison modal when task changes
    setIsComparisonModalOpen(false);
  }, [supportsChartView]);

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

  // Reset timeline when task changes
  useEffect(() => {
    setTimelineRange(null);
  }, [currentTask]);

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
        let modelReleaseDate = MODEL_PUBLISH_DATES[result.model];
        
        // If no date found and model is CoT variant, try base model name
        if (!modelReleaseDate && result.model.includes('(CoT)')) {
          const baseName = getBaseModelName(result.model);
          modelReleaseDate = MODEL_PUBLISH_DATES[baseName];
        }
        
        if (!modelReleaseDate) return true; // Include if no release date available
        
        const releaseDate = new Date(modelReleaseDate);
        return releaseDate >= timelineRange.start && releaseDate <= timelineRange.end;
      });
      debug.leaderboard(`Timeline filtered: ${filtered.length}/${results.length} results`);
    }
    
    const sorted = sortResults(filtered, sortConfig);
    debug.leaderboard(`Sorted ${sorted.length} results. Sample sorted:`, sorted.slice(0, 3));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return sorted as any;
  }, [results, sortConfig, timelineRange]);

  // Handle sorting using new helper
  const handleSort = useCallback((key: string) => {
    // Special handling for rank column - sort by original rank values
    if (key === 'rank') {
      setSortConfig({ key: 'rank', direction: 'asc' });
    } else {
      setSortConfig(prev => handleSortChange(prev, key));
    }
  }, []);

  // Handle multi-leaderboard tab change
  const handleMultiTabChange = useCallback((tab: string) => {
    setSelectedMultiTab(tab);
    
    // Clear existing filters when switching tabs
    setSelectedAbilities({});
    
    // Apply tab-specific filtering
    if (tab !== 'All') {
      const config = getMultiLeaderboardConfig(currentTask);
      if (config) {
        const filterKey = config.extractedFilter;
        
        // Map the filter key to the correct ability field
        const abilityKey = filterKey as keyof Ability;
        
        // Special mapping for code-robustness: "Merge" tab should filter by "Merge-HR+GFG" dataset
        let filterValue = tab;
        if (currentTask === 'code-robustness' && tab === 'Merge') {
          filterValue = 'Merge-HR+GFG';
        }
        
        // No special mapping needed for multi-modality - tab names match dataset names exactly
        
        setSelectedAbilities({
          [abilityKey]: [filterValue]
        });
      }
    } else if (tab === 'All' && currentTask === 'code-robustness') {
      // Special case: For code-robustness "All" tab, show Merge-HR+GFG data
      setSelectedAbilities({
        dataset: ['Merge-HR+GFG']
      });
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
          robustness: (selectedAbilities.robustness && selectedAbilities.robustness.length > 0) ? selectedAbilities.robustness : [],
          security: (selectedAbilities.privacy && selectedAbilities.privacy.length > 0) ? selectedAbilities.privacy : [],
          llmJudges: (selectedAbilities.llmJudges && selectedAbilities.llmJudges.length > 0) ? selectedAbilities.llmJudges : undefined,
          framework: (selectedAbilities.framework && selectedAbilities.framework.length > 0) ? selectedAbilities.framework : [],
          showByDifficulty: false
        };

        debug.leaderboard(`Loading data for task: ${currentTask}`, filterOptions);

        if (currentTask === 'overall') {
          // Special handling for overall leaderboard - aggregate from other tasks
          const { getPrecomputedResults } = await import('@/lib/dataLoader');
          
          // Get the list of tasks to aggregate (excluding overall itself)
          const tasksToAggregate: TaskType[] = [
            'code generation', 'code translation', 'code summarization', 'code review',
            'input prediction', 'output prediction', 'vulnerability detection', 'unit test generation'
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
                  results = results.filter((r: ProcessedResult) => r.model !== 'Code Summarization Human Baseline');
                }
                return { task, results };
              } catch (error) {
                debug.warn(`Failed to load data for task ${task}:`, error);
                return { task, results: [] };
              }
            })
          );

          // Helper function to calculate combined Code Reasoning ranks
          const calculateCombinedCodeReasoningRanks = (allTaskResults: Array<{ task: string; results: ProcessedResult[] }>) => {
            const inputPredictionResults = allTaskResults.find(r => r.task === 'input prediction')?.results || [];
            const outputPredictionResults = allTaskResults.find(r => r.task === 'output prediction')?.results || [];
            
            // Get all models that have scores in either input or output prediction
            const allModels = new Set<string>();
            inputPredictionResults.forEach(r => r.model && allModels.add(r.model));
            outputPredictionResults.forEach(r => r.model && allModels.add(r.model));
            
            // Calculate combined scores for Code Reasoning
            const combinedScores: Array<{ model: string; score: number }> = [];
            allModels.forEach(model => {
              const inputResult = inputPredictionResults.find(r => r.model === model);
              const outputResult = outputPredictionResults.find(r => r.model === model);
              
              const validScores: number[] = [];
              
              // Extract pass@1 scores - use the same field access as the main scoring logic
              const inputScore = inputResult ? parseFloat(String(inputResult['pass@1'] || '0')) || 0 : 0;
              const outputScore = outputResult ? parseFloat(String(outputResult['pass@1'] || '0')) || 0 : 0;
              
              if (inputScore > 0) {
                validScores.push(inputScore);
              }
              if (outputScore > 0) {
                validScores.push(outputScore);
              }
              
              if (validScores.length > 0) {
                const avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;
                combinedScores.push({ model, score: avgScore });
              }
            });
            
            // Sort by combined score (descending) and assign ranks
            combinedScores.sort((a, b) => b.score - a.score);
            
            const combinedRanks: Record<string, number> = {};
            combinedScores.forEach((item, index) => {
              combinedRanks[item.model] = index + 1;
            });
            
            return combinedRanks;
          };

          // Calculate combined Code Reasoning ranks
          const codeReasoningRanks = calculateCombinedCodeReasoningRanks(allTaskResults);
          
          // Aggregate results by model
          const modelAggregates = new Map<string, { 
            model: string, 
            taskCount: number, 
            totalScore: number, 
            totalRank: number, // Added for average rank calculation
            taskScores: Record<string, number> 
          }>();
          
          // Define task groups for ranking calculation (7 groups instead of 8 individual tasks)
          const rankingTaskGroups = [
            'code generation',
            'code summarization',
            'code translation', 
            'code review',
            'code-reasoning', // Combined input/output prediction
            'unit test generation',
            'vulnerability detection'
          ];
          
          // Process each task separately to calculate ranks (for individual task data)
          allTaskResults.forEach(({ task, results }) => {
            // Skip empty results
            if (!results || results.length === 0) return;
            
            // Step 1: Extract scores for this task and map to models
            const taskScores: { model: string; score: number }[] = [];
            
            results.forEach((result: ProcessedResult) => {
              const modelName = result.modelName || result.model || null;
              if (!modelName) return;
              
              // Get primary metric for each task type (match script's TASK_PRIMARY_METRICS)
              let primaryScore = 0;
              if (task === 'code summarization' || task === 'code review') {
                primaryScore = parseFloat(String(result['LLM Judge'] || '0')) || 0;
              } else if (task === 'vulnerability detection') {
                primaryScore = parseFloat(String(result['Accuracy'] || '0')) || 0;
              } else if (task === 'unit test generation') {
                primaryScore = parseFloat(String(result['line_coverage'] || '0')) || 0;
              } else {
                // For code generation, code translation, input prediction, output prediction use pass@1
                primaryScore = parseFloat(String(result['pass@1'] || '0')) || 0;
              }
              
              if (primaryScore > 0) {
                taskScores.push({ model: modelName, score: primaryScore });
              }
            });
            
            // Step 2: Sort by score (descending) and assign ranks
            taskScores.sort((a, b) => b.score - a.score);
            const taskRanks: Record<string, number> = {};
            taskScores.forEach((item, index) => {
              taskRanks[item.model] = index + 1; // Rank starts at 1
            });
            
            // Step 3: Store task scores for later processing (don't aggregate ranks here yet)
            taskScores.forEach(({ model: modelName, score: primaryScore }) => {
              if (!modelAggregates.has(modelName)) {
                modelAggregates.set(modelName, {
                  model: modelName,
                  taskCount: 0,
                  totalScore: 0,
                  totalRank: 0,
                  taskScores: {}
                });
              }
              
              const aggregate = modelAggregates.get(modelName)!;
              aggregate.taskScores[task] = primaryScore;
            });
          });

          // Now calculate grouped ranking using the 7 task groups
          const taskRankMaps = new Map<string, Record<string, number>>();
          
          // Calculate ranks for individual tasks (but don't use these for aggregation)
          allTaskResults.forEach(({ task, results }) => {
            if (!results || results.length === 0) return;
            
            const taskScores: { model: string; score: number }[] = [];
            results.forEach((result: ProcessedResult) => {
              const modelName = result.model;
              if (!modelName) return; // Skip if model name is undefined
              
              let primaryScore = 0;
              
              // Get primary metric for each task type (match script's TASK_PRIMARY_METRICS)
              if (task === 'code summarization' || task === 'code review') {
                primaryScore = parseFloat(String(result['LLM Judge'] || '0')) || 0;
              } else if (task === 'vulnerability detection') {
                primaryScore = parseFloat(String(result['Accuracy'] || '0')) || 0;
              } else if (task === 'unit test generation') {
                primaryScore = parseFloat(String(result['line_coverage'] || '0')) || 0;
              } else {
                // For code generation, code translation, input prediction, output prediction use pass@1
                primaryScore = parseFloat(String(result['pass@1'] || '0')) || 0;
              }
              
              if (primaryScore > 0) {
                taskScores.push({ model: modelName, score: primaryScore });
              }
            });
            
            taskScores.sort((a, b) => b.score - a.score);
            const taskRanks: Record<string, number> = {};
            taskScores.forEach((item, index) => {
              taskRanks[item.model] = index + 1;
            });
            
            taskRankMaps.set(task, taskRanks);
          });

          // Now aggregate using the 7 grouped tasks
          Array.from(modelAggregates.keys()).forEach(modelName => {
            const aggregate = modelAggregates.get(modelName)!;
            
            // Calculate ranks using grouped tasks
            rankingTaskGroups.forEach(taskGroup => {
              let rankToAdd: number | null = null;
              let scoreToAdd: number | null = null;
              
              if (taskGroup === 'code-reasoning') {
                // Use combined Code Reasoning rank
                rankToAdd = codeReasoningRanks[modelName] || null;
                // Calculate combined score for display
                const inputScore = aggregate.taskScores['input prediction'];
                const outputScore = aggregate.taskScores['output prediction'];
                const validScores = [inputScore, outputScore].filter(s => s != null && s > 0);
                if (validScores.length > 0) {
                  scoreToAdd = validScores.reduce((a, b) => a + b, 0) / validScores.length;
                }
              } else {
                // Use individual task rank
                const taskRanks = taskRankMaps.get(taskGroup);
                rankToAdd = taskRanks ? taskRanks[modelName] : null;
                scoreToAdd = aggregate.taskScores[taskGroup];
              }
              
              if (rankToAdd !== null && scoreToAdd !== null) {
                aggregate.taskCount++;
                aggregate.totalScore += scoreToAdd;
                aggregate.totalRank += rankToAdd;
              }
            });
          });
          
          // Models to exclude from overall leaderboard (match script - no exclusions)
          const excludedModels: string[] = [];

          // Calculate final rankings using average rank (now based on 7 grouped tasks)
          // This matches the logic in generate-model-comparison-table-fixed.js
          const overallResults = Array.from(modelAggregates.values())
            .filter(aggregate => aggregate.taskCount > 0)
            .filter(aggregate => !excludedModels.includes(aggregate.model))
            .map(aggregate => ({
              model: aggregate.model,
              averageScore: aggregate.totalScore / aggregate.taskCount,
              averageRank: aggregate.totalRank / aggregate.taskCount,
              taskCount: aggregate.taskCount
            }))
            .sort((a, b) => a.averageRank - b.averageRank) // Sort by average rank (ascending)
            .map((result, index): ProcessedResult => ({
              modelId: result.model,
              modelName: result.model,
              model: result.model,
              rank: index + 1,
              dataset: 'Overall',
              task: 'overall',
              lang: 'Multiple',
              sourceLang: null,
              targetLang: null,
              pass1: null,
              pass3: null,
              pass5: null,
              easyPass1: null,
              mediumPass1: null,
              hardPass1: null,
              easyPass3: null,
              mediumPass3: null,
              hardPass3: null,
              easyPass5: null,
              mediumPass5: null,
              hardPass5: null,
              codebleu: null,
              llmjudge: null,
              executionAccuracy: null,
              difficulty: null,
              // Store both score and average rank in the dynamic properties
              score: result.averageScore.toFixed(1),
              avgRank: result.averageRank.toFixed(1),
              tasks: result.taskCount
            }));
          
          // Add debug logs to verify rank calculation
          debug.leaderboard(`Generated overall leaderboard with ${overallResults.length} models using average rank sorting`, overallResults.slice(0, 3));
          
          // Log a sample of models with their average ranks for verification
          const sampleModels = Array.from(modelAggregates.values())
            .filter(aggregate => aggregate.taskCount > 0)
            .filter(aggregate => !excludedModels.includes(aggregate.model))
            .slice(0, 5)
            .map(model => ({
              model: model.model,
              taskCount: model.taskCount,
              totalRank: model.totalRank,
              avgRank: model.totalRank / model.taskCount
            }));
          debug.leaderboard(`Sample model ranks (matches script logic):`, sampleModels);
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
          
          // Add specific debug for unit test generation
          if (currentTask === 'unit test generation') {
            console.log(`🔍 UNIT TEST DEBUG: Loaded ${results.length} results`);
            console.log(`🔍 UNIT TEST DEBUG: Filter options:`, filterOptions);
            console.log(`🔍 UNIT TEST DEBUG: Sample results:`, results.slice(0, 5));
          }
          
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
  }, [currentTask, selectedAbilities.dataset, selectedAbilities.modality, selectedAbilities.knowledge, selectedAbilities.robustness, selectedAbilities.privacy, selectedAbilities.llmJudges, selectedAbilities.framework]);

  // Get filtered table headers using new helper
  const getFilteredTableHeadersMemo = useCallback((task: TaskType) => {
    return getFilteredTableHeaders(task, false, sortedResults, { datasets: selectedAbilities.dataset });
  }, [sortedResults, selectedAbilities.dataset]);

  // Initialize column widths when task changes
  useEffect(() => {
    const newWidths = initializeColumnWidths(currentTask, false);
    setColumnWidths(newWidths);
  }, [currentTask]);

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
  }, [currentTask, sortedResults, getFilteredTableHeadersMemo, columnWidths]);

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
    
    let currentX = e.clientX;
    let currentWidth = columnWidths[key] || 100;
    const minWidth = getMinColumnWidthHelper(key);
    const maxWidth = getMaxColumnWidthHelper(key);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - currentX;
      const proposedWidth = currentWidth + deltaX;
      
      // Calculate the actual new width within bounds
      const newWidth = Math.min(maxWidth, Math.max(minWidth, proposedWidth));
      
      // Only update reference point if we're not at the boundary
      // This prevents the "dead zone" when dragging past min/max limits
      if (newWidth === proposedWidth) {
        // Width changed as expected, update reference points
        currentX = moveEvent.clientX;
        currentWidth = newWidth;
      }
      // If we hit a boundary (newWidth !== proposedWidth), keep current reference points
      // so that immediate reverse movement will be responsive
      
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
    
    const csvDataRows = sortedResults.map((result: ProcessedResult) => {
      const row: Record<string, string | number> = {};
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
    return `${taskName}_leaderboard_${timestamp}.csv`;
  }, [currentTask]);

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
          chartExportRef={chartExportRef}
        />

      <section>
        <div className="container mx-auto px-4">
          {/* Filter Panel with conditional spacing */}
          <div className={`${isMultiLeaderboardTask(currentTask) && viewMode === 'table' ? 'mt-8' : 'mt-8 mb-6'}`}>
            <FilterPanel 
              currentTask={currentTask}
              taskAbilities={taskAbilities}
              selectedAbilities={selectedAbilities}
              handleAbilityChange={handleAbilityChange}
              availableLLMJudges={availableLLMJudges}
              isDarkMode={isDarkMode}
              timelineRange={timelineRange}
              onTimelineChange={handleTimelineChange}
              isMultiLeaderboard={isMultiLeaderboardTask(currentTask) && viewMode === 'table'}
              selectedMultiTab={selectedMultiTab}
              results={results}
            />
          </div>

          {/* Timeline Filter - positioned between filter panel and table, hidden in chart view */}
          {filterConditions.shouldShowTimeline(currentTask) && viewMode === 'table' && (
            <div className={`w-full max-w-7xl mx-auto mt-6 ${
              isMultiLeaderboardTask(currentTask) ? 'mb-0' : 'mb-4'
            }`}>
              <TimelineFilter 
                taskType={currentTask}
                isDarkMode={isDarkMode}
                timelineRange={timelineRange}
                onTimelineChange={handleTimelineChange}
                results={results}
              />
            </div>
          )}
          
          <AnimatedResultsWrapper
            timelineRange={timelineRange}
            currentTask={currentTask}
          >
            <div className={isMultiLeaderboardTask(currentTask) && viewMode === 'table' ? 'w-full max-w-7xl mx-auto' : ''}>
              {/* Multi-leaderboard header - moved inside wrapper to eliminate spacing */}
              {isMultiLeaderboardTask(currentTask) && viewMode === 'table' && (
                <MultiLeaderboardHeader
                  currentTask={currentTask}
                  selectedTab={selectedMultiTab}
                  onTabChange={handleMultiTabChange}
                  isDarkMode={isDarkMode}
                />
              )}
              
              {/* Compact Multi-leaderboard header for chart view */}
              {isMultiLeaderboardTask(currentTask) && viewMode === 'scatter' && (
                <CompactMultiLeaderboardHeader
                  currentTask={currentTask}
                  selectedTab={selectedMultiTab}
                  onTabChange={handleMultiTabChange}
                  isDarkMode={isDarkMode}
                />
              )}
              
              {/* Secondary Filters Bar - positioned below header tabs, shown in both table and chart view */}
              <SecondaryFiltersBar
                currentTask={currentTask}
                taskAbilities={taskAbilities}
                selectedAbilities={selectedAbilities}
                availableLLMJudges={availableLLMJudges}
                handleAbilityChange={handleAbilityChange}
                isDarkMode={isDarkMode}
              />
              
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
              availableLLMJudges={availableLLMJudges}
              viewMode={viewMode}
              setViewMode={setViewMode}
              isMultiLeaderboard={isMultiLeaderboardTask(currentTask)}
              selectedMultiTab={selectedMultiTab}
              chartExportRef={chartExportRef}
            />
            </div>
          </AnimatedResultsWrapper>

          {/* Comparison Modal */}
          <ModelComparisonModal 
            isOpen={isComparisonModalOpen}
            onClose={() => setIsComparisonModalOpen(false)}
            results={sortedResults}
            isDarkMode={isDarkMode}
            currentTask={currentTask}
            selectedAbilities={selectedAbilities}
            availableMetrics={availableMetrics}
          />
        </div>
      </section>
    </div>
  );
};

export default Leaderboard; 