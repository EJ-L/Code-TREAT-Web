import { FC } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface PaperOverviewProps {
  isDarkMode: boolean;
}

const PaperOverview: FC<PaperOverviewProps> = ({ isDarkMode }) => {
  return (
    <section id="paper-overview" className="relative flex items-center py-8">
      <motion.div 
        className="relative w-full max-w-7xl mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex justify-center">
          <div className={`${isDarkMode ? 'bg-[#0f1729]/80' : 'bg-white/90'} backdrop-blur-sm p-8 rounded-xl border ${isDarkMode ? 'border-blue-500/20' : 'border-slate-200'} shadow-lg`}>
            <Image
              src="/overview/paper_overview.jpg"
              alt="Code TREAT Paper Overview"
              width={1200}
              height={800}
              className="rounded-lg max-w-full h-auto"
              priority
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default PaperOverview;
