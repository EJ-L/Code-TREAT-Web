"use client";
import { FC } from 'react';
import Hero from '../sections/Hero';
import About from '../sections/About';

interface OverviewPageProps {
  isDarkMode: boolean;
  onNavigateToTask?: (task: string) => void;
}

const OverviewPage: FC<OverviewPageProps> = ({ isDarkMode, onNavigateToTask }) => {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <Hero isDarkMode={isDarkMode} onNavigateToTask={onNavigateToTask} />
      
      {/* About Section */}
      <About isDarkMode={isDarkMode} onNavigateToTask={onNavigateToTask} />
    </div>
  );
};

export default OverviewPage;
