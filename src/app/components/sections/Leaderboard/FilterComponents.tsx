import { FC } from 'react';
import { motion } from 'framer-motion';
import { TaskType, Ability } from '@/lib/types';
import { FilterConfig } from '@/lib/filterConfig';
import { FilterState, getStyles, getButtonAnimation, createFilterClickHandler } from '@/lib/filterHelpers';

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

// Utility Components (unchanged functionality, simplified structure)
interface DifficultyToggleProps {
  currentTask: TaskType;
  showByDifficulty: boolean;
  setShowByDifficulty: (value: boolean) => void;
  isDarkMode: boolean;
}

export const DifficultyToggle: FC<DifficultyToggleProps> = ({
  currentTask,
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

export const VulnerabilityMetrics: FC<VulnerabilityMetricsProps> = ({ isDarkMode }) => (
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
);

interface OverallInfoProps {
  isDarkMode: boolean;
}

export const OverallInfo: FC<OverallInfoProps> = ({ isDarkMode }) => (
  <div className="text-xl text-center mb-4">
    <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
      Showing overall results based on the average of all available metrics across tasks.
    </p>
  </div>
);

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