import React, { FC, useState, useEffect } from 'react';
import { TaskType } from '@/lib/types';
import { getMultiLeaderboardConfig } from '@/lib/leaderboardConfig';

interface MultiLeaderboardHeaderProps {
  currentTask: TaskType;
  selectedTab: string;
  onTabChange: (tab: string) => void;
  isDarkMode: boolean;
}

const MultiLeaderboardHeader: FC<MultiLeaderboardHeaderProps> = ({
  currentTask,
  selectedTab,
  onTabChange,
  isDarkMode
}) => {
  const config = getMultiLeaderboardConfig(currentTask);
  const [currentPage, setCurrentPage] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setIsSmallScreen] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Reset to page 0 when task changes
  useEffect(() => {
    setCurrentPage(0);
  }, [currentTask]);

  // Get task-specific tabs per page
  const getTabsPerPage = () => {
    // For code-robustness, use 3 tabs per page to show All, CRUXEval, LiveCodeBench on first page
    if (currentTask === 'code-robustness') return 3;
    return 6; // Default for other tasks
  };

  // Auto-navigate to page containing selected tab
  useEffect(() => {
    if (!config) return;
    
    const tabsPerPage = getTabsPerPage();
    const shouldPaginate = config.tabs.length > tabsPerPage;
    
    if (shouldPaginate) {
      const selectedIndex = config.tabs.indexOf(selectedTab);
      if (selectedIndex !== -1) {
        const targetPage = Math.floor(selectedIndex / tabsPerPage);
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
        }
      }
    }
  }, [selectedTab, config, currentPage]);

  // Handle pending tab changes after page changes
  useEffect(() => {
    if (pendingTabChange) {
      onTabChange(pendingTabChange);
      setPendingTabChange(null);
    }
  }, [pendingTabChange, onTabChange]);
  
  if (!config) {
    return null;
  }

  const tabsPerPage = getTabsPerPage();
  const totalPages = Math.ceil(config.tabs.length / tabsPerPage);
  const shouldPaginate = config.tabs.length > tabsPerPage;

  const getVisibleTabs = () => {
    if (!shouldPaginate) {
      return config.tabs;
    }
    const startIndex = currentPage * tabsPerPage;
    return config.tabs.slice(startIndex, startIndex + tabsPerPage);
  };

  const visibleTabs = getVisibleTabs();
  const showPagination = shouldPaginate;

  const handlePrevPage = () => {
    setCurrentPage(prev => {
      const newPage = Math.max(0, prev - 1);
      console.log('Previous page clicked:', prev, '->', newPage);
      
      // Schedule tab change for the first tab in the new page
      const startIndex = newPage * tabsPerPage;
      const firstTabInPage = config.tabs[startIndex];
      if (firstTabInPage && firstTabInPage !== selectedTab) {
        setPendingTabChange(firstTabInPage);
      }
      
      return newPage;
    });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => {
      const newPage = Math.min(totalPages - 1, prev + 1);
      console.log('Next page clicked:', prev, '->', newPage, 'totalPages:', totalPages);
      
      // Schedule tab change for the first tab in the new page
      const startIndex = newPage * tabsPerPage;
      const firstTabInPage = config.tabs[startIndex];
      if (firstTabInPage && firstTabInPage !== selectedTab) {
        setPendingTabChange(firstTabInPage);
      }
      
      return newPage;
    });
  };

  return (
    <div className="w-full">
      <div className={`rounded-t-lg border border-b-0 ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div className="relative">
          {/* Previous button for pagination */}
          {showPagination && currentPage > 0 && (
            <button
              onClick={handlePrevPage}
              className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 transition-colors ${
                isDarkMode 
                  ? 'text-slate-300 hover:text-white' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-label="Previous tabs"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Navigation tabs */}
          <nav className={`flex ${showPagination ? 'pl-12 pr-12' : ''} ${!showPagination ? 'overflow-x-auto scrollbar-hide' : ''}`}>
            {visibleTabs.map((tab, index) => {
              const originalIndex = config.tabs.indexOf(tab);
              const isFirst = originalIndex === 0;
              const isLast = originalIndex === config.tabs.length - 1;
              
              return (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`
                    whitespace-nowrap py-2 sm:py-3 px-2 sm:px-4 lg:px-6 font-medium text-xs sm:text-sm lg:text-base
                    transition-all duration-200 relative min-w-0 flex items-center justify-center
                    ${!showPagination ? 'flex-1' : 'flex-grow'}
                    ${isFirst && !showPagination ? 'rounded-tl-lg' : ''}
                    ${isLast && !showPagination ? 'rounded-tr-lg' : ''}
                    ${selectedTab === tab
                      ? isDarkMode
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-blue-500 text-white shadow-sm'
                      : isDarkMode
                        ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }
                    ${index < visibleTabs.length - 1 && selectedTab !== tab && selectedTab !== visibleTabs[index + 1] 
                      ? isDarkMode 
                        ? 'border-r border-slate-600' 
                        : 'border-r border-slate-300'
                      : ''
                    }
                  `}
                  style={!showPagination ? {
                    flexBasis: `${100 / visibleTabs.length}%`,
                    maxWidth: `${100 / visibleTabs.length}%`
                  } : undefined}
                >
                  <span className="truncate">{tab}</span>
                </button>
              );
            })}
          </nav>

          {/* Next button for pagination */}
          {showPagination && currentPage < totalPages - 1 && (
            <button
              onClick={handleNextPage}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-2 transition-colors ${
                isDarkMode 
                  ? 'text-slate-300 hover:text-white' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-label="Next tabs"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Pagination indicators */}
        {showPagination && totalPages > 1 && (
          <div className="flex justify-center py-2 space-x-1">
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <button
                key={pageIndex}
                onClick={() => setCurrentPage(pageIndex)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  pageIndex === currentPage
                    ? isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                    : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'
                }`}
                aria-label={`Go to page ${pageIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiLeaderboardHeader;
