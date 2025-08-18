"use client";
import { FC } from 'react';
import About from '../sections/About';

interface AboutPageProps {
  isDarkMode: boolean;
}

const AboutPage: FC<AboutPageProps> = ({ isDarkMode }) => {
  return (
    <div className="flex-1 py-20">
      {/* About Section */}
      <About isDarkMode={isDarkMode} />
    </div>
  );
};

export default AboutPage;
