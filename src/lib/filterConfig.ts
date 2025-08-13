import { TaskType, Ability } from '@/lib/types';

// Define tasks that have difficulty-based results
export const TASKS_WITH_DIFFICULTY: TaskType[] = [
  'overall',
  'code generation', 
  'code translation',
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
      task !== 'overall' && task !== 'mr-web' && (abilities[task]?.dataset?.length || 0) > 1,
    getValues: (task, abilities) => abilities[task]?.dataset || [],
    specialBehaviors: {
      disabling: (task, showByDifficulty, abilities) => 
        showByDifficulty && task === 'code translation'
          ? abilities[task]?.dataset?.filter(v => v !== 'HackerRank') || []
          : [],
      autoSelect: (task, showByDifficulty) =>
        showByDifficulty && task === 'code translation' ? ['HackerRank'] : []
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
  
  const excludedKeys = ['dataset', 'framework'];
  const dynamicFilters: FilterConfig[] = [];
  
  Object.entries(abilities[task]).forEach(([key, values]) => {
    if (!excludedKeys.includes(key) && values && values.length > 1) {
      dynamicFilters.push({
        key: key as keyof Ability,
        label: getFilterLabel(key as keyof Ability, task),
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
  judges: string[] = []
): FilterConfig[] {
  return [
    ...MAIN_FILTERS.filter(filter => filter.isVisible(task, abilities, judges)),
    ...createDynamicFilters(task, abilities)
  ];
}

// Utility functions (simplified)
function getFilterLabel(key: keyof Ability, task: TaskType): string {
  if (task === 'mr-web') {
    const labelMap: Record<string, string> = {
      knowledge: 'Task',
      reasoning: 'Method'
    };
    return labelMap[key] || capitalizeFirst(key);
  }
  return capitalizeFirst(key);
}

function getDisplayText(value: string, key: keyof Ability, task: TaskType): string {
  if (task === 'mr-web' && key === 'reasoning') {
    const displayMap: Record<string, string> = {
      'CoT': 'Chain-of-Thought (CoT)',
      'ZS': 'Zero-Shot (ZS)',
      'SR': 'Self-Refine (SR)'
    };
    return displayMap[value] || value;
  }
  return value;
}

function getFilterRestrictions(key: keyof Ability, task: TaskType) {
  return null;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Simplified condition checks
export const filterConditions = {
  hasAvailableFilters: (task: TaskType, abilities: Record<TaskType, Ability>, judges: string[]) =>
    task !== 'interaction-2-code' && getAvailableFilters(task, abilities, judges).length > 0,
  
  shouldShowDifficultyToggle: (task: TaskType) =>
    TASKS_WITH_DIFFICULTY.includes(task) && task !== 'overall',
  
  shouldShowDataNote: (task: TaskType) =>
    !['code-web', 'mr-web', 'interaction-2-code', 'overall', 'vulnerability detection'].includes(task),
  
  shouldShowVulnerabilityMetrics: (task: TaskType) =>
    task === 'vulnerability detection',
  
  shouldShowOverallInfo: (task: TaskType) =>
    task === 'overall',
  
  shouldShowDataLeakageWarning: (task: TaskType) =>
    task === 'vulnerability detection',
    
  shouldShowTimeline: (task: TaskType) =>
    task !== 'overall'
};

// Data note text
export function getDataNoteText(task: TaskType): string {
  return task === 'code-robustness' 
    ? 'Denotes data is not tested since it is already tested in other fields.'
    : 'Denotes data is not yet available.';
} 