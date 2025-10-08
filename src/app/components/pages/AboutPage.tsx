"use client";
import { FC } from 'react';
import PaperHero from '../sections/PaperHero';
import Introduction from '../sections/Introduction';
import BenchmarkConstruction from '../sections/BenchmarkConstruction';
import Results from '../sections/Results';
import About from '../sections/About';

interface AboutPageProps {
  isDarkMode: boolean;
}

const AboutPage: FC<AboutPageProps> = ({ isDarkMode }) => {
  return (
    <div className="flex-1">
      {/* Paper Detail Hero */}
      <PaperHero isDarkMode={isDarkMode} />
      
      {/* Introduction Section */}
      <Introduction isDarkMode={isDarkMode} />
      
      {/* Benchmark Construction Section */}
      <BenchmarkConstruction isDarkMode={isDarkMode} />
      
      {/* Model Comparisons Section */}
      <Results isDarkMode={isDarkMode} />
      
      {/* About Section */}
      {/*<About isDarkMode={isDarkMode} />*/}
    </div>
  );
};

export default AboutPage;
