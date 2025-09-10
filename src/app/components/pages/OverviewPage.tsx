"use client";
import { FC } from 'react';
import Hero from '../sections/Hero';
import PaperOverview from '../sections/PaperOverview';

interface OverviewPageProps {
  isDarkMode: boolean;
  onNavigateToTask?: (task: string) => void;
}

const OverviewPage: FC<OverviewPageProps> = ({ isDarkMode, onNavigateToTask }) => {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <Hero isDarkMode={isDarkMode} onNavigateToTask={onNavigateToTask} />
      
      {/* Paper Overview Section */}
      <PaperOverview isDarkMode={isDarkMode} />
    </div>
  );
};

export default OverviewPage;
