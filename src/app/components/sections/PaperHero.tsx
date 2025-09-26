import { FC } from 'react';
import { motion } from 'framer-motion';

interface PaperHeroProps {
  isDarkMode: boolean;
}

const PaperHero: FC<PaperHeroProps> = () => {
  return (
    <main className="relative flex-grow flex flex-col items-center justify-center text-center px-4 pb-16 pt-20">
      <div className="relative">
        <motion.h1 
          className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Paper Detail
        </motion.h1>
      </div>
    </main>
  );
};

export default PaperHero;
