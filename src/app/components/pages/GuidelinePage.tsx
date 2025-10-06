"use client";
import { FC } from 'react';
import GuidelineHero from '../sections/GuidelineHero';
import GuidelineContent from '../sections/GuidelineContent';

interface GuidelinePageProps {
  isDarkMode: boolean;
}

const GuidelinePage: FC<GuidelinePageProps> = ({ isDarkMode }) => {
  return (
    <div className="flex-1">
      {/* Guideline Hero */}
      <GuidelineHero isDarkMode={isDarkMode} />
      
      {/* Guideline Content */}
      <GuidelineContent isDarkMode={isDarkMode} />
    </div>
  );
};

export default GuidelinePage;

