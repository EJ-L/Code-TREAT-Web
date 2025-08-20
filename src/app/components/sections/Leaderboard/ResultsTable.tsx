import { FC, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ClientOnlyCSVLink from '@/app/components/ui/ClientOnlyCSVLink';
import { TaskType, Ability } from '@/lib/types';
import TableHeader from './TableHeader';
import TableCell from './TableCell';
import { getModelUrl, hasDataLeakage } from '@/lib/constants';
import { AnimatedTableRow } from '@/app/components/ui/AnimatedTableRow';
import ModelScatterChart from '@/app/components/ui/ModelScatterChart';
import { TimelineFilter } from './FilterComponents';
import { filterConditions, getAvailableFilters } from '@/lib/filterConfig';
import MultiSelectDropdown from '@/app/components/ui/MultiSelectDropdown';
import { FilterState } from '@/lib/filterHelpers';

interface ResultsTableProps {
  currentTask: TaskType;
  results: any[];
  sortedResults: any[];
  isLoading: boolean;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  setIsComparisonModalOpen: (isOpen: boolean) => void;
  getTableHeaders: (task: TaskType) => { key: string; label: string; width: string; description: string }[];
  columnWidths: Record<string, number>;
  resizingColumn: string | null;
  csvData: { headers: any[]; data: any[] };
  csvFilename: string;
  handleSort: (key: string) => void;
  handleResizeStart: (e: React.MouseEvent, key: string) => void;
  getContentWidth: (columnWidth: number) => number;
  isColumnCentered: (key: string) => boolean;
  getStickyStyles: (key: string) => string;
  getStickyLeftPosition: (key: string) => string;
  getBackgroundColor: (key: string, isHeaderCell?: boolean) => string;
  getColumnAlignment: (key: string) => string;
  getNumericStyles: (key: string) => string;
  truncateText: (text: string, maxWidth: number) => string;
  getTaskSpecificColumnWidth: (task: TaskType, key: string) => string;
  isDarkMode: boolean;
  onColumnWidthChange?: () => void;
  timelineRange: { start: Date; end: Date } | null;
  onTimelineChange: (startDate: Date, endDate: Date) => void;
  // Filter-related props
  taskAbilities?: Record<TaskType, Ability>;
  selectedAbilities?: Partial<Ability>;
  handleAbilityChange?: (key: keyof Ability, value: string) => void;
  showByDifficulty?: boolean;
  setShowByDifficulty?: (value: boolean) => void;
  availableLLMJudges?: string[];
}

const ResultsTable: FC<ResultsTableProps> = ({
  currentTask,
  results,
  sortedResults,
  isLoading,
  sortConfig,
  setIsComparisonModalOpen,
  getTableHeaders,
  columnWidths,
  resizingColumn,
  csvData,
  csvFilename,
  handleSort,
  handleResizeStart,
  getContentWidth,
  isColumnCentered,
  getStickyStyles,
  getStickyLeftPosition,
  getBackgroundColor,
  getColumnAlignment,
  getNumericStyles,
  truncateText,
  getTaskSpecificColumnWidth,
  isDarkMode,
  onColumnWidthChange,
  timelineRange,
  onTimelineChange,
  taskAbilities = {},
  selectedAbilities = {},
  handleAbilityChange,
  showByDifficulty = false,
  setShowByDifficulty,
  availableLLMJudges = []
}) => {
  // Refs for measuring table dimensions
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  
  // State for scrollbar visibility
  const [needsHorizontalScroll, setNeedsHorizontalScroll] = useState(false);
  
  // State for view mode (table or scatter chart)
  const [viewMode, setViewMode] = useState<'table' | 'scatter'>('table');
  
  // State for current metric in scatter chart
  const [currentScatterMetric, setCurrentScatterMetric] = useState<string>('');
  
  // Get available numeric metrics for scatter chart
  const availableMetrics = useMemo(() => {
    if (!results || !results.length) return [];
    
    const headers = getTableHeaders(currentTask);
    return headers
      .filter(header => {
        // Skip non-numeric columns
        if (['rank', 'model', 'model_url', 'ability', 'task'].includes(header.key)) {
          return false;
        }
        
        // Check if this metric has numeric data in the results
        const hasNumericData = results.some(result => {
          const value = result[header.key];
          return value !== '-' && value !== undefined && !isNaN(Number(value));
        });
        
        return hasNumericData;
      })
      .map(header => header.key);
  }, [results, currentTask, getTableHeaders]);

  // Check if chart view button should be shown - based on original results having data and metrics
  // The button should remain visible even when timeline filtering shows 0 results, 
  // so users can switch to chart view to adjust the timeline filter
  const shouldShowChartButton = useMemo(() => {
    return currentTask !== 'overall' && availableMetrics.length > 0 && results.length > 0;
  }, [currentTask, availableMetrics.length, results.length]);
  
  // Set default metric when available metrics change
  useEffect(() => {
    if (availableMetrics.length > 0 && !currentScatterMetric) {
      setCurrentScatterMetric(availableMetrics[0]);
    }
  }, [availableMetrics, currentScatterMetric]);

  // Reset to table view only when the original results are empty (not just timeline filtered)
  // This ensures users can stay in chart view to adjust timeline filters
  useEffect(() => {
    if (results.length === 0 && viewMode === 'scatter') {
      setViewMode('table');
    }
  }, [results.length, viewMode]);
  
  // Calculate total table width based on column widths
  const calculateTableWidth = useCallback(() => {
    const headers = getTableHeaders(currentTask);
    return headers.reduce((total, header) => {
      return total + (columnWidths[header.key] || 100);
    }, 0);
  }, [currentTask, columnWidths, getTableHeaders]);
  
  // Check if horizontal scrolling is needed
  const checkScrollNeed = useCallback(() => {
    if (!tableContainerRef.current) return;
    
    const containerWidth = tableContainerRef.current.clientWidth;
    const tableWidth = calculateTableWidth();
    
    // Add some buffer for padding and borders (48px for padding, potential scrollbar, etc.)
    const needsScroll = tableWidth > containerWidth - 48;
    
    // Only update state if the value has changed to avoid unnecessary re-renders
    setNeedsHorizontalScroll(prev => prev !== needsScroll ? needsScroll : prev);
  }, [calculateTableWidth]);
  
  // Effect to check scroll need when dimensions change
  useEffect(() => {
    checkScrollNeed();
    // Notify parent component about column width changes
    if (onColumnWidthChange) {
      onColumnWidthChange();
    }
  }, [checkScrollNeed, columnWidths, currentTask, sortedResults.length, onColumnWidthChange]);
  
  // Effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      checkScrollNeed();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScrollNeed]);
  
  // Effect to check scroll need after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollNeed();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [checkScrollNeed]);

  const renderResultsTable = () => {
    // Show results (this function is only called when we have data)
    return sortedResults.map((result, index) => {
      // Get model name for passing to cells (but don't change row background)
      const modelName = result.model || result.modelName || '';
      
      return (
      <AnimatedTableRow 
        key={index} 
        index={index}
        className={`
          ${isDarkMode 
            ? index % 2 === 0 ? 'bg-[#0f1729]' : 'bg-[#182338]' 
            : index % 2 === 0 ? 'bg-white' : 'bg-slate-100'
          }
          ${isDarkMode ? 'hover:bg-opacity-90' : 'hover:bg-opacity-80'}
          transition-colors
          ${isDarkMode ? 'border-b border-white/10' : 'border-b border-black/10'}
        `}
      >
        {getTableHeaders(currentTask).map(header => {
          const value = result[header.key];
          const modelUrl = header.key === 'model' ? getModelUrl(String(value)) : undefined;
          
          return (
            <TableCell 
              key={header.key}
              header={header}
              value={value}
              rowIndex={index}
              currentTask={currentTask}
              columnWidths={columnWidths}
              resizingColumn={resizingColumn}
              getContentWidth={getContentWidth}
              isColumnCentered={isColumnCentered}
              getStickyStyles={getStickyStyles}
              getStickyLeftPosition={getStickyLeftPosition}
              getBackgroundColor={getBackgroundColor}
              getColumnAlignment={getColumnAlignment}
              getNumericStyles={getNumericStyles}
              truncateText={truncateText}
              getTaskSpecificColumnWidth={getTaskSpecificColumnWidth}
              modelName={modelName}
              modelUrl={modelUrl}
              isDarkMode={isDarkMode}
            />
          );
        })}
      </AnimatedTableRow>
      );
    });
  };
  
  return (
    <div 
      className={`RESULTS-TABLE-COMPONENT w-full max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}
    >
      {/* Header section with title and buttons */}
      <div className={`RESULTS-TABLE-HEADER ${isDarkMode ? 'dark' : ''}`}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0'
        }}>
          {currentTask.charAt(0).toUpperCase() + currentTask.slice(1)} Results
        </h2>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Hide compare button for overall task since there are no metrics to compare */}
          {currentTask !== 'overall' && (
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                color: 'white',
                background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '20px', width: '20px' }} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              Compare
            </button>
          )}
          
          {/* Show chart view button only when we have metrics and data */}
          {shouldShowChartButton && (
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'scatter' : 'table')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                color: 'white',
                background: viewMode === 'table' 
                  ? 'linear-gradient(to right, #f59e0b, #d97706)' 
                  : 'linear-gradient(to right, #10b981, #14b8a6)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {viewMode === 'table' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '20px', width: '20px' }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
                  </svg>
                  Chart View
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '20px', width: '20px' }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3zM3 9a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V9zM4 14a1 1 0 00-1 1v3a1 1 0 001 1h12a1 1 0 001-1v-3a1 1 0 00-1-1H4z"/>
                  </svg>
                  Table View
                </>
              )}
            </button>
          )}

          <div style={{
            padding: '8px 16px',
            borderRadius: '8px',
            color: 'white',
            background: 'linear-gradient(to right, #10b981, #14b8a6)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            <ClientOnlyCSVLink
              data={csvData.data}
              headers={csvData.headers}
              filename={csvFilename}
              className="flex items-center gap-2 text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '20px', width: '20px' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export
            </ClientOnlyCSVLink>
          </div>
        </div>
      </div>
      
      {/* Timeline Filter - positioned between title and table, only show in table view */}
      {filterConditions.shouldShowTimeline(currentTask) && viewMode === 'table' && (
        <div className="w-full max-w-7xl mx-auto mt-6 mb-6">
          <TimelineFilter 
            taskType={currentTask}
            isDarkMode={isDarkMode}
            timelineRange={timelineRange}
            onTimelineChange={onTimelineChange}
          />
        </div>
      )}
      
      {/* Enhanced Filter Bar - right under timeline */}
      {viewMode === 'table' && (
        <div className="w-full max-w-7xl mx-auto mb-6">
          <div className={`w-full p-6 rounded-lg border ${
            isDarkMode 
              ? 'bg-slate-800/50 border-slate-700/50' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            {/* Header with Filters title and difficulty toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className={`text-xl font-bold ${
                isDarkMode ? 'text-slate-100' : 'text-slate-800'
              }`}>
                Filters:
              </h3>
              
              {/* Functional difficulty toggle - using exact CompactFilterBar styling */}
              {(currentTask === 'output prediction' || currentTask === 'input prediction' || currentTask === 'code generation' || currentTask === 'code translation') && (
                <div className="flex items-center gap-2 text-nowrap">
                  <input 
                    type="checkbox" 
                    id="functional-difficulty-toggle"
                    checked={showByDifficulty}
                    onChange={() => setShowByDifficulty && setShowByDifficulty(!showByDifficulty)}
                    className={`
                      w-4 h-4 rounded border transition-colors focus:ring-2 focus:ring-offset-2
                      ${isDarkMode
                        ? 'bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-slate-800'
                        : 'bg-white border-slate-300 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-white'
                      }
                    `}
                  />
                  <label 
                    htmlFor="functional-difficulty-toggle"
                    className={`text-sm font-medium cursor-pointer select-none ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Show results by difficulty
                  </label>
                </div>
              )}
            </div>

            {/* Functional Filter Dropdowns Section */}
            <div className="space-y-4">
              {(() => {
                // Get available filters for current task (same logic as CompactFilterBar)
                const availableFilters = getAvailableFilters(currentTask, taskAbilities as Record<TaskType, Ability>, availableLLMJudges);
                
                // Transform filter data into dropdown options
                const getDropdownOptions = (filter: any) => {
                  const values = filter.getValues(currentTask, taskAbilities as Record<TaskType, Ability>, availableLLMJudges);
                  const filterState = new FilterState(filter, selectedAbilities, currentTask, showByDifficulty, taskAbilities as Record<TaskType, Ability>);
                  
                  return values.map((value: string) => ({
                    value,
                    label: filterState.getDisplayText(value),
                    disabled: filterState.isDisabled(value) || filterState.isRestricted(value)
                  }));
                };

                // Handle multi-select changes
                const handleMultiSelectChange = (filterKey: keyof Ability | 'llmJudges', selectedValues: string[]) => {
                  if (!handleAbilityChange) return;
                  
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
                    return selectedAbilities.llmJudges || [];
                  }
                  return selectedAbilities[filterKey as keyof Ability] || [];
                };

                if (availableFilters.length === 0) {
                  return (
                    <div className={`text-center p-4 rounded-lg ${
                      isDarkMode ? 'bg-slate-700/30 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      No filters available for this task
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {availableFilters.map((filter) => {
                      const options = getDropdownOptions(filter);
                      const currentSelections = getCurrentSelections(filter.key);
                      
                      // Skip filters with no available options
                      if (options.length === 0) return null;
                      
                      return (
                        <MultiSelectDropdown
                          key={filter.key}
                          label={filter.label}
                          options={options}
                          selectedValues={currentSelections}
                          onSelectionChange={(values) => handleMultiSelectChange(filter.key, values)}
                          isDarkMode={isDarkMode}
                          placeholder="Select options..."
                          maxDisplayedTags={2}
                          className="min-w-0"
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      
      {/* Table section */}
      <div 
        ref={tableContainerRef}
        style={{ 
          overflowX: needsHorizontalScroll ? 'auto' : 'hidden',
          position: 'relative',
          width: '100%'
        }}
      >
        {isLoading ? (
          // Show loading state only when actually loading
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: isDarkMode ? '#e2e8f0' : '#334155',
              marginBottom: '16px'
            }}>
              Loading...
            </div>
          </div>
        ) : sortedResults.length === 0 ? (
          // Show "no results" message only when there's genuinely no data to show
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px'
          }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: isDarkMode ? '#e2e8f0' : '#334155',
              marginBottom: '8px'
            }}>No results found</span>
            <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '16px' }}>
Try adjusting your filters</span>
          </div>
        ) : viewMode === 'table' ? (
          // Show complete table when loaded and has data
          <div style={{ width: '100%' }}>
            <table 
              ref={tableRef}
              style={{ 
                width: '100%', 
                tableLayout: 'fixed',
                borderCollapse: 'separate',
                borderSpacing: '0',
                minWidth: needsHorizontalScroll ? `${calculateTableWidth()}px` : '100%'
              }}
            >
              <thead style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }}>
                <tr>
                  {getTableHeaders(currentTask).map((header: any) => (
                    <TableHeader 
                      key={header.key}
                      header={header}
                      currentTask={currentTask}
                      sortConfig={sortConfig}
                      columnWidths={columnWidths}
                      resizingColumn={resizingColumn}
                      handleSort={handleSort}
                      handleResizeStart={handleResizeStart}
                      getContentWidth={getContentWidth}
                      isColumnCentered={isColumnCentered}
                      getStickyStyles={getStickyStyles}
                      getStickyLeftPosition={getStickyLeftPosition}
                      getBackgroundColor={getBackgroundColor}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderResultsTable()}
              </tbody>
            </table>
          </div>
        ) : (
          // Show scatter chart view
          <div style={{ width: '100%', padding: '20px' }}>
            <ModelScatterChart
              data={results}
              currentMetric={currentScatterMetric}
              availableMetrics={availableMetrics}
              onMetricChange={setCurrentScatterMetric}
              isDarkMode={isDarkMode}
              currentTask={currentTask}
              leaderboardTimelineRange={timelineRange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsTable;