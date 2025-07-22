import { FC } from 'react';
import ClientOnlyCSVLink from '@/app/components/ui/ClientOnlyCSVLink';
import { TaskType } from '@/lib/types';
import TableHeader from './TableHeader';
import TableCell from './TableCell';
import { getModelUrl, hasDataLeakage } from '@/lib/constants';

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
  isDarkMode
}) => {
  const renderResultsTable = () => {
    // Show results (this function is only called when we have data)
    return sortedResults.map((result, index) => {
      // Get model name for passing to cells (but don't change row background)
      const modelName = result.model || result.modelName || '';
      
      return (
      <tr key={index} className={`
        ${isDarkMode 
          ? index % 2 === 0 ? 'bg-[#0f1729]' : 'bg-[#182338]' 
          : index % 2 === 0 ? 'bg-white' : 'bg-slate-100'
        }
        ${isDarkMode ? 'hover:bg-opacity-90' : 'hover:bg-opacity-80'}
        transition-colors
        ${isDarkMode ? 'border-b border-white/10' : 'border-b border-black/10'}
      `}>
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
              isDarkMode={isDarkMode}
              modelUrl={modelUrl}
              modelName={modelName}
            />
          );
        })}
      </tr>
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
                background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '20px', width: '20px' }} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              Compare
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
      
      {/* Table section */}
      <div style={{ 
        overflowX: 'auto', 
        position: 'relative',
        width: '100%'
      }}>
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
              width: '40px',
              height: '40px',
              border: '4px solid #3b82f6',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }}></div>
            <span style={{
              color: isDarkMode ? '#cbd5e1' : '#475569',
              fontSize: '18px',
              fontWeight: '500'
            }}>Loading results...</span>
          </div>
        ) : results.length === 0 ? (
          // Show no results message when not loading but no data
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px'
          }}>
            <svg style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{
              color: isDarkMode ? '#cbd5e1' : '#475569',
              fontSize: '18px',
              fontWeight: '500'
            }}>No results found</span>
            <span style={{
              color: isDarkMode ? '#94a3b8' : '#64748b',
              fontSize: '14px',
              marginTop: '8px'
            }}>Try adjusting your filters</span>
          </div>
        ) : (
          // Show complete table when loaded and has data
          <div style={{ width: '100%' }}>
            <table style={{ 
              width: '100%', 
              tableLayout: 'fixed',
              borderCollapse: 'separate',
              borderSpacing: '0'
            }}>
              <thead style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }}>
                <tr>
                  {getTableHeaders(currentTask).map((header) => (
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
        )}
      </div>
    </div>
  );
};

export default ResultsTable; 