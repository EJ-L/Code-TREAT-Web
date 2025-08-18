"use client";
import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon, XMarkIcon, Bars3Icon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import WebpageIcon from '../ui/WebpageIcon';
import { TaskType, Ability } from '@/lib/types';

interface SidebarProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  currentSection: 'overview' | 'tasks' | 'about';
  onSectionChange: (section: 'overview' | 'tasks' | 'about') => void;
  isOpen: boolean;
  onToggle: () => void;
  taskAbilities?: Record<TaskType, Ability>;
  currentTask?: TaskType;
  onTaskChange?: (task: TaskType) => void;
}

const Sidebar: FC<SidebarProps> = ({ 
  isDarkMode, 
  setIsDarkMode, 
  currentSection, 
  onSectionChange,
  isOpen,
  onToggle,
  taskAbilities,
  currentTask,
  onTaskChange
}) => {
  const [isTasksExpanded, setIsTasksExpanded] = useState(true);

  // Auto-expand tasks when on tasks section (always keep expanded)
  useEffect(() => {
    setIsTasksExpanded(true);
  }, [currentSection]);
  const sidebarContent = (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-[#0f1729]' : 'bg-white'} border-r ${isDarkMode ? 'border-blue-500/20' : 'border-slate-200'}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <WebpageIcon 
              className="w-12 h-12 mr-4"
              isDarkMode={isDarkMode}
            />
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              Code TREAT
            </span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onToggle}
            className={`xl:hidden p-3 rounded-lg ${isDarkMode ? 'text-blue-200 hover:bg-blue-900/30' : 'text-slate-600 hover:bg-slate-100'} transition-colors`}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-6">
        <ul className="space-y-2">
          {/* Overview */}
          <li>
            <button
              onClick={() => onSectionChange('overview')}
              className={`w-full text-left px-6 py-4 rounded-lg font-bold text-xl transition-colors ${
                currentSection === 'overview'
                  ? isDarkMode 
                    ? 'bg-blue-900/30 text-blue-200' 
                    : 'bg-blue-50 text-blue-700'
                  : isDarkMode 
                    ? 'text-blue-200 hover:bg-blue-900/20' 
                    : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Overview
            </button>
          </li>

          {/* Tasks */}
          <li>
            <div className="flex items-center">
              <button
                onClick={() => onSectionChange('tasks')}
                className={`flex-1 text-left px-6 py-4 rounded-lg font-bold text-xl transition-colors ${
                  currentSection === 'tasks'
                    ? isDarkMode 
                      ? 'bg-blue-900/30 text-blue-200' 
                      : 'bg-blue-50 text-blue-700'
                    : isDarkMode 
                      ? 'text-blue-200 hover:bg-blue-900/20' 
                      : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Tasks
              </button>
              {taskAbilities && (
                <button
                  onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                  className={`p-3 ml-2 rounded transition-colors ${
                    isDarkMode 
                      ? 'text-blue-200 hover:bg-blue-900/20' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isTasksExpanded ? (
                    <ChevronDownIcon className="w-5 h-5" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
            
            {/* Task List */}
            {isTasksExpanded && taskAbilities && (
              <div className="ml-4 mt-1 space-y-1">
                {Object.keys(taskAbilities).map((task) => (
                  <button
                    key={task}
                    onClick={() => {
                      onSectionChange('tasks');
                      onTaskChange?.(task as TaskType);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors ${
                      currentTask === task
                        ? isDarkMode 
                          ? 'bg-blue-900/50 text-blue-100 font-semibold' 
                          : 'bg-blue-100 text-blue-800 font-semibold'
                        : isDarkMode 
                          ? 'text-slate-400 hover:bg-blue-900/20 hover:text-blue-200 font-medium' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700 font-medium'
                    }`}
                  >
                    {task === 'mr-web' 
                      ? 'MR-Web' 
                      : task.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                    }
                  </button>
                ))}
              </div>
            )}
            
            {!isTasksExpanded && (
              <div className="ml-4 mt-1 text-base">
                <div className={`px-4 py-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Code Generation, Translation, Review, and more
                </div>
              </div>
            )}
          </li>

          {/* About */}
          <li>
            <div className={`px-6 py-4 font-bold text-xl ${isDarkMode ? 'text-blue-200' : 'text-slate-700'}`}>
              About
            </div>
            <ul className="ml-4 space-y-1">
              <li>
                <button
                  onClick={() => onSectionChange('about')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold text-base transition-colors ${
                    currentSection === 'about'
                      ? isDarkMode 
                        ? 'bg-blue-900/30 text-blue-200' 
                        : 'bg-blue-50 text-blue-700'
                      : isDarkMode 
                        ? 'text-slate-400 hover:bg-blue-900/20 hover:text-blue-200' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  Paper
                </button>
              </li>
              <li>
                <a
                  href="mailto:lyu@cse.cuhk.edu.hk,ejli@cse.cuhk.edu.hk"
                  className={`block w-full text-left px-4 py-3 rounded-lg font-semibold text-base transition-colors ${
                    isDarkMode 
                      ? 'text-slate-400 hover:bg-blue-900/20 hover:text-blue-200' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  Contact
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      {/* Dark/Light Mode Toggle */}
      <div className="flex-shrink-0 p-6 border-t border-slate-200 dark:border-blue-500/20">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg ${
            isDarkMode 
              ? 'bg-[#1a2234]/80 text-blue-200 hover:bg-blue-900/30' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          } transition-colors`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <>
              <SunIcon className="w-6 h-6" />
              <span className="font-semibold text-base">Light Mode</span>
            </>
          ) : (
            <>
              <MoonIcon className="w-6 h-6" />
              <span className="font-semibold text-base">Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className={`xl:hidden fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg ${
          isDarkMode 
            ? 'bg-[#1a2234]/90 text-blue-200 hover:bg-blue-900/30' 
            : 'bg-white/95 text-slate-600 hover:bg-slate-100'
        } backdrop-blur-sm border ${isDarkMode ? 'border-blue-500/20' : 'border-slate-200'} transition-colors`}
        aria-label="Toggle sidebar"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden xl:block w-80 min-h-screen fixed left-0 top-0 z-40">
        {sidebarContent}
      </div>

      {/* Mobile/Tablet Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="xl:hidden fixed left-0 top-0 w-80 min-h-screen z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
