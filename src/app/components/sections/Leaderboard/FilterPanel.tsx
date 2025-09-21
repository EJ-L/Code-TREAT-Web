import { FC } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { TaskType, Ability, ProcessedResult } from '@/lib/types';
import { filterConditions, getAvailableFilters } from '@/lib/filterConfig';
import { getMultiLeaderboardConfig } from '@/lib/leaderboardConfig';
import {
  VulnerabilityMetrics,
  CodeRobustnessMetrics,
  OverallInfo,
  DataLeakageWarning,
} from './FilterComponents';


interface FilterPanelProps {
  currentTask: TaskType;
  taskAbilities: Record<TaskType, Ability>;
  selectedAbilities: Partial<Ability>;
  handleAbilityChange: (key: keyof Ability, value: string) => void;
  availableLLMJudges: string[];
  isDarkMode: boolean;
  timelineRange: { start: Date; end: Date } | null;
  onTimelineChange: (startDate: Date, endDate: Date) => void;
  isMultiLeaderboard?: boolean;
  selectedMultiTab?: string;
  results?: ProcessedResult[]; // Add results to determine actual datasets being shown
}

const FilterPanel: FC<FilterPanelProps> = ({
  currentTask,
  taskAbilities,
  selectedAbilities,
  handleAbilityChange: _handleAbilityChange,
  availableLLMJudges,
  isDarkMode,
  isMultiLeaderboard = false,
  results = []
}) => {
  // Early return for interaction-2-code task
  if (currentTask === 'interaction-2-code') {
    return null;
  }

  // Only show secondary filters for specific tasks that need them
  const tasksWithSecondaryFilters: TaskType[] = [
    'code generation',
    'code translation', 
    'input prediction',
    'output prediction'
  ];

  const shouldShowSecondaryFilters = tasksWithSecondaryFilters.includes(currentTask);

  // Get available filters, excluding the extracted filter for multi-leaderboard tasks
  const multiConfig = getMultiLeaderboardConfig(currentTask);
  const excludeFilter = multiConfig?.extractedFilter;
  const _availableFilters = shouldShowSecondaryFilters 
    ? getAvailableFilters(currentTask, taskAbilities, availableLLMJudges, excludeFilter)
    : [];



  // Information section renderer - simplified without DataNote and DifficultyToggle
  const InfoSection = () => (
    <div className="space-y-4">
      {/* Data leakage warning for applicable tasks */}
      {(() => {
        // For code translation, use the actual datasets in the results
        let datasetsToCheck = selectedAbilities.dataset || [];
        
        if (currentTask === 'code translation') {
          console.log('DEBUG FilterPanel: currentTask is code translation');
          console.log('DEBUG FilterPanel: results.length:', results.length);
          console.log('DEBUG FilterPanel: selectedAbilities:', selectedAbilities);
          console.log('DEBUG FilterPanel: selectedAbilities.dataset:', selectedAbilities.dataset);
          
          if (results.length > 0) {
            // If we have results, use the actual datasets from the results
            datasetsToCheck = [...new Set(results.map(result => result.dataset))];
            console.log('DEBUG FilterPanel: datasetsToCheck from results:', datasetsToCheck);
          } else if (selectedAbilities.dataset && selectedAbilities.dataset.length > 0) {
            // If no results yet but dataset filter is selected, use the selected datasets
            datasetsToCheck = selectedAbilities.dataset;
            console.log('DEBUG FilterPanel: Using selectedAbilities.dataset:', datasetsToCheck);
          } else {
            // No results and no dataset filter selected - return early to avoid showing warning
            console.log('DEBUG FilterPanel: No results and no dataset selected, returning false');
            return false;
          }
        }
        
        const shouldShow = filterConditions.shouldShowDataLeakageWarning && filterConditions.shouldShowDataLeakageWarning(currentTask, datasetsToCheck);
        console.log('DEBUG FilterPanel: shouldShow data leakage warning:', shouldShow, 'for task:', currentTask, 'datasets:', datasetsToCheck);
        return shouldShow;
      })() && (
        <DataLeakageWarning taskType={currentTask} isDarkMode={isDarkMode} />
      )}

      {/* Vulnerability detection metrics */}
      {filterConditions.shouldShowVulnerabilityMetrics(currentTask) && (
        <VulnerabilityMetrics isDarkMode={isDarkMode} />
      )}

      {/* Code robustness metrics */}
      {(() => {
        let datasetsToCheck = selectedAbilities.dataset || [];
        
        if (currentTask === 'code-robustness') {
          if (results.length > 0) {
            // If we have results, use the actual datasets from the results
            datasetsToCheck = [...new Set(results.map(result => result.dataset))];
          } else if (selectedAbilities.dataset && selectedAbilities.dataset.length > 0) {
            // If no results yet but dataset filter is selected, use the selected datasets
            datasetsToCheck = selectedAbilities.dataset;
          } else {
            // No results and no dataset filter selected
            return false;
          }
        }
        
        return filterConditions.shouldShowCodeRobustnessMetrics && filterConditions.shouldShowCodeRobustnessMetrics(currentTask, datasetsToCheck);
      })() && (
        <CodeRobustnessMetrics isDarkMode={isDarkMode} />
      )}

    </div>
  );

  return (
    <div className={`w-full max-w-7xl mx-auto ${isMultiLeaderboard ? 'space-y-1' : 'space-y-1'}`}>
      {/* Overall info section */}
      {filterConditions.shouldShowOverallInfo(currentTask) && (
        <Card className={`${
          isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'
        } backdrop-blur-sm border ${
          isDarkMode ? 'border-slate-700/50' : 'border-slate-200'
        } rounded-xl shadow-sm`}>
          <CardContent className="p-6">
            <OverallInfo isDarkMode={isDarkMode} />
          </CardContent>
        </Card>
      )}


      {/* Information section */}
      {(() => {
        // Check if we should show the information section
        const shouldShowVulnerabilityMetrics = filterConditions.shouldShowVulnerabilityMetrics(currentTask);
        
        // For data leakage warning, use the same logic as inside InfoSection
        let shouldShowDataLeakage = false;
        if (currentTask === 'vulnerability detection') {
          shouldShowDataLeakage = true;
        } else if (currentTask === 'code translation') {
          let datasetsToCheck = selectedAbilities.dataset || [];
          if (results.length > 0) {
            datasetsToCheck = [...new Set(results.map(result => result.dataset))];
          } else if (selectedAbilities.dataset && selectedAbilities.dataset.length > 0) {
            datasetsToCheck = selectedAbilities.dataset;
          } else {
            shouldShowDataLeakage = false;
          }
          
          if (datasetsToCheck.length > 0) {
            shouldShowDataLeakage = filterConditions.shouldShowDataLeakageWarning(currentTask, datasetsToCheck);
          }
        }
        
        // Check if we should show code robustness metrics
        let shouldShowCodeRobustnessMetrics = false;
        if (currentTask === 'code-robustness') {
          let datasetsToCheck = selectedAbilities.dataset || [];
          if (results.length > 0) {
            datasetsToCheck = [...new Set(results.map(result => result.dataset))];
          } else if (selectedAbilities.dataset && selectedAbilities.dataset.length > 0) {
            datasetsToCheck = selectedAbilities.dataset;
          }
          
          if (datasetsToCheck.length > 0) {
            shouldShowCodeRobustnessMetrics = filterConditions.shouldShowCodeRobustnessMetrics && filterConditions.shouldShowCodeRobustnessMetrics(currentTask, datasetsToCheck);
          }
        }
        
        return shouldShowDataLeakage || shouldShowVulnerabilityMetrics || shouldShowCodeRobustnessMetrics;
      })() && (
        <Card className={`${
          isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'
        } backdrop-blur-sm border ${
          isDarkMode ? 'border-slate-700/50' : 'border-slate-200'
        } rounded-xl shadow-sm`}>
          <CardContent className="p-6">
            <InfoSection />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FilterPanel; 