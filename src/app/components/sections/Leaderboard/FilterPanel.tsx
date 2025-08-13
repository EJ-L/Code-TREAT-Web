import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/app/components/ui/card";
import { TaskType, Ability } from '@/lib/types';
import { getAvailableFilters, filterConditions, getDataNoteText } from '@/lib/filterConfig';
import {
  FilterGroup,
  DifficultyToggle,
  DataNote,
  VulnerabilityMetrics,
  OverallInfo,
  AdvancedFiltersToggle,
  DataLeakageWarning
} from './FilterComponents';

interface FilterPanelProps {
  currentTask: TaskType;
  taskAbilities: Record<TaskType, Ability>;
  selectedAbilities: Partial<Ability>;
  handleAbilityChange: (key: keyof Ability, value: string) => void;
  showByDifficulty: boolean;
  setShowByDifficulty: (value: boolean) => void;
  availableLLMJudges: string[];
  isDarkMode: boolean;
}

const FilterPanel: FC<FilterPanelProps> = ({
  currentTask,
  taskAbilities,
  selectedAbilities,
  handleAbilityChange,
  showByDifficulty,
  setShowByDifficulty,
  availableLLMJudges,
  isDarkMode
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  // Get available filters for current task
  const availableFilters = getAvailableFilters(currentTask, taskAbilities, availableLLMJudges);
  const hasFilters = filterConditions.hasAvailableFilters(currentTask, taskAbilities, availableLLMJudges);

  // Early return for interaction-2-code task
  if (currentTask === 'interaction-2-code') {
    return <div className="mt-8 mb-8" />;
  }

  // Filter section renderer
  const FiltersSection = () => (
    <motion.div
      initial={{ height: 'auto', opacity: 1 }}
      animate={{ 
        height: showAdvancedFilters ? 'auto' : 0, 
        opacity: showAdvancedFilters ? 1 : 0 
      }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className={`${
        showAdvancedFilters 
          ? `border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}` 
          : ''
      } pt-6 mt-2`}>
        <div className="flex flex-row flex-wrap gap-8 pb-4">
          {availableFilters.map((filter) => (
            <FilterGroup
              key={filter.key}
              filter={filter}
              currentTask={currentTask}
              showByDifficulty={showByDifficulty}
              selectedAbilities={selectedAbilities}
              taskAbilities={taskAbilities}
              availableLLMJudges={availableLLMJudges}
              handleAbilityChange={handleAbilityChange}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );

  // Information section renderer
  const InfoSection = () => (
    <div className={`${hasFilters ? 'mt-6' : 'mt-0'} pt-4 ${
      hasFilters 
        ? (isDarkMode ? 'border-t border-slate-700/50' : 'border-t border-slate-200') 
        : ''
    }`}>
      <div className="flex justify-end mb-4">
        <div className="flex flex-col items-end space-y-2">
          {/* Data availability note */}
          {filterConditions.shouldShowDataNote(currentTask) && (
            <DataNote currentTask={currentTask} isDarkMode={isDarkMode} />
          )}

          {/* Difficulty toggle */}
          {filterConditions.shouldShowDifficultyToggle(currentTask) && (
            <DifficultyToggle
              currentTask={currentTask}
              showByDifficulty={showByDifficulty}
              setShowByDifficulty={setShowByDifficulty}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>

      {/* Data leakage warning for applicable tasks */}
      {filterConditions.shouldShowDataLeakageWarning && filterConditions.shouldShowDataLeakageWarning(currentTask) && (
        <div className="mb-4">
          <DataLeakageWarning taskType={currentTask} isDarkMode={isDarkMode} />
        </div>
      )}

      {/* Vulnerability detection metrics */}
      {filterConditions.shouldShowVulnerabilityMetrics(currentTask) && (
        <VulnerabilityMetrics isDarkMode={isDarkMode} />
      )}
    </div>
  );

  return (
    <Card className={`w-full max-w-7xl mx-auto mt-8 mb-8 ${
      isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'
    } backdrop-blur-sm border ${
      isDarkMode ? 'border-slate-700/50' : 'border-slate-200'
    } rounded-xl shadow-sm`}>
      <CardContent className="p-6">
        {/* Overall info section */}
        {filterConditions.shouldShowOverallInfo(currentTask) && (
          <OverallInfo isDarkMode={isDarkMode} />
        )}

        {hasFilters ? (
          <>
            {/* Advanced filters toggle */}
            <AdvancedFiltersToggle
              showAdvancedFilters={showAdvancedFilters}
              setShowAdvancedFilters={setShowAdvancedFilters}
              isDarkMode={isDarkMode}
            />
            
            {/* Render all filters */}
            <FiltersSection />
            
            {/* Information section */}
            <InfoSection />
          </>
        ) : (
          /* Render just the info section for tasks without filters */
          <InfoSection />
        )}
      </CardContent>
    </Card>
  );
};

export default FilterPanel; 