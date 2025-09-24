import { TaskType } from './types';
import { 
  getTaskHeaders, 
  getColumnWidth, 
  shouldUseSticky,
  getDefaultSortDirection,
  HeaderConfig,
  TASKS_WITH_DIFFICULTY
} from './leaderboardConfig';

// Column width management
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function initializeColumnWidths(
  task: TaskType, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showByDifficulty: boolean = false
): Record<string, number> {
  const headers = getTaskHeaders(task);
  const newWidths: Record<string, number> = {};
  
  headers.forEach(header => {
    newWidths[header.key] = getColumnWidth(task, header.key);
  });
  
  return newWidths;
}

// Filter headers based on data availability
export function getFilteredTableHeaders(
  task: TaskType,
  showByDifficulty: boolean,
  sortedResults: Record<string, unknown>[]
): HeaderConfig[] {
  const allHeaders = getTaskHeaders(task);
  
  // Keep rank and model headers
  const fixedHeaders = allHeaders.filter(header => 
    header.key === 'rank' || header.key === 'model'
  );
  
  // Filter metric headers based on data availability
  const metricHeaders = allHeaders.filter(header => 
    header.key !== 'rank' && header.key !== 'model'
  );
  
  // For code summarization and code review, always show LLM Judge if it's defined in headers
  if (task === 'code summarization' || task === 'code review') {
    const llmJudgeHeader = metricHeaders.find(h => h.key === 'LLM Judge');
    if (llmJudgeHeader) {
      const otherHeaders = metricHeaders.filter(h => h.key !== 'LLM Judge');
      return [...fixedHeaders, llmJudgeHeader, ...otherHeaders];
    }
  }
  
  // Only keep headers where at least one result has a non-empty value
  const filteredMetricHeaders = metricHeaders.filter(header => {
    const hasData = sortedResults.some(result => {
      const value = result[header.key];
      const isValid = value !== null && value !== undefined && value !== '-' && value !== '';
      return isValid;
    });
    
    return hasData;
  });
  
  return [...fixedHeaders, ...filteredMetricHeaders];
}

// Update column widths for filtered headers
export function updateColumnWidthsForFilteredHeaders(
  task: TaskType,
  filteredHeaders: HeaderConfig[],
  currentColumnWidths: Record<string, number>
): Record<string, number> {
  const newWidths: Record<string, number> = {};
  
  filteredHeaders.forEach(header => {
    // If we already have a width for this header, use it
    if (currentColumnWidths[header.key]) {
      newWidths[header.key] = currentColumnWidths[header.key];
    } else {
      // Otherwise calculate a new width
      newWidths[header.key] = getColumnWidth(task, header.key);
    }
  });
  
  return newWidths;
}

// Column styling helpers
export function isColumnCentered(key: string): boolean {
  return key !== 'model';
}

export function getColumnAlignment(key: string): string {
  return key === 'model' ? 'text-left' : 'text-center';
}

export function getNumericStyles(key: string): string {
  return isColumnCentered(key) ? 'tabular-nums lining-nums' : '';
}

export function getContentWidth(columnWidth: number): number {
  // More conservative padding reduction that accounts for:
  // - Responsive padding (px-2 sm:px-4 lg:px-6)
  // - Sort indicator space (20px minimum)
  // - Some buffer for text overflow prevention
  return Math.max(columnWidth - 16, 30);
}

// Sticky column helpers
export function getStickyStyles(task: TaskType, key: string): string {
  if (!shouldUseSticky(task)) {
    if (key === 'rank' || key === 'model') {
      return 'sticky left-0 z-10';
    }
  }
  return '';
}

export function getStickyLeftPosition(task: TaskType, key: string, columnWidths: Record<string, number>): string {
  if (!shouldUseSticky(task)) {
    if (key === 'model') {
      return `${columnWidths['rank'] || 150}px`;
    }
    if (key === 'rank') {
      return '0px';
    }
  }
  return '0px';
}

// Background color helpers
export function getBackgroundColor(
  task: TaskType, 
  key: string, 
  isDarkMode: boolean, 
  isHeaderCell: boolean = false
): string {
  if (!shouldUseSticky(task)) {
    if (key === 'rank' || key === 'model') {
      if (isHeaderCell) {
        return isDarkMode ? 'bg-[#121c2b]' : 'bg-slate-100';
      }
      return isDarkMode ? 'bg-[#0f1729]' : 'bg-white';
    }
  }
  return '';
}

// Text truncation helper
export function truncateText(text: string, maxWidth: number): string {
  if (!text) return '';
  
  const stringValue = String(text);
  const maxChars = Math.floor(maxWidth / 8); // Approximate character width
  
  if (stringValue.length <= maxChars) {
    return stringValue;
  }
  
  return stringValue.substring(0, maxChars - 3) + '...';
}

// Task-specific column width helper
export function getTaskSpecificColumnWidth(task: TaskType, key: string): string {
  // Return appropriate Tailwind class based on task and key
  // This is used for legacy compatibility
  const width = getColumnWidth(task, key);
  
  // Convert pixel width to appropriate Tailwind class (approximate)
  if (width <= 64) return 'w-16';
  if (width <= 96) return 'w-24';
  if (width <= 128) return 'w-32';
  if (width <= 144) return 'w-36';
  if (width <= 192) return 'w-48';
  if (width <= 256) return 'w-64';
  if (width <= 320) return 'w-80';
  if (width <= 384) return 'w-96';
  
  return 'w-auto';
}

// Default sort configuration
export function getDefaultSortConfig(task: TaskType): { key: string; direction: 'asc' | 'desc' } {
  // Default sort by Pass@1 for most tasks, rank for overall
  let defaultKey = 'pass@1';
  
  if (task === 'overall') {
    defaultKey = 'rank';
  } else if (task === 'code summarization' || task === 'code review') {
    defaultKey = 'LLM Judge';
  } else if (task === 'vulnerability detection') {
    defaultKey = 'Accuracy';
  } else if (task === 'multi-modality') {
    defaultKey = 'MLLM_Score';
  } else if (task === 'code-robustness') {
    defaultKey = 'ALL';
  } else if (task === 'unit test generation') {
    defaultKey = 'line_coverage';
  }
  
  return {
    key: defaultKey,
    direction: getDefaultSortDirection(defaultKey)
  };
}

// Check if task supports difficulty view
export function supportsShowByDifficulty(task: TaskType): boolean {
  return TASKS_WITH_DIFFICULTY.includes(task);
}

// Sorting helpers
export function parseValueForSorting(value: string | number | undefined): number {
  if (value === undefined) return -Infinity;
  if (typeof value === 'number') return value;
  
  // Try to extract numeric value from percentage strings
  if (typeof value === 'string' && value.endsWith('%')) {
    const numValue = parseFloat(value.replace('%', ''));
    return isNaN(numValue) ? -Infinity : numValue;
  }
  
  // Try to convert string to number
  const numValue = parseFloat(String(value));
  return isNaN(numValue) ? -Infinity : numValue;
}

export function sortResults(
  data: Record<string, unknown>[], 
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null
): Record<string, unknown>[] {
  if (!sortConfig) return data;

  const sortableData = [...data];
  
  // Special handling for rank column - sort by original rank values
  if (sortConfig.key === 'rank') {
    sortableData.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aRank = parseValueForSorting((a as any).rank);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bRank = parseValueForSorting((b as any).rank);
      
      // Always sort rank in ascending order for "reset" behavior
      return aRank - bRank;
    });
    
    // Don't update ranks when sorting by rank - preserve original values
    return sortableData;
  }
  
  sortableData.sort((a, b) => {
    // Special handling for model names (string sorting)
    if (sortConfig.key === 'model') {
      const aModel = String(a[sortConfig.key] || '').toLowerCase();
      const bModel = String(b[sortConfig.key] || '').toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aModel.localeCompare(bModel);
      } else {
        return bModel.localeCompare(aModel);
      }
    }

    // Get values for comparison, handling all metrics including difficulty-based ones
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aValue = parseValueForSorting((a as any)[sortConfig.key]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bValue = parseValueForSorting((b as any)[sortConfig.key]);
    
    // Sort direction
    if (sortConfig.direction === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  // Update ranks to reflect new sort order for non-rank columns
  return sortableData.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

// Handle sort configuration changes
export function handleSortChange(
  currentSortConfig: { key: string; direction: 'asc' | 'desc' } | null,
  key: string
): { key: string; direction: 'asc' | 'desc' } {
  // If this column is already being sorted, reverse the direction
  if (currentSortConfig && currentSortConfig.key === key) {
    const newDirection = currentSortConfig.direction === 'asc' ? 'desc' : 'asc';
    return { key, direction: newDirection };
  }

  // Use default sort direction for the key
  return {
    key,
    direction: getDefaultSortDirection(key)
  };
}

// Export max column width helper
export { getMaxColumnWidth } from './leaderboardConfig'; 