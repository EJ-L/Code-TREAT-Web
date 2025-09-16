import { FC } from 'react';
import { TaskType } from '@/lib/types';

interface TableHeaderProps {
  header: {
    key: string;
    label: string;
    width: string;
    description: string;
  };
  currentTask: TaskType;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  columnWidths: Record<string, number>;
  resizingColumn: string | null;
  handleSort: (key: string) => void;
  handleResizeStart: (e: React.MouseEvent, key: string) => void;
  getContentWidth: (columnWidth: number) => number;
  isColumnCentered: (key: string) => boolean;
  getStickyStyles: (key: string) => string;
  getStickyLeftPosition: (key: string) => string;
  getBackgroundColor: (key: string, isHeaderCell?: boolean) => string;
  isDarkMode: boolean;
}

// Helper function to format difficulty headers
const formatDifficultyHeader = (label: string): JSX.Element => {
  // Check if it's a difficulty-specific header
  if (label.startsWith('Easy ') || label.startsWith('Medium ') || label.startsWith('Hard ')) {
    const [difficulty, metric] = label.split(' ');
    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-sm sm:text-base md:text-lg font-extrabold">{difficulty}</span>
        <span className="text-xs sm:text-sm font-medium">{metric}</span>
      </div>
    );
  }
  return <span className="flex items-center justify-center">{label}</span>;
};

const TableHeader: FC<TableHeaderProps> = ({
  header,
  currentTask,
  sortConfig,
  columnWidths,
  resizingColumn,
  handleSort,
  handleResizeStart,
  getContentWidth,
  isColumnCentered,
  getStickyStyles,
  getStickyLeftPosition,
  getBackgroundColor,
  isDarkMode
}) => {
  const alignment = isColumnCentered(header.key) ? 'justify-center' : 'justify-start';
  const stickyStyles = getStickyStyles(header.key);
  const bgColor = getBackgroundColor(header.key, true);
  
  // Calculate column width
  const columnWidth = (currentTask === 'overall' && header.key === 'model') 
    ? '80%' // Give model column 80% of table width in overall task
    : `${columnWidths[header.key] || 100}px`;

  return (
    <th 
      key={header.key} 
      data-key={header.key}
      className={`relative px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm lg:text-base font-extrabold uppercase tracking-wider cursor-pointer font-jetbrains-mono group ${alignment} ${
        // Only apply base background colors if getBackgroundColor doesn't return a custom color
        bgColor ? '' : (isDarkMode 
          ? 'text-slate-300 bg-[#121c2b]' 
          : 'text-slate-600 bg-slate-100')
      } ${
        // Apply text color based on theme
        isDarkMode ? 'text-slate-300' : 'text-slate-600'
      } ${stickyStyles} ${bgColor} ${
        (header.key.startsWith('easy_') || header.key.startsWith('medium_') || header.key.startsWith('hard_')) 
          ? 'py-3 sm:py-4' : ''
      } ${isDarkMode ? 'border-b border-white/20' : 'border-b border-black/20'}`}
      style={{ 
        width: columnWidth,
        transition: resizingColumn ? 'none' : 'width 0.1s ease',
        left: getStickyLeftPosition(header.key)
      }}
      onClick={() => {
        // Enable sorting for all numeric columns including difficulty-based metrics and model names
        const sortableColumns = [
          'rank', 'model', // Add model to sortable columns
          'pass@1', 'pass@3', 'pass@5', 
          'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
          'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
          'easy_pass@5', 'medium_pass@5', 'hard_pass@5',
          'CodeBLEU', 'LLMJudge', 'llmjudge', 'LLM Judge', 'Execution',
          // Vulnerability detection metrics
          'Accuracy', 'Precision', 'Recall', 'F1 Score',
          'P-C', 'P-V', 'P-B', 'P-R',
          // Code-web metrics
          'CLIP', 'Compilation',
          // Interaction-2-code metrics
          'SSIM', 'Text', 'Position', 'Implement Rate',
          // Code-robustness metrics
          'VAN', 'ALL', 'MDC', 'MPS', 'MHC',
          // MR-Web metrics
          'MAE', 'NEMD', 'RER',
          // Unit Test Generation metrics
          'Vanilla', 'PSC-ALL', 'MCC'
        ];
        if (sortableColumns.includes(header.key)) {
          handleSort(header.key);
        }
      }}
    >
      <div className={`flex items-center ${isColumnCentered(header.key) ? 'justify-center' : 'justify-start'} w-full`}>
        {/* For centered columns, we need to account for the sort indicator space */}
        {isColumnCentered(header.key) ? (
          <>
            {/* Invisible spacer to balance the sort indicator on the right */}
            <span className="w-6 h-6 shrink-0 invisible"></span>
            <span 
              className="text-ellipsis overflow-hidden whitespace-nowrap block text-lg flex items-center justify-center flex-1" 
              style={{ 
                maxWidth: `${getContentWidth(columnWidths[header.key] || (
                  currentTask === 'code summarization' || currentTask === 'code review' ? 250 :
                  currentTask === 'vulnerability detection' ? 350 :
                  300
                ))}px`,
                minWidth: header.label.length * 10 + 'px'
              }}
              {...(header.description ? { title: header.description } : {})}
            >
              {formatDifficultyHeader(header.label)}
            </span>
          </>
        ) : (
          /* For left-aligned columns (model), use normal layout */
          <span 
            className="text-ellipsis overflow-hidden whitespace-nowrap block text-lg flex items-center justify-center" 
            style={{ 
              maxWidth: `${getContentWidth(columnWidths[header.key] || (
                currentTask === 'code summarization' || currentTask === 'code review' ? 250 :
                currentTask === 'vulnerability detection' ? 350 :
                300
              ))}px`,
              width: 'auto',
              minWidth: header.label.length * 10 + 'px'
            }}
            {...(header.description ? { title: header.description } : {})}
          >
            {formatDifficultyHeader(header.label)}
          </span>
        )}
        {/* Sort indicator */}
        <span className={`ml-2 shrink-0 min-w-[20px] transition-all duration-200 ${
          sortConfig && sortConfig.key === header.key 
            ? 'text-amber-500 opacity-100 scale-110' 
            : isDarkMode ? 'text-slate-400 opacity-60 group-hover:text-blue-400 group-hover:opacity-80' : 'text-slate-500 opacity-60 group-hover:text-blue-500 group-hover:opacity-80'
        }`}>
          {sortConfig && sortConfig.key === header.key ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              {sortConfig.direction === 'asc' ? (
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              )}
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
            </svg>
          )}
        </span>
      </div>
      {/* Resize handle - a more subtle line that doesn't extend to the edges */}
      <div 
        className={`absolute right-0 top-0 h-full ${header.key === 'rank' || (currentTask === 'overall' && header.key === 'model') ? '' : 'cursor-col-resize'} flex items-center justify-center`}
        onMouseDown={(e) => header.key !== 'rank' && !(currentTask === 'overall' && header.key === 'model') && handleResizeStart(e, header.key)}
        onClick={(e) => e.stopPropagation()} // Prevent sort on resize handle click
      >
        {resizingColumn === header.key ? (
          <div className={`h-[60%] w-px ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
        ) : (
          <div className={`h-[60%] w-px ${(currentTask === 'overall' && header.key === 'model') ? 'hidden' : isDarkMode ? 'bg-gray-600/60' : 'bg-gray-300'}`}></div>
        )}
        {/* Add a slight expansion effect for easier targeting */}
        <div className="absolute inset-y-0 -inset-x-1.5 hover:bg-blue-400/10 group-hover:bg-blue-400/5"></div>
      </div>
    </th>
  );
};

export default TableHeader; 