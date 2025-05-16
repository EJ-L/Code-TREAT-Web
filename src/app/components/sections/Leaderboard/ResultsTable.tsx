import { FC } from 'react';
import { Card } from "@/app/components/ui/card";
import { CSVLink } from 'react-csv';
import { TaskType } from '@/lib/types';
import TableHeader from './TableHeader';
import TableCell from './TableCell';
import { getModelUrl } from '@/lib/constants';

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
    // Only show loading when there are no results yet
    if (isLoading && results.length === 0) {
      return (
        <tr className="w-full">
          <td colSpan={getTableHeaders(currentTask).length} className="text-center">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-blue-500 mb-4"></div>
              <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'} text-lg font-medium`}>Loading results...</span>
            </div>
          </td>
        </tr>
      );
    }

    // If we have results, show them even during loading state
    if (sortedResults.length > 0) {
      return sortedResults.map((result, index) => (
        <tr key={index} className={`
          ${isDarkMode 
            ? index % 2 === 0 ? 'bg-[#0f1729]' : 'bg-[#182338]' 
            : index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
          }
          ${isDarkMode ? 'hover:bg-opacity-90' : 'hover:bg-opacity-80'}
          transition-colors
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
              />
            );
          })}
        </tr>
      ));
    }

    // If no results and not loading, show no results message
    return (
      <tr className="w-full">
        <td colSpan={getTableHeaders(currentTask).length} className="text-center">
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-12 h-12 mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'} text-lg font-medium`}>No results found</span>
          </div>
        </td>
      </tr>
    );
  };
  
  return (
    <Card className={isDarkMode ? 'bg-[#0f1729]/80 border-slate-700/50' : 'bg-white/90 border-slate-200'}>
      <div className="overflow-hidden">
        <div className="flex justify-between items-center p-4">
          <h2 className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500`}>
            {currentTask.charAt(0).toUpperCase() + currentTask.slice(1)} Results
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              className={`
                px-4 py-2 rounded-lg text-white transition-all text-base
                bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600
                flex items-center gap-2
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              Compare
            </button>
            
            <CSVLink
              data={csvData.data}
              headers={csvData.headers}
              filename={csvFilename}
              className={`
                px-4 py-2 rounded-lg text-white transition-all text-base
                bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600
                flex items-center gap-2
              `}
              target="_blank"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export
            </CSVLink>
          </div>
        </div>
        
        <div className="overflow-x-auto relative custom-scrollbar">
          <table className={`min-w-full ${currentTask === 'overall' ? 'w-full' : ''} divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-slate-200'}`}>
            <thead className={isDarkMode ? 'bg-[#121c2b]' : 'bg-slate-100'}>
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
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/30' : 'divide-slate-200/70'}`}>
              {renderResultsTable()}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default ResultsTable; 