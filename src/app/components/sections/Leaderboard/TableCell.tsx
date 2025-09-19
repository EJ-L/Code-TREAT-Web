import { FC } from 'react';
import { TaskType } from '@/lib/types';
import OrganizationLogo from '@/app/components/ui/OrganizationLogo';
import { getOrganizationFromModel } from '@/lib/organization-logos';
import { hasDataLeakage } from '@/lib/constants';

interface TableCellProps {
  header: {
    key: string;
    label: string;
    width: string;
    description: string;
  };
  value: string | number | undefined;
  rowIndex: number;
  currentTask: TaskType;
  columnWidths: Record<string, number>;
  resizingColumn: string | null;
  getContentWidth: (columnWidth: number) => number;
  isColumnCentered: (key: string) => boolean;
  getStickyStyles: (key: string) => string;
  getStickyLeftPosition: (key: string) => string;
  getBackgroundColor: (key: string, isHeaderCell?: boolean) => string;
  getColumnAlignment: (key: string) => string;
  getNumericStyles: (key: string) => string;
  isDarkMode: boolean;
  modelUrl?: string;
  modelName?: string; // Add model name prop for data leakage detection
  dataset?: string; // Add dataset prop for data leakage detection
}

const TableCell: FC<TableCellProps> = ({
  header,
  value,
  rowIndex,
  currentTask,
  columnWidths,
  resizingColumn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getContentWidth,
  isColumnCentered,
  getStickyStyles,
  getStickyLeftPosition,
  getColumnAlignment,
  getNumericStyles,
  isDarkMode,
  modelUrl,
  modelName,
  dataset
}) => {
  const alignment = getColumnAlignment(header.key);
  const numericStyles = getNumericStyles(header.key);
  const stickyStyles = getStickyStyles(header.key);
  // Check if current row has data leakage
  const hasDataLeakageForRow = () => {
    if (!value) return false;
    // For model column, check the model name directly
    if (header.key === 'model') {
      const modelNameToCheck = String(value);
      // For code translation, pass dataset information to hasDataLeakage
      return currentTask === 'code translation' 
        ? hasDataLeakage(modelNameToCheck, currentTask, dataset)
        : hasDataLeakage(modelNameToCheck, currentTask);
    }
    // For rank column, we need to get the model name from the row data
    // We'll pass this information via modelName prop
    if (header.key === 'rank' && modelName) {
      // For code translation, pass dataset information to hasDataLeakage
      return currentTask === 'code translation'
        ? hasDataLeakage(modelName, currentTask, dataset)
        : hasDataLeakage(modelName, currentTask);
    }
    return false;
  };

  // Get the background color based on whether the cell is in a sticky column and row index
  const getRowBackgroundColor = () => {
    // For sticky columns, we need to explicitly manage the background color to match the row
    if (header.key === 'rank' || header.key === 'model') {
      // Normal alternating row colors (no pink background here anymore)
      return isDarkMode 
        ? rowIndex % 2 === 0 ? 'bg-[#0f1729]' : 'bg-[#182338]'
        : rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-100';
    }
    // For non-sticky columns, return empty string as the table row will handle the background
    return '';
  };
  
  const rowBgColor = getRowBackgroundColor();

  return (
    <td 
      key={header.key}
      data-key={header.key}
      className={`px-2 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-sm sm:text-lg lg:text-xl font-bold font-jetbrains-mono ${alignment} ${numericStyles} ${
        header.key === 'model' 
          ? isDarkMode ? 'text-slate-200 font-bold' : 'text-slate-900 font-bold'
          : isDarkMode ? 'text-slate-300' : 'text-slate-600'
      } ${stickyStyles} ${rowBgColor} ${
        (header.key.startsWith('easy_') || header.key.startsWith('medium_') || header.key.startsWith('hard_')) 
          ? 'py-3 sm:py-4' : ''
      } ${isDarkMode ? 'border-b border-white/10' : 'border-b border-black/10'}`}
      style={{ 
        width: `${columnWidths[header.key] || 100}px`,
        transition: resizingColumn ? 'none' : 'width 0.1s ease',
        left: getStickyLeftPosition(header.key),
        verticalAlign: 'middle'
      }}
    >
      <div className={`w-full ${alignment} font-bold flex items-center ${
        isColumnCentered(header.key) ? 'justify-center' : 'justify-start'
      } ${
        // Special styling for difficulty columns
        (header.key.startsWith('easy_') || header.key.startsWith('medium_') || header.key.startsWith('hard_')) 
          ? 'text-sm sm:text-base lg:text-lg' : ''
      }`}>
        {(() => {
          const content = (() => {
          if (value === null || value === undefined || value === '') {
            return '-';
          }
          
          // Special handling for model names with links
          if (header.key === 'model') {
            // Make sure value is a string
            const modelName = String(value);
            
            // Identify tasks with full model name display but different resize behaviors
            const isSimplifiedLeaderboard = ['overall', 'code summarization', 'code review'].includes(currentTask);
            
            const organization = getOrganizationFromModel(modelName);
            
            // Use larger logo for all simplified leaderboards
            const logoSize = isSimplifiedLeaderboard ? 20 : 16;
            
            const modelContent = (
              <div className="flex items-center gap-2 w-full">
                {organization && organization !== 'unknown' && (
                  <OrganizationLogo organization={organization} size={logoSize} />
                )}
                <span 
                  title={modelName}
                  className={`text-ellipsis overflow-hidden whitespace-nowrap flex-1 min-w-0 ${
                    hasDataLeakageForRow() 
                      ? isDarkMode ? 'text-pink-200' : 'text-pink-600'
                      : ''
                  }`}
                >
                  {modelName}
                </span>
              </div>
            );
            
            if (modelUrl) {
              return (
                <a 
                  href={modelUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-blue-500 transition-colors font-semibold text-left w-full block"
                  title={modelName}
                >
                  {modelContent}
                </a>
              );
            }
            return modelContent;
          }
          
          if (typeof value === 'number') {
            // Special handling for percentage values
            if (['pass@1', 'pass@3', 'pass@5', 'CodeBLEU', 'Execution', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'P-C', 'P-V', 'P-B', 'P-R'].includes(header.key)) {
              return (value * 100).toFixed(1);
            } else if (header.key === 'llmjudge' || header.key === 'LLMJudge' || header.key === 'LLM Judge') {
              // For LLM Judge, the precomputed values are already percentages as strings
              // Only apply conversion if it's a raw score (number between 0-5)
              if (typeof value === 'number' && value <= 5) {
                return ((value / 5) * 100).toFixed(1);
              }
              // For precomputed string values like "96.5", display as-is
              return value;
            }
            // For rank, just show the number
            return value;
          }
          
          // If the value is a string but contains a percentage, convert it to the new format
          if (typeof value === 'string' && value.endsWith('%')) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              return numValue.toFixed(1);
            }
          }
          
          // For other string values, truncate if needed
          if (typeof value === 'string') {
            const style = isColumnCentered(header.key) ? 'text-center' : 'text-left';
            
            return (
              <span 
                title={value} 
                className={`text-ellipsis overflow-hidden whitespace-nowrap ${style} w-full block`}
              >
                {value}
              </span>
            );
          }
          
          return value;
          })();

          // For rank column, wrap content with pink text if data leakage detected
          if (header.key === 'rank' && hasDataLeakageForRow()) {
            return (
              <span className={isDarkMode ? 'text-pink-200' : 'text-pink-600'}>
                {content}
              </span>
            );
          }

          return content;
        })()}
      </div>
    </td>
  );
};

export default TableCell; 