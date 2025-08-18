"use client";
import { FC } from 'react';
import Hero from '../sections/Hero';
import About from '../sections/About';

interface OverviewPageProps {
  isDarkMode: boolean;
}

const OverviewPage: FC<OverviewPageProps> = ({ isDarkMode }) => {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <Hero isDarkMode={isDarkMode} />
      
      {/* About Section */}
      <About isDarkMode={isDarkMode} />
    </div>
  );
};

export default OverviewPage;
