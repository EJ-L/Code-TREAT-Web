import { FC, useState } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { TaskType, Ability } from '@/lib/types';
import { filterConditions, getAvailableFilters } from '@/lib/filterConfig';
import { getMultiLeaderboardConfig } from '@/lib/leaderboardConfig';
import {
  VulnerabilityMetrics,
  UnitTestGenerationMetrics,
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
}

const FilterPanel: FC<FilterPanelProps> = ({
  currentTask,
  taskAbilities,
  selectedAbilities,
  handleAbilityChange,
  availableLLMJudges,
  isDarkMode,
  isMultiLeaderboard = false
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
  const availableFilters = shouldShowSecondaryFilters 
    ? getAvailableFilters(currentTask, taskAbilities, availableLLMJudges, excludeFilter)
    : [];



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

      {/* Unit test generation metrics */}
      {filterConditions.shouldShowUnitTestGenerationMetrics(currentTask) && (
        <UnitTestGenerationMetrics isDarkMode={isDarkMode} />
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
        filterConditions.shouldShowVulnerabilityMetrics(currentTask) || 
        filterConditions.shouldShowUnitTestGenerationMetrics(currentTask)) && (
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