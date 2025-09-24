import { FC } from 'react';
import { TaskType, Ability } from '@/lib/types';
import { getAvailableFilters, filterConditions, FilterConfig } from '@/lib/filterConfig';
import { FilterState } from '@/lib/filterHelpers';
import MultiSelectDropdown from '@/app/components/ui/MultiSelectDropdown';

interface CompactFilterBarProps {
  currentTask: TaskType;
  taskAbilities: Record<TaskType, Ability>;
  selectedAbilities: Partial<Ability>;
  handleAbilityChange: (key: keyof Ability, value: string) => void;
  availableLLMJudges: string[];
  isDarkMode: boolean;
  showByDifficulty: boolean;
  setShowByDifficulty: (value: boolean) => void;
}

const CompactFilterBar: FC<CompactFilterBarProps> = ({
  currentTask,
  taskAbilities,
  selectedAbilities,
  handleAbilityChange,
  availableLLMJudges,
  isDarkMode,
  showByDifficulty,
  setShowByDifficulty
}) => {
  // Get available filters for current task
  const availableFilters = getAvailableFilters(currentTask, taskAbilities, availableLLMJudges);

  // Transform filter data into dropdown options
  const getDropdownOptions = (filter: FilterConfig) => {
    const values = filter.getValues(currentTask, taskAbilities, availableLLMJudges);
    const filterState = new FilterState(filter, selectedAbilities, currentTask, showByDifficulty, taskAbilities);
    
    return values.map((value: string) => ({
      value,
      label: filterState.getDisplayText(value),
      disabled: filterState.isDisabled(value) || filterState.isRestricted(value)
    }));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (filterKey: keyof Ability | 'llmJudges', selectedValues: string[]) => {
    const currentSelections = selectedAbilities[filterKey as keyof Ability] || [];
    
    // Find values to remove (in current but not in new selection)
    const valuesToRemove = currentSelections.filter(value => !selectedValues.includes(value));
    
    // Find values to add (in new selection but not in current)
    const valuesToAdd = selectedValues.filter(value => !currentSelections.includes(value));
    
    // Remove deselected values
    valuesToRemove.forEach(value => {
      handleAbilityChange(filterKey as keyof Ability, value);
    });
    
    // Add newly selected values
    valuesToAdd.forEach(value => {
      handleAbilityChange(filterKey as keyof Ability, value);
    });
  };

  // Get current selections for a filter
  const getCurrentSelections = (filterKey: keyof Ability | 'llmJudges'): string[] => {
    if (filterKey === 'llmJudges') {
      // Handle LLM judges separately if needed
      return selectedAbilities.llmJudges || [];
    }
    return selectedAbilities[filterKey as keyof Ability] || [];
  };

  // Check if we have any filters to show
  const hasFilters = availableFilters.length > 0;
  
  // Check if we should show difficulty toggle
  const shouldShowDifficultyToggle = filterConditions.shouldShowDifficultyToggle(currentTask);

  // Show the filter bar if we have filters OR if we need to show the difficulty toggle
  if (!hasFilters && !shouldShowDifficultyToggle) {
    return null;
  }

  // Count the number of filters that will actually be rendered
  const renderableFilters = availableFilters.filter(filter => {
    const options = getDropdownOptions(filter);
    return options.length > 0;
  });
  
  // Determine if we should use inline layout (2-3 filters)
  const shouldUseInlineLayout = renderableFilters.length >= 2 && renderableFilters.length <= 3;

  return (
    <div className={`w-full mb-6 p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-slate-800/50 border-slate-700/50' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      {/* Conditional Layout Based on Number of Filters */}
      {shouldUseInlineLayout && hasFilters ? (
        /* Inline layout for 2-3 filters */
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4 flex-shrink-0">
            <h3 className={`text-base font-semibold ${
              isDarkMode ? 'text-slate-200' : 'text-slate-700'
            }`}>
              Filters:
            </h3>
            
            {/* Show by difficulty toggle for applicable tasks */}
            {shouldShowDifficultyToggle && (
              <div className="flex items-center gap-2 text-nowrap">
                <input 
                  type="checkbox" 
                  id="show-difficulty-compact"
                  checked={showByDifficulty}
                  onChange={() => setShowByDifficulty(!showByDifficulty)}
                  className={`
                    w-4 h-4 rounded border transition-colors focus:ring-2 focus:ring-offset-2
                    ${isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-slate-800'
                      : 'bg-white border-slate-300 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-white'
                    }
                  `}
                />
                <label 
                  htmlFor="show-difficulty-compact"
                  className={`text-sm font-medium cursor-pointer select-none ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Show results by difficulty
                </label>
              </div>
            )}
          </div>
          
          {/* Filter Dropdowns in same line */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1 min-w-0">
            {renderableFilters.map((filter) => {
              const options = getDropdownOptions(filter);
              const currentSelections = getCurrentSelections(filter.key);
              
              return (
                <MultiSelectDropdown
                  key={filter.key}
                  label={filter.label}
                  options={options}
                  selectedValues={currentSelections}
                  onSelectionChange={(values) => handleMultiSelectChange(filter.key, values)}
                  isDarkMode={isDarkMode}
                  maxDisplayedTags={2}
                  className="min-w-0 flex-1"
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* Original layout for 1 or 4+ filters */
        <>
          {/* Title and Difficulty Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className={`text-base font-semibold ${
              isDarkMode ? 'text-slate-200' : 'text-slate-700'
            }`}>
              Filters:
            </h3>
            
            {/* Show by difficulty toggle for applicable tasks */}
            {shouldShowDifficultyToggle && (
              <div className="flex items-center gap-2 text-nowrap">
                <input 
                  type="checkbox" 
                  id="show-difficulty-compact"
                  checked={showByDifficulty}
                  onChange={() => setShowByDifficulty(!showByDifficulty)}
                  className={`
                    w-4 h-4 rounded border transition-colors focus:ring-2 focus:ring-offset-2
                    ${isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-slate-800'
                      : 'bg-white border-slate-300 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-white'
                    }
                  `}
                />
                <label 
                  htmlFor="show-difficulty-compact"
                  className={`text-sm font-medium cursor-pointer select-none ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Show results by difficulty
                </label>
              </div>
            )}
          </div>

          {/* Filter Dropdowns - only show if we have filters */}
          {hasFilters && (
            <div className="flex flex-wrap gap-4">
              {renderableFilters.map((filter) => {
                const options = getDropdownOptions(filter);
                const currentSelections = getCurrentSelections(filter.key);
                
                return (
                  <MultiSelectDropdown
                    key={filter.key}
                    label={filter.label}
                    options={options}
                    selectedValues={currentSelections}
                    onSelectionChange={(values) => handleMultiSelectChange(filter.key, values)}
                    isDarkMode={isDarkMode}
                    maxDisplayedTags={2}
                    className="min-w-[240px] flex-1"
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Filter restrictions/messages */}
      {availableFilters.some(filter => 
        filter.specialBehaviors?.restrictions?.(currentTask)
      ) && (
        <div className="mt-4 space-y-2">
          {availableFilters.map((filter) => {
            const restriction = filter.specialBehaviors?.restrictions?.(currentTask);
            if (!restriction) return null;
            
            return (
              <div 
                key={filter.key}
                className={`text-sm p-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-amber-900/20 border border-amber-800/30 text-amber-300' 
                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                }`}
              >
                <span className="font-medium">{filter.label}:</span> {restriction.message}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompactFilterBar;
