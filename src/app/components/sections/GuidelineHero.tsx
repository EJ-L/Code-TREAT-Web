"use client";
import { FC } from 'react';
import { motion } from 'framer-motion';
import { QuestionMarkCircleIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface GuidelineHeroProps {
  isDarkMode: boolean;
}

const GuidelineHero: FC<GuidelineHeroProps> = ({ isDarkMode }) => {
  return (
    <section className="relative py-20 min-h-[40vh] flex items-center justify-center">
      <motion.div 
        className="max-w-6xl mx-auto px-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className={`p-6 rounded-full ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <BookOpenIcon className={`w-20 h-20 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </motion.div>

        <motion.h1 
          className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          User Guide
        </motion.h1>

        <motion.p 
          className={`text-xl md:text-2xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Learn how to navigate and use all the features of the Code TREAT leaderboard platform
        </motion.p>
      </motion.div>
    </section>
  );
};

export default GuidelineHero;

