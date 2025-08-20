import { FC } from 'react';
import ClientOnlyCSVLink from '@/app/components/ui/ClientOnlyCSVLink';
import { TaskType } from '@/lib/types';

interface LeaderboardHeaderProps {
  currentTask: TaskType;
  isDarkMode: boolean;
  viewMode: 'table' | 'scatter';
  setViewMode: (mode: 'table' | 'scatter') => void;
  setIsComparisonModalOpen: (isOpen: boolean) => void;
  shouldShowChartButton: boolean;
  csvData: { headers: any[]; data: any[] };
  csvFilename: string;
}

const LeaderboardHeader: FC<LeaderboardHeaderProps> = ({
  currentTask,
  isDarkMode,
  viewMode,
  setViewMode,
  setIsComparisonModalOpen,
  shouldShowChartButton,
  csvData,
  csvFilename
}) => {
  return (
    <div className={`w-full py-6 ${isDarkMode ? 'bg-[#0f1729]' : 'bg-white'} border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
      <div className="container mx-auto px-4">
        {/* Main Title - Very Large and Centered */}
        <div className="text-center mb-6">
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)', // Responsive very large text
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0',
            lineHeight: '1.1'
          }}>
            {currentTask.charAt(0).toUpperCase() + currentTask.slice(1)} Results
          </h1>
        </div>
        
        {/* Buttons Section - Centered Under Title */}
        <div className="flex flex-wrap justify-center items-center gap-4">
          {/* Hide compare button for overall task since there are no metrics to compare */}
          {currentTask !== 'overall' && (
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '24px', width: '24px' }} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              Compare
            </button>
          )}
          
          {/* Show chart view button only when we have metrics and data */}
          {shouldShowChartButton && (
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'scatter' : 'table')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
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
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '24px', width: '24px' }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
                  </svg>
                  Chart View
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '24px', width: '24px' }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3zM3 9a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V9zM4 14a1 1 0 00-1 1v3a1 1 0 001 1h12a1 1 0 001-1v-3a1 1 0 00-1-1H4z"/>
                  </svg>
                  Table View
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
               style={{
                 background: 'linear-gradient(to right, #10b981, #14b8a6)'
               }}>
            <ClientOnlyCSVLink
              data={csvData.data}
              headers={csvData.headers}
              filename={csvFilename}
              className="flex items-center gap-2 text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '24px', width: '24px' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export
            </ClientOnlyCSVLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardHeader;
