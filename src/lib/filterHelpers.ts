import { TaskType, Ability } from '@/lib/types';
import { FilterConfig } from './filterConfig';

// Consolidated styling configuration
const STYLE_CONFIG = {
  button: {
    base: 'px-6 py-3 text-center transition-all text-lg font-medium rounded-lg',
    selected: (isDark: boolean) => isDark 
      ? 'bg-blue-900 text-blue-100 border border-blue-700' 
      : 'bg-blue-500 text-white border border-blue-400',
    disabled: (isDark: boolean) => isDark 
      ? 'bg-[#151d2a] text-slate-500 border border-slate-700/30 cursor-not-allowed opacity-50'
      : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50',
    normal: (isDark: boolean) => isDark 
      ? 'bg-[#151d2a] text-slate-300 hover:bg-blue-900/20 border border-slate-700/50'
      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
  },
  text: {
    filterLabel: (isDark: boolean) => `text-2xl font-semibold ${isDark ? 'text-blue-200' : 'text-blue-600'}`,
    restriction: (isDark: boolean) => `text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`,
    dataNote: (isDark: boolean) => `flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`,
    difficultyLabel: (isDark: boolean) => `ml-2 text-l cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-500'}`
  },
  checkbox: (isDark: boolean) => `form-checkbox h-5 w-5 ${
    isDark 
      ? 'text-blue-600 bg-[#151d2a] border-slate-700' 
      : 'text-blue-600 bg-slate-100 border-slate-300'
  } rounded focus:ring-blue-500`
};

// Unified filter state management
export class FilterState {
  constructor(
    private filter: FilterConfig,
    private selectedAbilities: Partial<Ability>,
    private currentTask: TaskType,
    private showByDifficulty: boolean,
    private taskAbilities: Record<TaskType, Ability>
  ) {}

  // Getter methods for accessing filter properties
  get filterKey(): keyof Ability | 'llmJudges' {
    return this.filter.key;
  }

  get filterLabel(): string {
    return this.filter.label;
  }

  isSelected(value: string): boolean {
    const selectedValues = this.selectedAbilities[this.filter.key as keyof Ability] as string[] | undefined;
    const normallySelected = selectedValues?.includes(value) || false;
    
    // Check auto-selected values
    const autoSelected = this.filter.specialBehaviors?.autoSelect?.(this.currentTask, this.showByDifficulty) || [];
    return normallySelected || autoSelected.includes(value);
  }

  isDisabled(value: string): boolean {
    const disabledValues = this.filter.specialBehaviors?.disabling?.(
      this.currentTask, 
      this.showByDifficulty, 
      this.taskAbilities
    ) || [];
    return disabledValues.includes(value);
  }

  isRestricted(value: string): boolean {
    const restriction = this.filter.specialBehaviors?.restrictions?.(this.currentTask);
    if (!restriction) return false;
    
    const currentlySelected = this.selectedAbilities[this.filter.key as keyof Ability] as string[] || [];
    const isCurrentlySelected = currentlySelected.includes(value);
    
    return !isCurrentlySelected && currentlySelected.length >= restriction.limit;
  }

  getDisplayText(value: string): string {
    return this.filter.specialBehaviors?.displayText?.(value, this.currentTask) || value;
  }

  getTooltipText(): string | undefined {
    const restriction = this.filter.specialBehaviors?.restrictions?.(this.currentTask);
    return restriction 
      ? `Maximum ${restriction.limit} ${this.filter.label.toLowerCase()}s can be selected for this task`
      : undefined;
  }

  canInteract(value: string): boolean {
    return !this.isDisabled(value) && !this.isRestricted(value);
  }
}

// Simplified styling functions
export const getStyles = {
  filterButton: (isSelected: boolean, isDisabled: boolean, isRestricted: boolean, isDark: boolean): string => {
    const { base, selected, disabled, normal } = STYLE_CONFIG.button;
    
    if (isSelected) return `${base} ${selected(isDark)}`;
    if (isDisabled || isRestricted) return `${base} ${disabled(isDark)}`;
    return `${base} ${normal(isDark)}`;
  },

  filterLabel: (isDark: boolean) => STYLE_CONFIG.text.filterLabel(isDark),
  restrictionMessage: (isDark: boolean) => STYLE_CONFIG.text.restriction(isDark),
  dataNote: (isDark: boolean) => STYLE_CONFIG.text.dataNote(isDark),
  difficultyToggle: (isDark: boolean) => STYLE_CONFIG.checkbox(isDark),
  difficultyLabel: (isDark: boolean) => STYLE_CONFIG.text.difficultyLabel(isDark)
};

// Simplified animation helper
export const getButtonAnimation = (canInteract: boolean) => ({
  whileHover: canInteract ? { scale: 1.02 } : {},
  whileTap: canInteract ? { scale: 0.98 } : {}
});

// Filter click handler factory
export function createFilterClickHandler(
  filterState: FilterState,
  value: string,
  handleAbilityChange: (key: keyof Ability, value: string) => void
) {
  return () => {
    if (!filterState.canInteract(value)) return;
    
    const key = filterState.filterKey === 'llmJudges' 
      ? 'llmJudges' as keyof Ability 
      : filterState.filterKey as keyof Ability;
    
    handleAbilityChange(key, value);
  };
}

// Legacy compatibility exports (to maintain backward compatibility during migration)
export const getFilterButtonStyles = getStyles.filterButton;
export const getFilterLabelStyles = getStyles.filterLabel;
export const getRestrictionMessageStyles = getStyles.restrictionMessage;
export const getDataNoteStyles = getStyles.dataNote;
export const getDifficultyToggleStyles = getStyles.difficultyToggle;
export const getDifficultyLabelStyles = getStyles.difficultyLabel;
export const getFilterButtonAnimationProps = getButtonAnimation;

// Legacy individual helper functions for backward compatibility
export const isFilterValueSelected = (
  filterType: { key: keyof Ability | 'llmJudges'; specialBehaviors?: any },
  value: string,
  selectedAbilities: Partial<Ability>,
  currentTask: TaskType,
  showByDifficulty: boolean
): boolean => {
  const selectedValues = selectedAbilities[filterType.key as keyof Ability] as string[] | undefined;
  const normallySelected = selectedValues?.includes(value) || false;
  
  const autoSelected = filterType.specialBehaviors?.autoSelect?.(currentTask, showByDifficulty) || [];
  return normallySelected || autoSelected.includes(value);
};

export const isFilterValueDisabled = (
  filterType: { specialBehaviors?: any },
  value: string,
  currentTask: TaskType,
  showByDifficulty: boolean,
  taskAbilities: Record<TaskType, Ability>
): boolean => {
  const disabledValues = filterType.specialBehaviors?.disabling?.(
    currentTask, 
    showByDifficulty, 
    taskAbilities
  ) || [];
  return disabledValues.includes(value);
};

export const isFilterValueRestricted = (
  filterType: { key: keyof Ability | 'llmJudges'; specialBehaviors?: any },
  value: string,
  selectedAbilities: Partial<Ability>,
  currentTask: TaskType
): boolean => {
  const restriction = filterType.specialBehaviors?.restrictions?.(currentTask);
  if (!restriction) return false;
  
  const currentlySelected = selectedAbilities[filterType.key as keyof Ability] as string[] || [];
  const isCurrentlySelected = currentlySelected.includes(value);
  
  return !isCurrentlySelected && currentlySelected.length >= restriction.limit;
};

export const getFilterTooltipText = (
  filterType: { label: string; specialBehaviors?: any },
  currentTask: TaskType
): string | undefined => {
  const restriction = filterType.specialBehaviors?.restrictions?.(currentTask);
  return restriction 
    ? `Maximum ${restriction.limit} ${filterType.label.toLowerCase()}s can be selected for this task`
    : undefined;
}; 