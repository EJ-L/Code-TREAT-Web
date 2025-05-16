import { FC } from 'react';
import { motion } from 'framer-motion';

interface BackgroundProps {
  isDarkMode: boolean;
}

const Background: FC<BackgroundProps> = ({ isDarkMode }) => {
  return (
    <div className="fixed inset-0">
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-[#1a2333] to-slate-900' : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50'}`} />
      <div className={`absolute inset-0 bg-[url('/grid.svg')] ${isDarkMode ? 'opacity-[0.07]' : 'opacity-[0.03]'}`} />
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-slate-800/10 via-blue-900/5 to-slate-800/10' : 'from-blue-400/5 via-purple-400/5 to-blue-400/5'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      />
    </div>
  );
};

export default Background; 