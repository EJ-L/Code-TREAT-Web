import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/app/components/ui/card";
import { TaskType, Ability } from '@/lib/types';

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
  // Define tasks that have difficulty-based results
  const tasksWithDifficulty = ['overall', 'code generation', 'code translation', 'input prediction', 'output prediction'];
  
  // State for toggling advanced filters visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  // Check if there are any filters available
  const hasFilters = (String(currentTask) !== 'overall') && (
    taskAbilities[currentTask].dataset.length > 0 ||
    ((currentTask === 'code summarization' || currentTask === 'code review') && availableLLMJudges.length > 0) ||
    (Object.entries(taskAbilities[currentTask]) as [keyof Ability, string[]][])
      .some(([key, values]) => !['dataset', 'llmJudges'].includes(key) && values.length > 0)
  );

  // All filters section (now under Advanced Filters)
  const renderAllFilters = () => (
    <motion.div
      initial={{ height: 'auto', opacity: 1 }}
      animate={{ height: showAdvancedFilters ? 'auto' : 0, opacity: showAdvancedFilters ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className={`${showAdvancedFilters ? `border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}` : ''} pt-6 mt-2`}>
        <div className="flex flex-row flex-wrap gap-8 pb-4">
          {/* Dataset Filter */}
          {(String(currentTask) !== 'overall') && taskAbilities[currentTask].dataset.length > 0 && (
            <div className="flex flex-col space-y-3 mb-2">
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>Dataset</p>
              <div className="inline-flex flex-wrap gap-2">
                {taskAbilities[currentTask].dataset.map((value: string) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAbilityChange('dataset', value)}
                    className={`
                      px-6 py-3 text-center transition-all text-lg font-medium rounded-lg
                      ${selectedAbilities.dataset?.includes(value)
                        ? isDarkMode ? 'bg-blue-900 text-blue-100 border border-blue-700' : 'bg-blue-500 text-white border border-blue-400'
                        : isDarkMode ? 'bg-[#151d2a] text-slate-300 hover:bg-blue-900/20 border border-slate-700/50' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }
                    `}
                  >
                    {value}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* LLM Judge Filter */}
          {(String(currentTask) !== 'overall') && (currentTask === 'code summarization' || currentTask === 'code review') && availableLLMJudges.length > 0 && (
            <div className="flex flex-col space-y-3 mb-2">
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>LLM Judge</p>
              <div className="inline-flex flex-wrap gap-2">
                {availableLLMJudges.map((judge: string) => (
                  <motion.button
                    key={judge}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAbilityChange('llmJudges', judge)}
                    className={`
                      px-6 py-3 text-center transition-all text-lg font-medium rounded-lg
                      ${selectedAbilities.llmJudges?.includes(judge)
                        ? isDarkMode ? 'bg-blue-900 text-blue-100 border border-blue-700' : 'bg-blue-500 text-white border border-blue-400'
                        : isDarkMode ? 'bg-[#151d2a] text-slate-300 hover:bg-blue-900/20 border border-slate-700/50' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }
                    `}
                  >
                    {judge}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          
          {/* Other Filters */}
          {(String(currentTask) !== 'overall') && (Object.entries(taskAbilities[currentTask]) as [keyof Ability, string[]][]).
            filter(([key]) => !['dataset', 'llmJudges'].includes(key)).
            map(([key, values]) => (
              values.length > 0 && (
                <div key={key} className="flex flex-col space-y-3 mb-2">
                  <p className={`text-2xl font-semibold ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </p>
                  <div className="inline-flex flex-wrap gap-2">
                    {values.map((value: string) => (
                      <motion.button
                        key={value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAbilityChange(key, value)}
                        className={`
                          px-6 py-3 text-center transition-all text-lg font-medium rounded-lg
                          ${selectedAbilities[key]?.includes(value)
                            ? isDarkMode ? 'bg-blue-900 text-blue-100 border border-blue-700' : 'bg-blue-500 text-white border border-blue-400'
                            : isDarkMode ? 'bg-[#151d2a] text-slate-300 hover:bg-blue-900/20 border border-slate-700/50' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }
                        `}
                      >
                        {value}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )
            ))}
        </div>
      </div>
    </motion.div>
  );

  const renderInfoSection = () => (
    <div>
      {/* Notes for overall view */}
      {currentTask === 'overall' && (
        <div className="text-xl text-center mb-4">
          <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Showing overall results based on the average of all available metrics across tasks.
          </p>
        </div>
      )}

      {/* Flex container with note and difficulty toggle, aligned to the right */}
      <div className="flex justify-end mb-4">
        <div className="flex flex-col items-end space-y-2">
          {/* Note about "-" symbol */}
          <div className={`flex items-center gap-2 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span className="font-mono">—</span>
            <span className="text-lg">Denotes data is not yet available.</span>
          </div>

          {/* Difficulty toggle - show for tasks that support it */}
          {tasksWithDifficulty.includes(currentTask) && currentTask !== 'overall' && (
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="show-difficulty"
                checked={showByDifficulty}
                onChange={() => setShowByDifficulty(!showByDifficulty)}
                className={`form-checkbox h-5 w-5 ${
                  isDarkMode 
                    ? 'text-blue-600 bg-[#151d2a] border-slate-700' 
                    : 'text-blue-600 bg-slate-100 border-slate-300'
                } rounded focus:ring-blue-500`} 
              />
              <label 
                htmlFor="show-difficulty"
                className={`ml-2 text-l cursor-pointer ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Show results by difficulty
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Vulnerability Detection Metrics Explanation */}
      {currentTask === 'vulnerability detection' && (
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
      )}
    </div>
  );

  return (
    <Card className={`w-full max-w-7xl mx-auto mt-8 mb-8 ${isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'} backdrop-blur-sm border ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} rounded-xl shadow-sm`}>
      <CardContent className="p-6">
        {/* Advanced filters header */}
        {hasFilters && (
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
        )}

        {/* All filters (collapsible) */}
        {hasFilters && renderAllFilters()}
        
        {/* Information section */}
        <div className={`${hasFilters ? 'mt-6' : 'mt-0'} pt-4 ${hasFilters ? (isDarkMode ? 'border-t border-slate-700/50' : 'border-t border-slate-200') : ''}`}>
          {renderInfoSection()}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterPanel; 