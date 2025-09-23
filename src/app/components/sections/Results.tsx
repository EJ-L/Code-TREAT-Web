import { FC } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ResultsProps {
  isDarkMode: boolean;
}

const Results: FC<ResultsProps> = ({ isDarkMode }) => {
  return (
    <section id="results" className="relative py-20">
      <motion.div 
        className="max-w-6xl mx-auto px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Results Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
            Model Comparisions
          </h2>
        </motion.div>

        {/* Results Image */}
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
                src="/overview/Paper_CodeTreat_Result.png"
                alt="Code TREAT Model Performance Results"
                width={800}
                height={600}
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
                Our comprehensive evaluation reveals significant <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>performance variations</strong> across 
                different coding tasks and highlights the specialized nature of current language models.
              </p>
              
              <p className={`text-xl leading-relaxed text-justify ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Models exhibit substantial performance variation across different tasks.</strong> Current models tend to 
                specialize in specific domains rather than achieving uniform capabilities, with no single model performing optimally across all evaluated tasks.  
                <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}> Different models lead different tasks</strong> - for example, O3-mini achieves the best results in code generation while Claude-Sonnet-4 performs best 
                in vulnerability detection. This specialization reflects the diverse nature of coding tasks, which require different skills from logical reasoning 
                to creative problem-solving.
              </p>
            </div>

            <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-lg ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                <strong>Key Finding:</strong> No single model performs optimally across all tasks, indicating that different models have 
                developed specialized strengths in specific programming domains. This highlights the need for task-specific model selection 
                and the potential for ensemble approaches in comprehensive code intelligence systems.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Results;
