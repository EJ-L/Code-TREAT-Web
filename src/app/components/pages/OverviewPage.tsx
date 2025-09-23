"use client";
import { FC } from 'react';
import Hero from '../sections/Hero';
import Abstract from '../sections/Abstract';
import Introduction from '../sections/Introduction';

interface OverviewPageProps {
  isDarkMode: boolean;
  onNavigateToTask?: (task: string) => void;
}

const OverviewPage: FC<OverviewPageProps> = ({ isDarkMode, onNavigateToTask }) => {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <Hero isDarkMode={isDarkMode} onNavigateToTask={onNavigateToTask} />
      
      {/* Abstract Section */}
      <Abstract isDarkMode={isDarkMode} />
      
      {/* Introduction Section */}
      <Introduction isDarkMode={isDarkMode} />
      
    </div>
  );
};

export default OverviewPage;
