"use client";
import { FC } from 'react';
import { TaskType, Ability } from '@/lib/types';
import Leaderboard from '../sections/Leaderboard';

interface TasksPageProps {
  taskAbilities: Record<TaskType, Ability>;
  isDarkMode: boolean;
  currentTask: TaskType;
}

const TasksPage: FC<TasksPageProps> = ({ taskAbilities, isDarkMode, currentTask }) => {
  return (
    <div className="flex-1">
      {/* Leaderboard Section */}
      <Leaderboard taskAbilities={taskAbilities} isDarkMode={isDarkMode} initialTask={currentTask} />
    </div>
  );
};

export default TasksPage;
