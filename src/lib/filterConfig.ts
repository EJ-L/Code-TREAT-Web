import { TaskType, Ability } from '@/lib/types';

// Define tasks that have difficulty-based results
export const TASKS_WITH_DIFFICULTY: TaskType[] = [
  'overall',
  'code generation', 
  'input prediction',
  'output prediction'
];

// Simplified filter configuration
export interface FilterConfig {
  key: keyof Ability | 'llmJudges';
  label: string;
  isVisible: (task: TaskType, abilities: Record<TaskType, Ability>, judges?: string[]) => boolean;
  getValues: (task: TaskType, abilities: Record<TaskType, Ability>, judges?: string[]) => string[];
  // Consolidated special behaviors
  specialBehaviors?: {
    displayText?: (value: string, task: TaskType) => string;
    restrictions?: (task: TaskType) => { limit: number; message: string } | null;
    disabling?: (task: TaskType, showByDifficulty: boolean, abilities: Record<TaskType, Ability>) => string[];
    autoSelect?: (task: TaskType, showByDifficulty: boolean) => string[];
  };
}

// Main filter configurations
const MAIN_FILTERS: FilterConfig[] = [
  {
    key: 'dataset',
    label: 'Dataset',
    isVisible: (task, abilities) => 
      task !== 'overall' && (abilities[task]?.dataset?.length || 0) > 1,
    getValues: (task, abilities) => abilities[task]?.dataset || [],
    specialBehaviors: {
      disabling: () => [],
      autoSelect: () => []
    }
  },
  {
    key: 'framework',
    label: 'Framework',
    isVisible: (task, abilities) => 
      task !== 'overall' && (abilities[task]?.framework?.length || 0) > 1,
    getValues: (task, abilities) => abilities[task]?.framework || []
  },
  {
    key: 'llmJudges',
    label: 'LLM Judge',
    isVisible: (task, abilities, judges) => 
      task !== 'overall' && 
      (task === 'code summarization' || task === 'code review') && 
      (judges?.length || 0) > 1,
    getValues: (task, abilities, judges) => judges || []
  }
];

// Dynamic filter generation for other ability keys
function createDynamicFilters(task: TaskType, abilities: Record<TaskType, Ability>): FilterConfig[] {
  if (task === 'overall' || !abilities[task]) return [];
  
  // Base excluded keys for all tasks
  const excludedKeys = ['dataset', 'framework', 'reasoning'];
  
  // Additionally exclude 'knowledge' for specific tasks only
  if (task === 'code generation' || task === 'code translation') {
    excludedKeys.push('knowledge');
  }
  
  const dynamicFilters: FilterConfig[] = [];
  
  Object.entries(abilities[task]).forEach(([key, values]) => {
    if (!excludedKeys.includes(key) && values && values.length > 1) {
      dynamicFilters.push({
        key: key as keyof Ability,
        label: getFilterLabel(key as keyof Ability),
        isVisible: () => true,
        getValues: () => values,
        specialBehaviors: {
          displayText: (value) => getDisplayText(value, key as keyof Ability, task),
          restrictions: () => getFilterRestrictions(key as keyof Ability, task)
        }
      });
    }
  });
  
  return dynamicFilters;
}

// Get all available filters for a task
export function getAvailableFilters(
  task: TaskType, 
  abilities: Record<TaskType, Ability>, 
  judges: string[] = [],
  excludeFilter?: string
): FilterConfig[] {
  const allFilters = [
    ...MAIN_FILTERS.filter(filter => filter.isVisible(task, abilities, judges)),
    ...createDynamicFilters(task, abilities)
  ];
  
  // Filter out the excluded filter if specified
  if (excludeFilter) {
    return allFilters.filter(filter => filter.key !== excludeFilter);
  }
  
  return allFilters;
}

// Utility functions (simplified)
function getFilterLabel(key: keyof Ability): string {
  return capitalizeFirst(key);
}

function getDisplayText(value: string, key: keyof Ability, task: TaskType): string {
  
  // Transform Multi-Modality dataset display names
  if (task === 'multi-modality' && key === 'dataset') {
    const displayMap: Record<string, string> = {
      'Design Generation': 'UI Code Generation',
      'Design Edit': 'UI Code Edit',
      'Design Repair': 'UI Code Repair'
    };
    return displayMap[value] || value;
  }
  
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFilterRestrictions(key: keyof Ability, task: TaskType) {
  return null;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Simplified condition checks
export const filterConditions = {
  hasAvailableFilters: (task: TaskType, abilities: Record<TaskType, Ability>, judges: string[], excludeFilter?: string) =>
    getAvailableFilters(task, abilities, judges, excludeFilter).length > 0,
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldShowDifficultyToggle: (task: TaskType) =>
    false,
  
  shouldShowDataNote: (task: TaskType) =>
    !['multi-modality', 'overall', 'vulnerability detection', 'unit test generation'].includes(task),
  
  shouldShowVulnerabilityMetrics: (task: TaskType) =>
    task === 'vulnerability detection',
  
  shouldShowCodeRobustnessMetrics: (task: TaskType, selectedDatasets?: string[]) => {
    if (task !== 'code-robustness') {
      return false;
    }
    
    // Show metrics for "All" results since they now represent HR+GFG merged data
    // Also show for specific HR/GFG datasets
    if (!selectedDatasets || selectedDatasets.length === 0) {
      return true; // Show metrics for "All" result by default
    }
    
    // Check if any of the selected datasets are HackerRank, GeeksforGeeks, or related
    return selectedDatasets.some(dataset => {
      const lowerDataset = dataset.toLowerCase();
      return lowerDataset.includes('hackerrank') || 
             lowerDataset.includes('geeksforgeeks') || 
             lowerDataset === 'merge' ||
             lowerDataset.includes('merge-hr+gfg') || // Handle new Merge-HR+GFG format
             (lowerDataset === 'hr') || // Handle extracted "hr" from legacy Merge-HR+GFG 
             (lowerDataset === 'gfg') || // Handle extracted "gfg" from GeeksforGeeks
             lowerDataset === 'all'; // Handle "All" tab which represents HR+GFG
    });
  },
  
  
  shouldShowOverallInfo: (task: TaskType) =>
    task === 'overall',
  
  shouldShowDataLeakageWarning: (task: TaskType, selectedDatasets?: string[]) => {
    console.log('DEBUG filterConditions: shouldShowDataLeakageWarning called with task:', task, 'datasets:', selectedDatasets);
    
    // Temporarily disabled data leakage detection for vulnerability and code translation
    // TODO: Re-enable in next version after refinement
    if (task === 'vulnerability detection') {
      console.log('DEBUG filterConditions: vulnerability detection - returning false (temporarily disabled)');
      return false; // Temporarily disabled
    }
    
    if (task === 'code translation') {
      console.log('DEBUG filterConditions: code translation - returning false (temporarily disabled)');
      return false; // Temporarily disabled
      // const result = shouldEnableCodeTranslationDataLeakage(selectedDatasets || []);
      // console.log('DEBUG filterConditions: code translation result:', result);
      // return result;
    }
    
    console.log('DEBUG filterConditions: other task - returning false');
    return false;
  },
    
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldShowTimeline: (task: TaskType) =>
    true
};

// Data note text
export function getDataNoteText(task: TaskType): string {
  return task === 'code-robustness' 
    ? 'Denotes data is not tested since it is already tested in other fields.'
    : 'Denotes data is not yet available.';
} 