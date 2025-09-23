import { FC, useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TaskType, Ability, ProcessedResult } from '@/lib/types';
import { FilterConfig, getAvailableFilters } from '@/lib/filterConfig';
import { getMultiLeaderboardConfig } from '@/lib/leaderboardConfig';
import { FilterState, getStyles, getButtonAnimation, createFilterClickHandler } from '@/lib/filterHelpers';
import { MODEL_PUBLISH_DATES } from '@/lib/constants';
import { TimelineSlider } from '@/app/components/ui/TimelineSlider';

// Simplified Filter Button Component
interface FilterButtonProps {
  filter: FilterConfig;
  value: string;
  currentTask: TaskType;
  showByDifficulty: boolean;
  selectedAbilities: Partial<Ability>;
  taskAbilities: Record<TaskType, Ability>;
  handleAbilityChange: (key: keyof Ability, value: string) => void;
  isDarkMode: boolean;
}

export const FilterButton: FC<FilterButtonProps> = ({
  filter,
  value,
  currentTask,
  showByDifficulty,
  selectedAbilities,
  taskAbilities,
  handleAbilityChange,
  isDarkMode
}) => {
  const filterState = new FilterState(filter, selectedAbilities, currentTask, showByDifficulty, taskAbilities);
  
  const isSelected = filterState.isSelected(value);
  const isDisabled = filterState.isDisabled(value);
  const isRestricted = filterState.isRestricted(value);
  const canInteract = filterState.canInteract(value);
  const displayText = filterState.getDisplayText(value);
  const tooltipText = isRestricted ? filterState.getTooltipText() : undefined;
  
  const handleClick = createFilterClickHandler(filterState, value, handleAbilityChange);

  return (
    <motion.button
      key={value}
      {...getButtonAnimation(canInteract)}
      onClick={handleClick}
      disabled={!canInteract}
      title={tooltipText}
      className={getStyles.filterButton(isSelected, isDisabled, isRestricted, isDarkMode)}
    >
      {displayText}
    </motion.button>
  );
};

// Simplified Filter Group Component
interface FilterGroupProps {
  filter: FilterConfig;
  currentTask: TaskType;
  showByDifficulty: boolean;
  selectedAbilities: Partial<Ability>;
  taskAbilities: Record<TaskType, Ability>;
  availableLLMJudges: string[];
  handleAbilityChange: (key: keyof Ability, value: string) => void;
  isDarkMode: boolean;
}

export const FilterGroup: FC<FilterGroupProps> = ({
  filter,
  currentTask,
  showByDifficulty,
  selectedAbilities,
  taskAbilities,
  availableLLMJudges,
  handleAbilityChange,
  isDarkMode
}) => {
  if (!filter.isVisible(currentTask, taskAbilities, availableLLMJudges)) {
    return null;
  }

  const values = filter.getValues(currentTask, taskAbilities, availableLLMJudges);
  const restriction = filter.specialBehaviors?.restrictions?.(currentTask);

  return (
    <div className="flex flex-col space-y-3 mb-2">
      <div className="flex flex-col space-y-1">
        <p className={getStyles.filterLabel(isDarkMode)}>
          {filter.label}
        </p>
        {restriction && (
          <p className={getStyles.restrictionMessage(isDarkMode)}>
            {restriction.message}
          </p>
        )}
      </div>
      <div className="inline-flex flex-wrap gap-2">
        {values.map((value) => (
          <FilterButton
            key={value}
            filter={filter}
            value={value}
            currentTask={currentTask}
            showByDifficulty={showByDifficulty}
            selectedAbilities={selectedAbilities}
            taskAbilities={taskAbilities}
            handleAbilityChange={handleAbilityChange}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </div>
  );
};

// Multi-select dropdown filter component
interface MultiSelectFilterProps {
  filter: FilterConfig;
  currentTask: TaskType;
  selectedAbilities: Partial<Ability>;
  taskAbilities: Record<TaskType, Ability>;
  availableLLMJudges: string[];
  handleAbilityChange: (key: keyof Ability, value: string) => void;
  isDarkMode: boolean;
}

export const MultiSelectFilter: FC<MultiSelectFilterProps> = ({
  filter,
  currentTask,
  selectedAbilities,
  taskAbilities,
  availableLLMJudges,
  handleAbilityChange,
  isDarkMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  if (!filter.isVisible(currentTask, taskAbilities, availableLLMJudges)) {
    return null;
  }

  const values = filter.getValues(currentTask, taskAbilities, availableLLMJudges);
  const selectedValues = selectedAbilities[filter.key as keyof Ability] || [];
  const selectedCount = Array.isArray(selectedValues) ? selectedValues.length : 0;
  
  const displayText = selectedCount === 0 
    ? `${filter.label}: ${values.join(' and ')}` // Show all options when none selected
    : selectedCount === 1 
      ? `${filter.label}: ${selectedValues[0]}` 
      : `${filter.label}: ${selectedCount} selected`;

  const handleToggle = (value: string) => {
    handleAbilityChange(filter.key as keyof Ability, value);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block w-full min-w-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full inline-flex items-center justify-between px-4 py-2 text-sm rounded-lg border transition-colors min-w-[180px] sm:min-w-[200px] md:min-w-[220px]
          ${isDarkMode 
            ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' 
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }
        `}
      >
        <span className="truncate mr-2 flex-1 text-left">{displayText}</span>
        <svg 
          className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`
          absolute z-50 mt-1 w-full min-w-[250px] sm:min-w-[280px] md:min-w-[300px] rounded-lg border shadow-lg
          ${isDarkMode 
            ? 'bg-slate-800 border-slate-600' 
            : 'bg-white border-slate-300'
          }
        `}>
          <div className="max-h-60 overflow-auto py-1">
            {values.map((value) => {
              const isSelected = Array.isArray(selectedValues) && selectedValues.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => handleToggle(value)}
                  className={`
                    w-full px-3 py-2 text-left text-sm transition-colors flex items-center
                    ${isSelected 
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-500 text-white'
                      : isDarkMode
                        ? 'text-slate-200 hover:bg-slate-700'
                        : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  <span className="truncate flex-1">{value}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Secondary Filters Bar Component (positioned below header tabs)
interface SecondaryFiltersBarProps {
  currentTask: TaskType;
  taskAbilities: Record<TaskType, Ability>;
  selectedAbilities: Partial<Ability>;
  availableLLMJudges: string[];
  handleAbilityChange: (key: keyof Ability, value: string) => void;
  isDarkMode: boolean;
}

export const SecondaryFiltersBar: FC<SecondaryFiltersBarProps> = ({
  currentTask,
  taskAbilities,
  selectedAbilities,
  availableLLMJudges,
  handleAbilityChange,
  isDarkMode
}) => {
  // Only show secondary filters for specific tasks that need them
  const tasksWithSecondaryFilters: TaskType[] = [
    'code generation',
    'code translation', 
    'input prediction',
    'output prediction'
  ];

  const shouldShowSecondaryFilters = tasksWithSecondaryFilters.includes(currentTask);

  if (!shouldShowSecondaryFilters) {
    return null;
  }

  // Get available filters, excluding the extracted filter for multi-leaderboard tasks
  const multiConfig = getMultiLeaderboardConfig(currentTask);
  const excludeFilter = multiConfig?.extractedFilter;
  const availableFilters = getAvailableFilters(
    currentTask, 
    taskAbilities, 
    availableLLMJudges, 
    excludeFilter
  );

  if (availableFilters.length === 0) {
    return null;
  }

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 py-4 border-b ${
      isDarkMode ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <span className={`text-sm font-medium flex-shrink-0 ${
          isDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          Filters:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 flex-1">
          {availableFilters.map((filter) => (
            <MultiSelectFilter
              key={filter.key}
              filter={filter}
              currentTask={currentTask}
              selectedAbilities={selectedAbilities}
              taskAbilities={taskAbilities}
              availableLLMJudges={availableLLMJudges}
              handleAbilityChange={handleAbilityChange}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Utility Components (unchanged functionality, simplified structure)
interface DifficultyToggleProps {
  currentTask: TaskType;
  showByDifficulty: boolean;
  setShowByDifficulty: (value: boolean) => void;
  isDarkMode: boolean;
}

export const DifficultyToggle: FC<DifficultyToggleProps> = ({
  showByDifficulty,
  setShowByDifficulty,
  isDarkMode
}) => (
  <div className="flex items-center">
    <input 
      type="checkbox" 
      id="show-difficulty"
      checked={showByDifficulty}
      onChange={() => setShowByDifficulty(!showByDifficulty)}
      className={getStyles.difficultyToggle(isDarkMode)} 
    />
    <label 
      htmlFor="show-difficulty"
      className={getStyles.difficultyLabel(isDarkMode)}
    >
      Show results by difficulty
    </label>
  </div>
);

interface DataNoteProps {
  currentTask: TaskType;
  isDarkMode: boolean;
}

export const DataNote: FC<DataNoteProps> = ({ currentTask, isDarkMode }) => {
  const noteText = currentTask === 'code-robustness'
    ? 'Denotes data is not tested since it is already tested in other fields.'
    : 'Denotes data is not yet available.';

  return (
    <div className={getStyles.dataNote(isDarkMode)}>
      <span className="font-mono">—</span>
      <span className="text-lg">{noteText}</span>
    </div>
  );
};

interface VulnerabilityMetricsProps {
  isDarkMode: boolean;
}

// Reusable Data Leakage Warning Component
interface DataLeakageWarningProps {
  taskType: TaskType;
  isDarkMode: boolean;
}

export const DataLeakageWarning: FC<DataLeakageWarningProps> = ({ taskType, isDarkMode }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Get formatted dataset release date for the task
  const getFormattedDatasetReleaseDate = (task: TaskType): string => {
    // Convert YYYY-MM-DD format to readable format
    const formatDate = (dateStr: string): string => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const dates: Record<TaskType, string> = {
      'vulnerability detection': '2024-03-27',
      'code generation': '2021-07-07',
      'code translation': '2024-10-24', // PolyHumanEval dataset release date
      'input prediction': '2021-07-07',
      'output prediction': '2021-07-07',
      'code summarization': '2023-12-01',
      'code review': '2023-12-01',
      'code-robustness': '2023-06-15',
      'multi-modality': '2024-09-15',
      'unit test generation': '2024-01-01',
      'overall': '2021-07-07'
    };
    
    const dateStr = dates[task];
    return dateStr ? formatDate(dateStr) : 'dataset release date';
  };

  const releaseDate = getFormattedDatasetReleaseDate(taskType);

  return (
    <div className={`mb-4 p-3 rounded-lg border transition-colors duration-200 ${
      isDarkMode 
        ? 'border-pink-800 bg-pink-900/20' 
        : 'border-pink-200 bg-pink-50'
    }`}>
      <div className="flex items-center gap-2 text-sm">
        <span className={`transition-colors duration-200 ${
          isDarkMode ? 'text-pink-300' : 'text-pink-700'
        }`}>
          Model in <span className="font-semibold text-pink-500">pink</span> means it has{' '}
          <span 
            className="relative cursor-help underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all duration-200"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            data leakage
            {showTooltip && (
              <div className={`absolute z-50 w-96 p-4 rounded-lg shadow-lg border text-sm leading-relaxed transition-all duration-200
                ${isDarkMode 
                  ? 'bg-slate-800 border-slate-600 text-slate-200' 
                  : 'bg-white border-gray-200 text-gray-700'
                } 
                bottom-full left-1/2 transform -translate-x-1/2 mb-2
                before:content-[''] before:absolute before:top-full before:left-1/2 before:transform before:-translate-x-1/2
                before:border-4 before:border-transparent
                ${isDarkMode 
                  ? 'before:border-t-slate-800' 
                  : 'before:border-t-white'
                }`}
              >
                <div className="font-semibold mb-3 text-base">Data Leakage Definition</div>
                <div className="space-y-2">
                  <p>
                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                    Data leakage occurs when a <strong>model's release time</strong> is later than the 
                    leaderboard dataset release time (<strong>{releaseDate}</strong>).
                  </p>
                  <p>
                    This means the model may have used the dataset for training, 
                    potentially inflating its performance scores and making comparisons unfair.
                  </p>
                </div>
              </div>
            )}
          </span>
          {' '}problem
        </span>
      </div>
    </div>
  );
};

export const VulnerabilityMetrics: FC<VulnerabilityMetricsProps> = ({ isDarkMode }) => {
  return (
    <div className={`mt-4 space-y-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
      {/* Metrics explanation */}
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
  );
};

interface CodeRobustnessMetricsProps {
  isDarkMode: boolean;
}

export const CodeRobustnessMetrics: FC<CodeRobustnessMetricsProps> = ({ isDarkMode }) => {
  return (
    <div className={`mt-4 space-y-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
      {/* Title */}
      <div className="text-center mb-4">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
          Code-Robustness Metrics
        </h3>
      </div>
      
      {/* Metrics explanation */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>PSC-ALL:</span>
            <span>Aggregated Program Structure-Consistent Perturbation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>MPS:</span>
            <span>Contextual-Level Misleading Print Statements</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>MCC:</span>
            <span>Contextual-Level Misleading Code Comments</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>MHC:</span>
            <span>Reasoning-Level Misleading Hint Comments</span>
          </div>
        </div>
      </div>
    </div>
  );
};


// Helper function to calculate task-specific date bounds with buffers
function calculateTaskSpecificDateBounds(results: ProcessedResult[]): { min: Date; max: Date } {
  if (!results || results.length === 0) {
    // Fallback dates if no results available
    return {
      min: new Date('2021-01-01'),
      max: new Date()
    };
  }

  // Get all model names from the results
  const modelNames = results.map(result => result.model).filter(Boolean) as string[];
  
  // Get publish dates for models that exist in the results
  const modelDates = modelNames
    .map(modelName => MODEL_PUBLISH_DATES[modelName])
    .filter(dateStr => dateStr)
    .map(dateStr => new Date(dateStr))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (modelDates.length === 0) {
    // Fallback dates if no model dates available
    return {
      min: new Date('2021-01-01'),
      max: new Date()
    };
  }

  const earliestDate = modelDates[0];
  const latestDate = modelDates[modelDates.length - 1];

  // Add 2-month buffer before earliest and after latest dates
  const twoMonthsInMs = 2 * 30 * 24 * 60 * 60 * 1000; // Approximate 2 months
  
  return {
    min: new Date(earliestDate.getTime() - twoMonthsInMs),
    max: new Date(latestDate.getTime() + twoMonthsInMs)
  };
}

// Timeline Filter Component
interface TimelineFilterProps {
  taskType: TaskType;
  isDarkMode: boolean;
  timelineRange: { start: Date; end: Date } | null;
  onTimelineChange: (startDate: Date, endDate: Date) => void;
  results?: ProcessedResult[]; // Add results prop for task-specific bounds
}

export const TimelineFilter: FC<TimelineFilterProps> = ({ 
  isDarkMode, 
  timelineRange, 
  onTimelineChange,
  results
}) => {
  // Calculate date bounds based on task-specific results with 2-month buffers
  const dateBounds = useMemo(() => {
    if (results && results.length > 0) {
      return calculateTaskSpecificDateBounds(results);
    }
    
    // Fallback to all model dates if no results provided
    const modelDates = Object.values(MODEL_PUBLISH_DATES)
      .map(dateStr => new Date(dateStr))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (modelDates.length === 0) {
      return {
        min: new Date('2021-01-01'),
        max: new Date()
      };
    }
    
    return {
      min: modelDates[0],
      max: modelDates[modelDates.length - 1]
    };
  }, [results]); // Recalculate when results change
  
  // Use the provided range or default to full range
  const currentStart = timelineRange?.start || dateBounds.min;
  const currentEnd = timelineRange?.end || dateBounds.max;
  
  return (
    <div className="mb-6">
      <TimelineSlider
        minDate={dateBounds.min}
        maxDate={dateBounds.max}
        startDate={currentStart}
        endDate={currentEnd}
        onDateRangeChange={onTimelineChange}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

interface OverallInfoProps {
  isDarkMode: boolean;
}

export const OverallInfo: FC<OverallInfoProps> = ({ isDarkMode }) => {
  const [showAverageDetails, setShowAverageDetails] = useState(false);
  const [showTasksDetails, setShowTasksDetails] = useState(false);

  return (
    <div className="w-full mb-3">
      <div className="flex items-center justify-center h-4">
        <p className={`${isDarkMode ? 'text-slate-200' : 'text-slate-700'} text-xl md:text-lg text-center leading-relaxed m-0`}>
          Showing overall results based on the{' '}
          <span 
            className="relative cursor-help underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all duration-200 font-semibold"
            onMouseEnter={() => setShowAverageDetails(true)}
            onMouseLeave={() => setShowAverageDetails(false)}
          >
            average
            {showAverageDetails && (
              <span className={`absolute z-[9999] w-80 p-3 rounded-lg shadow-lg border text-sm leading-relaxed transition-all duration-200 left-1/2 transform -translate-x-1/2 bottom-full mb-8
                ${isDarkMode 
                  ? 'bg-slate-800 border-slate-600 text-slate-200' 
                  : 'bg-white border-gray-300 text-gray-700'
                }`}
                style={{ left: '-280%', transform: 'translateX(-50%)' }}
              >
                <span className="font-semibold">Average calculation:</span> For each model, we compute the arithmetic mean of all their metric scores across the included tasks.
              </span>
            )}
          </span>
          {' '}of all available metrics across{' '}
          <span 
            className="relative cursor-help underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all duration-200 font-semibold"
            onMouseEnter={() => setShowTasksDetails(true)}
            onMouseLeave={() => setShowTasksDetails(false)}
          >
            tasks
            {showTasksDetails && (
              <span className={`absolute z-[9999] w-80 p-3 rounded-lg shadow-lg border text-sm leading-relaxed transition-all duration-200 left-1/2 transform -translate-x-1/2 bottom-full mb-8
                ${isDarkMode 
                  ? 'bg-slate-800 border-slate-600 text-slate-200' 
                  : 'bg-white border-gray-300 text-gray-700'
                }`}
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              >
                <span className="font-semibold">Included:</span> Code Generation, Code Translation, Code Summarization, Code Review, Input Prediction, Output Prediction, Vulnerability Detection.
              </span>
            )}
          </span>
          .
        </p>
      </div>
    </div>
  );
};

interface AdvancedFiltersToggleProps {
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (value: boolean) => void;
  isDarkMode: boolean;
}

export const AdvancedFiltersToggle: FC<AdvancedFiltersToggleProps> = ({
  showAdvancedFilters,
  setShowAdvancedFilters,
  isDarkMode
}) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>
      Advanced Filters
    </h2>
    <button
      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
      className={`p-2 rounded-lg transition-colors ${
        isDarkMode 
          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
      }`}
      aria-expanded={showAdvancedFilters}
      aria-label={showAdvancedFilters ? 'Collapse advanced filters' : 'Expand advanced filters'}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-6 w-6 transition-transform ${showAdvancedFilters ? 'rotate-180' : 'rotate-0'}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </div>
); 