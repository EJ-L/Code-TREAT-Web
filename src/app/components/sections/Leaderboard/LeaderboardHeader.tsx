import { FC } from 'react';
import ClientOnlyCSVLink from '@/app/components/ui/ClientOnlyCSVLink';
import { TaskType } from '@/lib/types';
import { ScatterChartRef } from '@/app/components/ui/ModelScatterChart';

interface LeaderboardHeaderProps {
  currentTask: TaskType;
  isDarkMode: boolean;
  viewMode: 'table' | 'scatter';
  setViewMode: (mode: 'table' | 'scatter') => void;
  setIsComparisonModalOpen: (isOpen: boolean) => void;
  shouldShowChartButton: boolean;
  csvData: { headers: { label: string; key: string }[]; data: Record<string, string | number>[] };
  csvFilename: string;
  chartExportRef?: React.RefObject<ScatterChartRef>;
}

const LeaderboardHeader: FC<LeaderboardHeaderProps> = ({
  currentTask,
  isDarkMode,
  viewMode,
  setViewMode,
  setIsComparisonModalOpen,
  shouldShowChartButton,
  csvData,
  csvFilename,
  chartExportRef
}) => {
  
  // Handle export based on current view mode
  const handleExport = () => {
    if (viewMode === 'scatter' && chartExportRef?.current) {
      // Export chart as SVG
      chartExportRef.current.exportChart();
    }
    // CSV export is handled by ClientOnlyCSVLink component automatically
  };
  return (
    <div 
      className={`w-full py-8 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
      style={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f1729 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
        position: 'relative'
      }}
    >
      {/* Subtle overlay pattern */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDarkMode
            ? 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }}
      />
      <div className="container mx-auto px-4" style={{ position: 'relative', zIndex: 1 }}>
        {/* Main Title - Responsive */}
        <div className="text-center mb-4 md:mb-6">
          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 3.5rem)', // More responsive size range
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0',
            lineHeight: '1.2',
            maxWidth: '100%', // Allow full width on mobile
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {(() => {
              if (currentTask === 'code-web') return 'Multi-Modality';
              if (currentTask === 'code-robustness') return 'Code-Robustness';
              return currentTask.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            })()}
          </h1>
        </div>
        
        {/* Buttons Section - Responsive Layout */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-2 sm:gap-4">
          {/* Hide compare button for overall task since there are no metrics to compare */}
          {currentTask !== 'overall' && (
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-white font-medium text-sm sm:text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg min-w-0"
              style={{
                background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              <span className="hidden xs:inline sm:inline">Compare</span>
              <span className="xs:hidden sm:hidden">Compare</span>
            </button>
          )}
          
          {/* Show chart view button only when we have metrics and data */}
          {shouldShowChartButton && (
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'scatter' : 'table')}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-white font-medium text-sm sm:text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg min-w-0"
              style={{
                background: viewMode === 'table' 
                  ? 'linear-gradient(to right, #f59e0b, #d97706)' 
                  : 'linear-gradient(to right, #10b981, #14b8a6)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {viewMode === 'table' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
                  </svg>
                  <span className="hidden sm:inline">{viewMode === 'table' ? 'Chart View' : 'Table View'}</span>
                  <span className="sm:hidden">Chart</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3zM3 9a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V9zM4 14a1 1 0 00-1 1v3a1 1 0 001 1h12a1 1 0 001-1v-3a1 1 0 00-1-1H4z"/>
                  </svg>
                  <span className="hidden sm:inline">Table View</span>
                  <span className="sm:hidden">Table</span>
                </>
              )}
            </button>
          )}

          {viewMode === 'scatter' ? (
            // Chart view - Export as SVG
            <button 
              onClick={handleExport}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-white font-medium text-sm sm:text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer min-w-0"
              style={{
                background: 'linear-gradient(to right, #10b981, #14b8a6)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Export Chart</span>
              <span className="sm:hidden">Export</span>
            </button>
          ) : (
            // Table view - Export as CSV
            <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-white font-medium text-sm sm:text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer min-w-0"
                 style={{
                   background: 'linear-gradient(to right, #10b981, #14b8a6)'
                 }}>
              <ClientOnlyCSVLink
                data={csvData.data}
                headers={csvData.headers}
                filename={csvFilename}
                className="flex items-center gap-1 sm:gap-2 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </ClientOnlyCSVLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardHeader;
