import { FC } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { TaskType, Ability } from '@/lib/types';
import { filterConditions } from '@/lib/filterConfig';
import {
  VulnerabilityMetrics,
  OverallInfo,
  DataLeakageWarning,
} from './FilterComponents';
import CompactFilterBar from './CompactFilterBar';

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
}

const FilterPanel: FC<FilterPanelProps> = ({
  currentTask,
  taskAbilities,
  selectedAbilities,
  handleAbilityChange,
  availableLLMJudges,
  isDarkMode,
  timelineRange,
  onTimelineChange,
  isMultiLeaderboard = false,
  selectedMultiTab = 'Overall'
}) => {
  // Get the excluded filter for multi-leaderboard mode
  const getExcludedFilter = () => {
    if (!isMultiLeaderboard) return undefined;
    
    const { getMultiLeaderboardConfig } = require('@/lib/leaderboardConfig');
    const config = getMultiLeaderboardConfig(currentTask);
    return config?.extractedFilter;
  };

  // Check if we have filters available
  const hasFilters = filterConditions.hasAvailableFilters(currentTask, taskAbilities, availableLLMJudges, getExcludedFilter());
  // Check if we should show difficulty toggle
  const shouldShowDifficultyToggle = filterConditions.shouldShowDifficultyToggle(currentTask);
  // Show the filter bar if we have filters OR if we need to show the difficulty toggle
  const shouldShowFilterBar = hasFilters || shouldShowDifficultyToggle;

  // Early return for interaction-2-code task
  if (currentTask === 'interaction-2-code') {
    return null;
  }



  // Information section renderer - simplified without DataNote and DifficultyToggle
  const InfoSection = () => (
    <div className="space-y-4">
      {/* Data leakage warning for applicable tasks */}
      {filterConditions.shouldShowDataLeakageWarning && filterConditions.shouldShowDataLeakageWarning(currentTask) && (
        <DataLeakageWarning taskType={currentTask} isDarkMode={isDarkMode} />
      )}

      {/* Vulnerability detection metrics */}
      {filterConditions.shouldShowVulnerabilityMetrics(currentTask) && (
        <VulnerabilityMetrics isDarkMode={isDarkMode} />
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
      {(filterConditions.shouldShowDataLeakageWarning?.(currentTask) || 
        filterConditions.shouldShowVulnerabilityMetrics(currentTask)) && (
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