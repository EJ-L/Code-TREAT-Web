import React, { useRef, useState, useMemo, useEffect } from 'react';
import { TaskType } from '../../lib/types';

// Define TableHeader interface since it's not in the types file
interface TableHeader {
  key: string;
  label: string;
  width: string;
  description?: string;
  sortable?: boolean;
}

// Simple Tooltip component
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  if (!content) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && content && (
        <div className="absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md shadow-sm 
          dark:bg-gray-700 max-w-xs left-1/2 -translate-x-1/2 -top-10 whitespace-normal">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};

interface ResizableHeaderProps {
  header: TableHeader;
  onResize: (width: number) => void;
  width: string | number;
  task: TaskType;
  isDarkMode: boolean;
}

// Component for resizable table headers
const ResizableHeader: React.FC<ResizableHeaderProps> = ({ header, onResize, width, task, isDarkMode }) => {
  const headerRef = useRef<HTMLTableCellElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [initialPos, setInitialPos] = useState(0);
  const [initialWidth, setInitialWidth] = useState(0);
  

  
  // Calculate minimum width for this header
  const minHeaderWidth = useMemo(() => {
    // Base minimum width calculation
    const textWidth = header.label ? header.label.length * 8 : 80; // Rough estimate: 8px per character
    const paddingSpace = 32; // Account for padding (16px on each side)
    const iconSpace = 24; // Space for sort icons
    
    // Base minimum width using the field's content
    const baseMinWidth = textWidth + paddingSpace + iconSpace;
    
    // Task and field specific minimums (matching the cell minimums)
    if (header.key === 'model') {
      if (task === 'code summarization' || task === 'code review') {
        return Math.max(baseMinWidth, 250); // Adjusted to match parent component width
      }
      if (task === 'code-web') {
        return Math.max(baseMinWidth, 320); // Set higher minimum width for code-web to prevent truncation issues
      }
      return Math.max(baseMinWidth, 200); // Regular model field minimum
    }
    
    if (header.key === 'rank') {
      return Math.max(baseMinWidth, 60);
    }
    
    if (header.key === 'llmjudge') {
      if (task === 'code summarization' || task === 'code review') {
        return Math.max(baseMinWidth, 370); // Adjusted to match parent component width
      }
      return Math.max(baseMinWidth, 100);
    }
    
    // Default minimum for other fields
    return Math.max(baseMinWidth, 80);
  }, [header, task]);

  // Handle mouse down event to start resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    if (headerRef.current) {
      // Get initial position and width when resizing starts
      setInitialPos(e.clientX);
      setInitialWidth(headerRef.current.offsetWidth);
    }
  };

  // Handle mouse move event during resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width based on mouse movement
      const delta = e.clientX - initialPos;
      const newWidth = Math.max(minHeaderWidth, initialWidth + delta);
      
      // Apply the new width
      onResize(newWidth);
    };

    // Handle mouse up event to stop resizing
    const handleMouseUp = () => {
      setIsResizing(false);
    };

    // Add event listeners for mouse move and up when resizing
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, initialPos, initialWidth, onResize, minHeaderWidth]);

  return (
    <th 
      ref={headerRef}
      style={{ 
        width: width, 
        minWidth: `${minHeaderWidth}px`, 
        position: 'relative',
        cursor: 'default',
        userSelect: 'none'
      }}
      className={`
        border-b
        ${isDarkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'}
        font-semibold
        p-4
        text-left
        whitespace-nowrap
        capitalize
        sticky top-0
        ${isDarkMode ? 'bg-[#111827]' : 'bg-white'}
        z-10
      `}
    >
      <div className="flex items-center justify-between w-full h-full">
        <div className="flex items-center gap-1">
          {/* Display header label in a tooltip if there's a description */}
          {header.description ? (
            <Tooltip content={header.description}>
              <span>{header.label || header.key}</span>
            </Tooltip>
          ) : (
            <span>{header.label || header.key}</span>
          )}
        </div>
      </div>
        
      {/* Resizing handle */}
      <div
        className={`
          absolute right-0 top-0 h-full w-1.5 cursor-col-resize
          ${isResizing ? 'bg-blue-500' : 'hover:bg-blue-300'}
          transition-colors duration-200
        `}
        onMouseDown={handleMouseDown}
      />
    </th>
  );
};

// Determine the minimum width for table cells based on column type
const getMinCellWidth = (columnKey: string, taskType: TaskType): string => {
  // Task-specific column minimum widths
  if (columnKey === 'model') {
    if (taskType === 'code summarization' || taskType === 'code review') {
      return '250px'; // Adjusted to match parent component width
    }
    if (taskType === 'code-web') {
      return '320px'; // Set higher minimum width for code-web to prevent truncation issues
    }
    return '200px'; // Regular model cell minimum
  }
  
  if (columnKey === 'rank') {
    return '60px'; // Rank needs minimal space
  }
  
  if (columnKey === 'llmjudge') {
    if (taskType === 'code summarization' || taskType === 'code review') {
      return '370px'; // Adjusted to match parent component width
    }
    return '100px'; // LLM Judge score minimum width
  }
  
  // Default for metrics and other columns
  return '80px';
};

// Apply style to table cells
const getCellStyle = (
  columnKey: string, 
  width: string | number, 
  isDarkMode: boolean,
  taskType: TaskType
): React.CSSProperties => {
  const numericWidth = typeof width === 'number' ? width : parseInt(width.replace('px', ''));
  const minWidth = getMinCellWidth(columnKey, taskType);
  
  return {
    width: width,
    minWidth: minWidth,
    maxWidth: numericWidth > 1000 ? '1000px' : undefined, // Prevent extremely wide columns
    padding: '0.75rem 1rem', // Consistent padding with headers
    textAlign: columnKey === 'rank' ? 'center' : 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: isDarkMode ? '#e2e8f0' : '#334155',
    borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
  };
};

interface LeaderboardTableProps {
  headers: TableHeader[];
  visibleData: Record<string, unknown>[];
  currentTask: TaskType;
  isDarkMode: boolean;
  getColumnWidth: (key: string) => string | number;
  handleColumnResize: (key: string, width: number) => void;
  renderCell: (item: Record<string, unknown>, key: string) => React.ReactNode;
  getRowClass: (index: number) => string;
  needsHorizontalScroll?: boolean;
  calculateTableWidth?: () => number;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ 
  headers, 
  visibleData, 
  currentTask, 
  isDarkMode, 
  getColumnWidth, 
  handleColumnResize, 
  renderCell, 
  getRowClass,
  needsHorizontalScroll = false,
  calculateTableWidth
}) => {
  return (
    <div 
      className="max-h-full w-full" 
      style={{ 
        overflowX: needsHorizontalScroll ? 'auto' : 'hidden',
        overflowY: 'auto',
        scrollbarWidth: 'thin', 
        scrollbarColor: isDarkMode ? '#374151 #1f2937' : '#cbd5e1 #f8fafc' 
      }}
    >
      <div className="min-w-full inline-block align-middle">
        <div className="rounded-md overflow-hidden">
          <table 
            className="min-w-full divide-y"
            style={{ 
              tableLayout: 'fixed', // Enforce fixed layout for better column resizing
              borderCollapse: 'separate',
              borderSpacing: 0,
              minWidth: needsHorizontalScroll && calculateTableWidth ? `${calculateTableWidth()}px` : '100%'
            }}
          >
            <thead>
              <tr>
                {headers.map((header) => (
                  <ResizableHeader
                    key={header.key}
                    header={header}
                    width={getColumnWidth(header.key)}
                    onResize={(width) => handleColumnResize(header.key, width)}
                    task={currentTask}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </tr>
            </thead>
            <tbody className={isDarkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}>
              {visibleData.map((item, index) => (
                <tr 
                  key={`${item.model}-${index}`}
                  className={getRowClass(index)}
                >
                  {headers.map((header) => (
                    <td 
                      key={`${item.model}-${header.key}`} 
                      style={getCellStyle(header.key, getColumnWidth(header.key), isDarkMode, currentTask)}
                    >
                      {renderCell(item, header.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardTable; 