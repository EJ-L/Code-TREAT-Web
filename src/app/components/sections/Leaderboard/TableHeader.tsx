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
      className={`relative px-6 py-4 text-base font-extrabold uppercase tracking-wider cursor-pointer font-jetbrains-mono group ${alignment} ${
        isDarkMode 
          ? 'text-slate-300 bg-[#151d2a]' 
          : 'text-slate-600 bg-slate-50'
      } ${stickyStyles} ${bgColor}`}
      style={{ 
        width: columnWidth,
        transition: resizingColumn ? 'none' : 'width 0.1s ease',
        left: getStickyLeftPosition(header.key)
      }}
      onClick={() => {
        // Enable sorting for all numeric columns including difficulty-based metrics
        const sortableColumns = [
          'rank', 
          'pass@1', 'pass@3', 'pass@5', 
          'easy_pass@1', 'medium_pass@1', 'hard_pass@1',
          'easy_pass@3', 'medium_pass@3', 'hard_pass@3',
          'easy_pass@5', 'medium_pass@5', 'hard_pass@5',
          'CodeBLEU', 'LLMJudge', 'llmjudge', 'Execution',
          // 漏洞检测特定指标
          'Accuracy', 'Precision', 'Recall', 'F1 Score',
          'P-C', 'P-V', 'P-B', 'P-R'
        ];
        if (sortableColumns.includes(header.key)) {
          handleSort(header.key);
        }
      }}
    >
      <div className={`flex items-center ${isColumnCentered(header.key) ? 'justify-center' : 'justify-start'} w-full`}>
        <span 
          className="text-ellipsis overflow-hidden whitespace-nowrap block text-lg" 
          style={{ 
            maxWidth: `${getContentWidth(columnWidths[header.key] || 100)}px`,
            width: isColumnCentered(header.key) ? '100%' : 'auto',
            // Adding padding to ensure text is fully visible on initial load
            minWidth: header.label.length * 10 + 'px'
          }}
          {...(header.description ? { title: header.description } : {})}
        >
          {header.label}
        </span>
        {/* Sort indicator */}
        <span className="ml-1 text-sm opacity-50 shrink-0 min-w-[12px]">
          {sortConfig && sortConfig.key === header.key ? (
            sortConfig.direction === 'asc' ? '↑' : '↓'
          ) : '↕'}
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