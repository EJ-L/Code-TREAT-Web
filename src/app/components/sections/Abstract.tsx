import { FC } from 'react';
import { motion } from 'framer-motion';

interface AbstractProps {
  isDarkMode: boolean;
}

const Abstract: FC<AbstractProps> = ({ isDarkMode }) => {
  return (
    <section id="abstract" className="relative py-20">
      <motion.div 
        className="max-w-6xl mx-auto px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Abstract Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
            Abstract
          </h2>
        </motion.div>

        {/* Text Content */}
        <motion.div
          className="max-w-5xl mx-auto space-y-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="space-y-8">
            <div className="space-y-12 max-w-4xl mx-auto">
              
              <p className={`text-xl leading-relaxed text-justify ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Large foundation models are transforming software engineering, yet significant gaps remain in comprehensive evaluation methodologies. 
                Our framework addresses this with four key improvements: <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Multi-Task Holistic Evaluation</strong>, 
                <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Multi-Language and Multi-Modality Assessment</strong>, 
                <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Robustness Assessment</strong>, and 
                <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Rigorous Evaluation Methodology</strong>.
              </p>
            </div>

            <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-lg ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                <strong>Key Insights:</strong> Based on evaluation of over 25 state-of-the-art models, we uncover substantial performance variation 
                across programming tasks, specific limitations in multi-modal code generation, severe robustness issues, and demonstrate that 
                multi-prompt evaluation methods can mitigate bias and obtain more reliable results.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Abstract;
