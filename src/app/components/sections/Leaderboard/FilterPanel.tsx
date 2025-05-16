import { FC } from 'react';
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

  return (
    <Card className={`w-full max-w-7xl mx-auto ${isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'} backdrop-blur-sm border ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} rounded-xl shadow-sm`}>
      <CardContent className="space-y-2 p-2">
        <div className="flex flex-row flex-wrap gap-x-16 gap-y-8">
          {/* Dataset Filter */}
          {(String(currentTask) !== 'overall') && taskAbilities[currentTask].dataset.length > 0 && (
            <div className="flex flex-col space-y-2 mb-2">
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>Dataset</p>
              <div className="inline-flex flex-wrap">
                {taskAbilities[currentTask].dataset.map((value: string, index) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAbilityChange('dataset', value)}
                    className={`
                      px-6 py-3 text-center transition-all text-lg font-medium min-w-[120px]
                      ${index === 0 ? 'rounded-l-lg' : ''}
                      ${index === taskAbilities[currentTask].dataset.length - 1 ? 'rounded-r-lg' : ''}
                      ${index > 0 ? '-ml-px' : ''}
                      ${selectedAbilities.dataset?.includes(value)
                        ? isDarkMode ? 'bg-blue-900 text-blue-100 border border-blue-700 relative z-10' : 'bg-blue-500 text-white border border-blue-400 relative z-10'
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
            <div className="flex flex-col space-y-2 mb-2">
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>LLM Judge</p>
              <div className="inline-flex flex-wrap">
                {availableLLMJudges.map((judge: string, index) => (
                  <motion.button
                    key={judge}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAbilityChange('llmJudges', judge)}
                    className={`
                      px-6 py-3 text-center transition-all text-lg font-medium min-w-[120px]
                      ${index === 0 ? 'rounded-l-lg' : ''}
                      ${index === availableLLMJudges.length - 1 ? 'rounded-r-lg' : ''}
                      ${index > 0 ? '-ml-px' : ''}
                      ${selectedAbilities.llmJudges?.includes(judge)
                        ? isDarkMode ? 'bg-blue-900 text-blue-100 border border-blue-700 relative z-10' : 'bg-blue-500 text-white border border-blue-400 relative z-10'
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
                <div key={key} className="flex flex-col space-y-2 mb-2">
                  <p className={`text-2xl font-semibold ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </p>
                  <div className="inline-flex flex-wrap">
                    {values.map((value: string, index) => (
                      <motion.button
                        key={value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAbilityChange(key, value)}
                        className={`
                          px-6 py-3 text-center transition-all text-lg font-medium min-w-[120px]
                          ${index === 0 ? 'rounded-l-lg' : ''}
                          ${index === values.length - 1 ? 'rounded-r-lg' : ''}
                          ${index > 0 ? '-ml-px' : ''}
                          ${selectedAbilities[key]?.includes(value)
                            ? isDarkMode ? 'bg-blue-900 text-blue-100 border border-blue-700 relative z-10' : 'bg-blue-500 text-white border border-blue-400 relative z-10'
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

        {/* Divider */}
        <div className={`border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} my-4`} />

        {/* Notes for overall view */}
        {currentTask === 'overall' && (
          <div className="text-xl text-center mb-2">
            <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Showing overall results based on the average of all available metrics across tasks.
            </p>
          </div>
        )}

        {/* Note about "-" symbol */}
        <div className={`flex items-center justify-end gap-2 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span className="font-mono">—</span>
          <span className="text-lg">Denotes data is not yet available.</span>
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

        {/* Difficulty toggle - only show for tasks that support it */}
        {tasksWithDifficulty.includes(currentTask) && currentTask !== 'overall' && (
          <div className="flex justify-end mt-4">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={showByDifficulty}
                onChange={() => setShowByDifficulty(!showByDifficulty)}
                className={`form-checkbox h-5 w-5 ${
                  isDarkMode 
                    ? 'text-blue-600 bg-[#151d2a] border-slate-700' 
                    : 'text-blue-600 bg-slate-100 border-slate-300'
                } rounded focus:ring-blue-500`} 
              />
              <span className={`ml-2 text-l ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Show results by difficulty
              </span>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterPanel; 