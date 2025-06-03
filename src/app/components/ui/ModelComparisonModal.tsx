import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent } from './card';
import { motion } from 'framer-motion';
import ModelComparisonRadarChart from './ModelComparisonRadarChart';
import ModelComparisonBarChart from './ModelComparisonBarChart';
import { Ability } from '@/lib/types';

type ModelComparisonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  results: Array<any>;
  isDarkMode: boolean;
  currentTask: string;
  selectedAbilities: Partial<Ability>;
  showByDifficulty: boolean;
};

const MAX_MODELS = 5;

const ModelComparisonModal = ({ 
  isOpen, 
  onClose, 
  results, 
  isDarkMode,
  currentTask,
  selectedAbilities,
  showByDifficulty
}: ModelComparisonModalProps) => {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  
  // Clear selected models when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedModels([]);
    }
  }, [isOpen]);
  
  // Deduplicate model list for selection
  const uniqueModels = useMemo(() => {
    const modelNames = new Set<string>();
    return results.filter(result => {
      if (modelNames.has(result.model)) {
        return false;
      }
      modelNames.add(result.model);
      return true;
    });
  }, [results]);

  const handleModelToggle = useCallback((modelName: string) => {
    setSelectedModels(prev => {
      // If model is already selected, remove it
      if (prev.includes(modelName)) {
        return prev.filter(m => m !== modelName);
      } 
      // Otherwise add it if we're under the limit
      else if (prev.length < MAX_MODELS) {
        return [...prev, modelName];
      }
      return prev;
    });
  }, []);

  // Helper to get active filters for display
  const getActiveFilters = useMemo(() => {
    const filters: Array<{ type: string; value: string }> = [];
    
    // Add difficulty filter if enabled
    if (showByDifficulty) {
      filters.push({ type: 'View', value: 'By Difficulty' });
    }
    
    // Add each type of filter that has selections
    Object.entries(selectedAbilities).forEach(([key, values]) => {
      if (values && values.length > 0) {
        const filterType = key.charAt(0).toUpperCase() + key.slice(1);
        values.forEach(value => {
          filters.push({ type: filterType, value });
        });
      }
    });
    
    return filters;
  }, [selectedAbilities, showByDifficulty]);

  const radarData = useMemo(() => {
    if (!selectedModels.length) return [];

    // Get all numeric metrics for the current task
    const allMetrics = Object.keys(results[0] || {}).filter(key => {
      // Skip non-numeric or special fields
      if (['rank', 'model', 'model_url', 'ability', 'task'].includes(key)) {
        return false;
      }
      
      // Check if any selected model has a numeric value for this metric
      const hasData = selectedModels.some(modelName => {
        const modelData = results.find(r => r.model === modelName);
        const value = modelData?.[key];
        return value !== '-' && value !== undefined && !isNaN(Number(value));
      });
      
      // Only include metrics that have actual data
      return hasData;
    });

    // Create data structure for chart
    return allMetrics.map(metric => {
      const dataPoint: { metric: string; [key: string]: string | number } = { metric };
      
      selectedModels.forEach(modelName => {
        const modelData = results.find(r => r.model === modelName);
        const value = modelData?.[metric];
        
        // Handle numerical values (could be stored as strings)
        if (value !== '-' && value !== undefined && !isNaN(Number(value))) {
          dataPoint[modelName] = Number(value);
        } else {
          dataPoint[modelName] = 0; // Set unavailable data to 0
        }
      });
      
      return dataPoint;
    });
  }, [results, selectedModels]);

  // Determine if we should use bar chart (1-2 metrics) or radar chart (3+ metrics)
  const shouldUseBarChart = radarData.length <= 2;

  const handleCloseModal = useCallback(() => {
    onClose();
    setSelectedModels([]);
  }, [onClose]);

  if (!isOpen) return null;

  // Selected models map for the active chart controls
  const selectedModelsMap = selectedModels.reduce((acc, model) => ({
    ...acc,
    [model]: true
  }), {});

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`w-full max-w-5xl ${isDarkMode ? 'bg-[#0f1729]' : 'bg-white'} rounded-xl shadow-xl overflow-hidden`}
      >
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} flex justify-between items-center`}>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            Compare Models (select up to 5)
          </h2>
          <button 
            onClick={handleCloseModal}
            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className={`p-6 max-h-[80vh] overflow-auto ${isDarkMode ? 'bg-[#0f1729]' : 'bg-white'}`}>
          {/* Active Filters Display */}
          {getActiveFilters.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Active Filters:
              </h3>
              <div className="flex flex-wrap gap-2">
                {getActiveFilters.map((filter, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-blue-900/50 text-blue-200 border border-blue-700/50' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    <span className="font-semibold mr-1">{filter.type}:</span>
                    {filter.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Select Models
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {uniqueModels.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleModelToggle(result.model)}
                  disabled={!selectedModels.includes(result.model) && selectedModels.length >= MAX_MODELS}
                  className={`
                    px-3 py-2 rounded-lg text-sm transition-all
                    ${selectedModels.includes(result.model)
                      ? isDarkMode 
                        ? 'bg-blue-700 text-white' 
                        : 'bg-blue-500 text-white'
                      : isDarkMode 
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }
                    ${(!selectedModels.includes(result.model) && selectedModels.length >= MAX_MODELS)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }
                  `}
                >
                  {result.model}
                </button>
              ))}
            </div>
          </div>

          {selectedModels.length > 0 && (
            <Card className={isDarkMode ? 'bg-[#1a2333] border-slate-700' : 'bg-white border-slate-200'}>
              <CardContent className="p-4">
                <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Performance Comparison
                </h3>
                {radarData.length > 0 ? (
                  shouldUseBarChart ? (
                    <ModelComparisonBarChart 
                      data={radarData} 
                      models={selectedModels} 
                      activeModels={selectedModelsMap}
                      isDarkMode={isDarkMode} 
                    />
                  ) : (
                    <ModelComparisonRadarChart 
                      data={radarData} 
                      models={selectedModels}
                      activeModels={selectedModelsMap}
                      isDarkMode={isDarkMode} 
                    />
                  )
                ) : (
                  <div className={`text-center py-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No comparable metrics available for the selected models
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} flex justify-end`}>
          <button
            onClick={handleCloseModal}
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ModelComparisonModal;