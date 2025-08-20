import { FC, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectDropdownProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  isDarkMode: boolean;
  placeholder?: string;
  maxDisplayedTags?: number;
  className?: string;
  disabled?: boolean;
}

const MultiSelectDropdown: FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selectedValues,
  onSelectionChange,
  isDarkMode,
  placeholder = "Select options...",
  maxDisplayedTags = 3,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (value: string) => {
    if (disabled) return;
    
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    onSelectionChange(newSelectedValues);
  };

  const handleRemoveTag = (valueToRemove: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (disabled) return;
    
    const newSelectedValues = selectedValues.filter(v => v !== valueToRemove);
    onSelectionChange(newSelectedValues);
  };

  const clearAll = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (disabled) return;
    
    onSelectionChange([]);
  };

  // Get display tags
  const displayTags = selectedValues.slice(0, maxDisplayedTags);
  const hiddenCount = Math.max(0, selectedValues.length - maxDisplayedTags);

  // Check if option is available
  const availableOptions = options.filter(option => !option.disabled);
  const hasAvailableOptions = availableOptions.length > 0;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => !disabled && hasAvailableOptions && setIsOpen(!isOpen)}
        disabled={disabled || !hasAvailableOptions}
        className={`
          w-full min-h-[44px] px-3 py-2 text-left rounded-lg border transition-all duration-200
          flex items-center justify-between gap-2
          ${disabled || !hasAvailableOptions
            ? isDarkMode 
              ? 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed' 
              : 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
            : isDarkMode
              ? 'bg-slate-800 border-slate-600 text-slate-200 hover:border-slate-500'
              : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
          }
          ${isOpen && !disabled && hasAvailableOptions
            ? isDarkMode
              ? 'border-blue-500 ring-1 ring-blue-500/20'
              : 'border-blue-500 ring-1 ring-blue-500/20'
            : ''
          }
        `}
      >
        <div className="flex-1 min-w-0">
          {selectedValues.length === 0 ? (
            <span className={`${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <span className="font-bold">{label}</span> - {placeholder}
            </span>
          ) : (
            <div className="flex items-center">
              <span className={`font-bold ${
                isDarkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {selectedValues.length === 1 ? (
                  // Show option name for single selection
                  (() => {
                    const option = options.find(opt => opt.value === selectedValues[0]);
                    return option?.label || selectedValues[0];
                  })()
                ) : selectedValues.length === availableOptions.length ? (
                  // Show "All filters" when all options are selected
                  'All filters'
                ) : (
                  // Show "Selected (X/Y) options" for multiple selections
                  `Selected (${selectedValues.length}/${availableOptions.length}) options`
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedValues.length > 0 && !disabled && (
            <div
              onClick={clearAll}
              className={`
                p-1 rounded hover:bg-opacity-20 cursor-pointer
                ${isDarkMode 
                  ? 'text-slate-400 hover:bg-red-400 hover:text-red-300' 
                  : 'text-slate-500 hover:bg-red-500 hover:text-red-600'
                }
              `}
            >
              <XMarkIcon className="w-4 h-4" />
            </div>
          )}
          
          <ChevronDownIcon 
            className={`
              w-4 h-4 transition-transform duration-200
              ${isOpen ? 'rotate-180' : 'rotate-0'}
              ${disabled || !hasAvailableOptions
                ? isDarkMode ? 'text-slate-600' : 'text-slate-400'
                : isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }
            `} 
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && hasAvailableOptions && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`
              absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto
              ${isDarkMode
                ? 'bg-slate-800 border-slate-600'
                : 'bg-white border-slate-300'
              }
            `}
          >
            <div className="py-1">
              {availableOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggleOption(option.value)}
                    className={`
                      w-full px-3 py-2 text-left text-lg font-bold transition-colors
                      flex items-center justify-between
                      ${isSelected
                        ? isDarkMode
                          ? 'bg-blue-600/20 text-blue-300'
                          : 'bg-blue-50 text-blue-700'
                        : isDarkMode
                          ? 'text-slate-300 hover:bg-slate-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiSelectDropdown;
