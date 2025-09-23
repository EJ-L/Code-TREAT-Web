import { FC } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface IntroductionProps {
  isDarkMode: boolean;
}

const Introduction: FC<IntroductionProps> = ({ isDarkMode }) => {
  return (
    <section id="introduction" className="relative py-20">
      <motion.div 
        className="max-w-6xl mx-auto px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Introduction Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
            Introduction
          </h2>
        </motion.div>

        {/* Introduction Image */}
        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-full max-w-4xl">
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-[#0f1729]/80 border border-blue-500/20' : 'bg-white/90 border border-slate-200'} backdrop-blur-sm shadow-lg`}>
              <Image
                src="/overview/Paper_Introduction.png"
                alt="Code TREAT Introduction Framework"
                width={800}
                height={500}
                className="rounded-lg w-full h-auto"
                priority
              />
            </div>
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          className="max-w-5xl mx-auto space-y-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="space-y-8">
            <div className="space-y-12 max-w-4xl mx-auto">
              <p className={`text-lg text-center leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>TREAT</strong> introduces 
                the first holistic evaluation framework for Large Language Models in code intelligence tasks.
              </p>
              
              <p className={`text-xl leading-relaxed text-justify ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Our framework features <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Multi-Task Holistic Evaluation</strong> spanning 
                the entire software development lifecycle, <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Multi-Language & Multi-Modality</strong> assessment 
                incorporating visual design and software implementation, <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Systematic Robustness Testing</strong> through 
                code transformations to ensure model stability, and <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Rigorous Evaluation Methodology</strong> with 
                multi-prompt strategies to reduce bias and align with real-world developer usage.
              </p>
            </div>

            <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-lg ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                <strong>Key Finding:</strong> Through evaluation of 25+ state-of-the-art models, we reveal 
                significant performance variations across tasks and severe robustness issues with 15.5% 
                average performance decline under code perturbations.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Introduction;
