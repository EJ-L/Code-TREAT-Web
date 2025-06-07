import { FC } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { TaskType } from '@/lib/types';

interface TaskSelectorProps {
  currentTask: TaskType;
  currentTaskPage: number;
  handleTaskChange: (task: TaskType) => void;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  hasPreviousPage: () => boolean;
  hasNextPage: () => boolean;
  getCurrentPageTasks: () => string[];
  isDarkMode: boolean;
}

const TaskSelector: FC<TaskSelectorProps> = ({
  currentTask,
  currentTaskPage,
  handleTaskChange,
  handlePreviousPage,
  handleNextPage,
  hasPreviousPage,
  hasNextPage,
  getCurrentPageTasks,
  isDarkMode
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto mb-2">
      <div className={`flex items-center ${isDarkMode ? 'bg-[#1a2333]' : 'bg-white/90'} backdrop-blur-sm border ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} rounded-xl overflow-hidden shadow-sm`}>
        {/* Previous Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePreviousPage}
          disabled={!hasPreviousPage()}
          className={`px-4 py-3 transition-all ${
            hasPreviousPage()
              ? isDarkMode 
                ? 'text-slate-300 hover:bg-blue-900/20' 
                : 'text-slate-600 hover:bg-slate-100'
              : isDarkMode
                ? 'text-slate-600'
                : 'text-slate-400'
          } disabled:cursor-not-allowed`}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </motion.button>

        {/* Task Buttons */}
        <div className="flex flex-1">
          {getCurrentPageTasks().map((task) => (
            <motion.button
              key={task}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTaskChange(task as TaskType)}
              className={`
                flex-1 relative py-3 text-center transition-all duration-200 border-r ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} last:border-r-0
                ${currentTask === task 
                  ? isDarkMode ? 'bg-blue-900 text-blue-100 font-semibold' : 'bg-blue-500 text-white font-semibold'
                  : isDarkMode ? 'text-slate-300 hover:bg-blue-900/20' : 'text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              <span className="relative z-10 text-lg font-medium">
                {task.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
              {currentTask === task && (
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-blue-900 to-blue-800' : 'from-blue-600 to-blue-500'}`}
                  layoutId="activeTaskBackground"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Next Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNextPage}
          disabled={!hasNextPage()}
          className={`px-4 py-3 transition-all ${
            hasNextPage()
              ? isDarkMode 
                ? 'text-slate-300 hover:bg-blue-900/20' 
                : 'text-slate-600 hover:bg-slate-100'
              : isDarkMode
                ? 'text-slate-600'
                : 'text-slate-400'
          } disabled:cursor-not-allowed`}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
};

export default TaskSelector; 