"use client";
import { FC } from 'react';
import GuidelineHero from '../sections/GuidelineHero';
import GuidelineContent from '../sections/GuidelineContent';

interface GuidelinePageProps {
  isDarkMode: boolean;
  onNavigateToTask?: (task: string) => void;
}

const GuidelinePage: FC<GuidelinePageProps> = ({ isDarkMode, onNavigateToTask }) => {
  return (
    <div className="flex-1">
      {/* Guideline Hero */}
      <GuidelineHero isDarkMode={isDarkMode} />
      
      {/* Guideline Content - key forces remount when navigating back */}
      <GuidelineContent 
        key="guideline-content"
        isDarkMode={isDarkMode} 
        onNavigateToTask={onNavigateToTask}
      />
    </div>
  );
};

export default GuidelinePage;

