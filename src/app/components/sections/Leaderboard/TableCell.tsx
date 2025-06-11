import { FC } from 'react';
import { TaskType } from '@/lib/types';
import OrganizationLogo from '@/app/components/ui/OrganizationLogo';
import { getOrganizationFromModel } from '@/lib/organization-logos';

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
  truncateText: (text: string, maxWidth: number) => string;
  getTaskSpecificColumnWidth: (task: TaskType, key: string) => string;
  isDarkMode: boolean;
  modelUrl?: string;
}

const TableCell: FC<TableCellProps> = ({
  header,
  value,
  rowIndex,
  currentTask,
  columnWidths,
  resizingColumn,
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
  modelUrl
}) => {
  const alignment = getColumnAlignment(header.key);
  const numericStyles = getNumericStyles(header.key);
  const stickyStyles = getStickyStyles(header.key);
  // Get the background color based on whether the cell is in a sticky column and row index
  const getRowBackgroundColor = () => {
    // For sticky columns, we need to explicitly manage the background color
    if (header.key === 'rank' || header.key === 'model') {
      return isDarkMode 
        ? rowIndex % 2 === 0 ? 'bg-[#0f1729]' : 'bg-[#182338]'
        : rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-100';
    }
    // For non-sticky columns, return empty string as the table row will handle the background
    return '';
  };
  
  const rowBgColor = getRowBackgroundColor();
  const contentWidth = getContentWidth(columnWidths[header.key] || 100);
  
  return (
    <td 
      key={header.key}
      data-key={header.key}
      className={`px-4 py-2 whitespace-nowrap text-xl font-bold font-jetbrains-mono ${alignment} ${numericStyles} ${
        header.key === 'model' 
          ? isDarkMode ? 'text-slate-200 font-bold' : 'text-slate-900 font-bold'
          : isDarkMode ? 'text-slate-300' : 'text-slate-600'
      } ${stickyStyles} ${rowBgColor} ${
        (header.key.startsWith('easy_') || header.key.startsWith('medium_') || header.key.startsWith('hard_')) 
          ? 'py-4' : ''
      }`}
      style={{ 
        width: getTaskSpecificColumnWidth(currentTask, header.key),
        transition: resizingColumn ? 'none' : 'width 0.1s ease',
        left: getStickyLeftPosition(header.key)
      }}
    >
      <div className={`w-full ${alignment} font-bold`}>
        {(() => {
          if (value === null || value === undefined || value === '') {
            return '-';
          }
          
          // Special handling for model names with links
          if (header.key === 'model') {
            // Make sure value is a string
            const modelName = String(value);
            
            // Identify tasks with full model name display but different resize behaviors
            const isSimplifiedLeaderboard = ['overall', 'code summarization', 'code review'].includes(currentTask);
            // Overall task has no model column resizing
            const hasFixedModelWidth = currentTask === 'overall';
            
            // All simplified leaderboards show full model names by default
            // For code-web, be more generous with text space to avoid unnecessary truncation
            const displayText = isSimplifiedLeaderboard 
              ? modelName // Never truncate in simplified leaderboards
              : currentTask === 'code-web' 
                ? (contentWidth >= 200 ? modelName : truncateText(modelName, contentWidth * 2)) // More generous for code-web
                : truncateText(modelName, contentWidth * 1.5); // Use more generous space for other tasks
            
            const organization = getOrganizationFromModel(modelName);
            
            // Use larger logo for all simplified leaderboards
            const logoSize = isSimplifiedLeaderboard ? 20 : 16;
            const logoSpace = (organization && organization !== 'unknown') ? (logoSize + 8) : 0;
            
            // For code review and code summarization, we calculate max width based on available space
            // When user resizes, this will respect the new width
            const modelMaxWidth = hasFixedModelWidth
              ? 'none' // No max width for overall task (fixed percentage width)
              : isSimplifiedLeaderboard
                ? `${Math.max(contentWidth * 2, 400) - logoSpace}px` // Very generous width for code review/summarization
                : currentTask === 'code-web'
                  ? `${Math.max(contentWidth * 2, 300) - logoSpace}px` // More generous width for code-web
                  : `${contentWidth * 1.5 - logoSpace}px`; // Normal behavior for other leaderboards
            
            const modelContent = (
              <div className="flex items-center gap-2 w-full">
                {organization && organization !== 'unknown' && (
                  <OrganizationLogo organization={organization} size={logoSize} />
                )}
                <span 
                  title={modelName}
                  className={`${isSimplifiedLeaderboard || (currentTask === 'code-web' && contentWidth >= 200) ? '' : 'truncate'} inline-block`}
                  style={{ 
                    maxWidth: modelMaxWidth,
                    whiteSpace: hasFixedModelWidth || (currentTask === 'code-web' && contentWidth >= 200) ? 'normal' : 'nowrap',
                    overflow: hasFixedModelWidth || (currentTask === 'code-web' && contentWidth >= 200) ? 'visible' : 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {displayText}
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
            } else if (header.key === 'llmjudge' || header.key === 'LLMJudge') {
              return ((value / 5) * 100).toFixed(1);
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
                className={`truncate inline-block ${style}`}
                style={{ 
                  maxWidth: `${contentWidth}px`,
                  width: isColumnCentered(header.key) ? '100%' : 'auto'
                }}
              >
                {truncateText(value, contentWidth)}
              </span>
            );
          }
          
          return value;
        })()}
      </div>
    </td>
  );
};

export default TableCell; 