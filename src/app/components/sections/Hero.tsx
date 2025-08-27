import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import PaperCitationModal from '../ui/PaperCitationModal';

interface HeroProps {
  isDarkMode: boolean;
  onNavigateToTask?: (task: string) => void;
}

const Hero: FC<HeroProps> = ({ isDarkMode, onNavigateToTask }) => {
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

  return (
    <main className="relative flex-grow flex flex-col items-center justify-center text-center px-4 pb-16" id="home">
      <div className="relative mt-[180px]">
        <motion.h1 
          className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Code TREAT
        </motion.h1>
        <div className="flex flex-wrap justify-center gap-4">
          <motion.button
            onClick={() => setIsPaperModalOpen(true)}
            className={`relative inline-flex items-center px-6 py-4 text-lg text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
              overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center gap-6">
              <span className="relative z-10 flex items-center justify-center">
                <svg 
                  aria-hidden="true" 
                  focusable="false" 
                  className="w-5 h-5" 
                  role="img" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 384 512"
                >
                  <path 
                    fill="currentColor" 
                    d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z"
                  ></path>
                </svg>
              </span>
              <span className="relative z-10">Papers</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 
              group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl 
              opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
          
          <motion.a
            href="https://github.com/CUHK-ARISE/Code-TREAT"
            target="_blank"
            rel="noopener noreferrer"
            className={`relative inline-flex items-center px-6 py-4 text-lg text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
              overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center gap-6">
              <span className="relative z-10 flex items-center justify-center">
                <svg 
                  aria-hidden="true" 
                  focusable="false" 
                  className="w-5 h-5" 
                  role="img" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 496 512"
                >
                  <path 
                    fill="currentColor" 
                    d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
                  ></path>
                </svg>
              </span>
              <span className="relative z-10">Code</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 
              group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl 
              opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.a>
          
          <motion.a
            href="https://huggingface.co/datasets/CUHK-ARISE/Code-TREAT"
            target="_blank"
            rel="noopener noreferrer"
            className={`relative inline-flex items-center px-6 py-4 text-lg text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
              overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="flex items-center gap-6">
              <span className="relative z-10 flex items-center justify-center">
                <svg 
                  aria-hidden="true" 
                  focusable="false" 
                  className="w-5 h-5" 
                  role="img" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 576 512"
                >
                  <path 
                    fill="currentColor" 
                    d="M480 416v16c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V176c0-26.51 21.49-48 48-48h16v48H54a6 6 0 0 0-6 6v244a6 6 0 0 0 6 6h372a6 6 0 0 0 6-6v-10h48zm42-336H150a6 6 0 0 0-6 6v244a6 6 0 0 0 6 6h372a6 6 0 0 0 6-6V86a6 6 0 0 0-6-6zm6-48c26.51 0 48 21.49 48 48v256c0 26.51-21.49 48-48 48H144c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h384zM264 144c0 22.091-17.909 40-40 40s-40-17.909-40-40 17.909-40 40-40 40 17.909 40 40zm-72 96l39.515-39.515c4.686-4.686 12.284-4.686 16.971 0L288 240l103.515-103.515c4.686-4.686 12.284-4.686 16.971 0L480 208v80H192v-48z"
                  ></path>
                </svg>
              </span>
              <span className="relative z-10">Data</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 
              group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl 
              opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.a>
          
          <motion.a
            href="#evaluation"
            className={`relative inline-flex items-center px-6 py-4 text-lg text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg
              overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex items-center gap-6">
              <span className="relative z-10 flex items-center justify-center">
                <svg 
                  aria-hidden="true" 
                  focusable="false" 
                  className="w-5 h-5" 
                  role="img" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 576 512"
                >
                  <path 
                    fill="currentColor" 
                    d="M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 35.7 22.5 72.4 61.9 100.7 31.5 22.7 69.8 37.1 110 41.7C203.3 338.5 240 360 240 360v72h-48c-35.3 0-64 20.7-64 56v12c0 6.6 5.4 12 12 12h296c6.6 0 12-5.4 12-12v-12c0-35.3-28.7-56-64-56h-48v-72s36.7-21.5 68.1-73.6c40.3-4.6 78.6-19 110-41.7 39.3-28.3 61.9-65 61.9-100.7V88c0-13.3-10.7-24-24-24zM99.3 192.8C74.9 175.2 64 155.6 64 144v-16h64.2c1 32.6 5.8 61.2 12.8 86.2-15.1-5.2-29.2-12.4-41.7-21.4zM512 144c0 16.1-17.7 36.1-35.3 48.8-12.5 9-26.7 16.2-41.8 21.4 7-25 11.8-53.6 12.8-86.2H512v16z"
                  ></path>
                </svg>
              </span>
              <span className="relative z-10">Leaderboard</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 
              group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl 
              opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.a>
        </div>
      </div>

      {/* Paper Citation Modal */}
      <PaperCitationModal 
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        isDarkMode={isDarkMode}
        onNavigateToTask={onNavigateToTask}
      />
    </main>
  );
};

export default Hero; 