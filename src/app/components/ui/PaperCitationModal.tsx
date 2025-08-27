import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaperCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onNavigateToTask?: (task: string) => void;
}

interface PaperInfo {
  name: string;
  title: string;
  authors: string;
  venue: string;
  year: string;
  description: string;
  url: string;
  codeUrl?: string;
  leaderboardTask?: string;
}

const papers: PaperInfo[] = [
  {
    name: "Code-TREAT",
    title: "Code-TREAT: A Comprehensive Framework for LLM Code Generation Evaluation",
    authors: "Zhang et al.",
    venue: "arXiv",
    year: "2024",
    description: "The foundational framework that unifies multiple evaluation methodologies for assessing the trustworthiness and reliability of AI-generated code across diverse programming tasks.",
    url: "https://arxiv.org/abs/2404.00160"
  },
  {
    name: "Interaction-2-Code",
    title: "Interaction2Code: Benchmarking MLLM-based Interactive Webpage Code Generation from Interactive Prototyping",
    authors: "Xiao et al.",
    venue: "arXiv",
    year: "2024",
    description: "A comprehensive benchmark for evaluating multimodal large language models on generating interactive webpage code from UI prototypes.",
    url: "https://arxiv.org/abs/2411.03292",
    codeUrl: "https://github.com/WebPAI/Interaction2Code",
    leaderboardTask: "interaction-2-code"
  },
  {
    name: "MR-Web", 
    title: "MRWeb: An Exploration of Generating Multi-Page Resource-Aware Web Code from UI Designs",
    authors: "Wan et al.",
    venue: "arXiv",
    year: "2024",
    description: "Exploring the generation of comprehensive multi-page web applications with proper resource management from design specifications.",
    url: "https://arxiv.org/abs/2412.15310",
    codeUrl: "https://github.com/WebPAI/MRWeb",
    leaderboardTask: "mr-web"
  },
  {
    name: "Code-Web",
    title: "DesignBench: A Comprehensive Benchmark for MLLM-based Front-end Code Generation",
    authors: "Xiao et al.",
    venue: "arXiv",
    year: "2024",
    description: "A systematic evaluation framework for multimodal models in front-end development, focusing on design-to-code translation accuracy.",
    url: "https://arxiv.org/abs/2506.06251",
    codeUrl: "https://github.com/WebPAI/DesignBench",
    leaderboardTask: "code-web"
  },
  {
    name: "Code-Robustness",
    title: "CodeCrash: Stress Testing LLM Reasoning under Structural and Semantic Perturbations",
    authors: "Lam et al.",
    venue: "arXiv",
    year: "2024",
    description: "Investigating the robustness of large language models when generating code under various structural and semantic challenges.",
    url: "https://arxiv.org/abs/2504.14119",
    codeUrl: "https://github.com/CUHK-ARISE/CodeCrash",
    leaderboardTask: "code-robustness"
  }
];

const PaperCitationModal: FC<PaperCitationModalProps> = ({ isOpen, onClose, isDarkMode, onNavigateToTask }) => {
  const navigateToLeaderboard = (task?: string) => {
    if (task && onNavigateToTask) {
      onClose();
      onNavigateToTask(task);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`
              relative w-full max-w-4xl max-h-[80vh] overflow-auto rounded-xl shadow-2xl
              ${isDarkMode ? 'bg-[#0f1729] border border-slate-700/50' : 'bg-white border border-slate-200'}
            `}>
              {/* Header */}
              <div className={`
                sticky top-0 px-6 py-4 border-b z-10
                ${isDarkMode ? 'bg-[#0f1729] border-slate-700/50' : 'bg-white border-slate-200'}
              `}>
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                    Leaderboard Papers
                  </h2>
                  <button
                    onClick={onClose}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${isDarkMode 
                        ? 'hover:bg-slate-800 text-slate-400 hover:text-white' 
                        : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                      }
                    `}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className={`text-lg mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Our leaderboards are based on research from multiple papers. Click on any paper below to view the full research:
                </p>
                
                <div className="space-y-4">
                  {papers.map((paper, index) => (
                    <motion.div
                      key={paper.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        p-6 rounded-lg border transition-all duration-200 hover:shadow-lg
                        ${isDarkMode 
                          ? 'bg-[#151d2a] border-slate-700/50 hover:border-blue-500/30' 
                          : 'bg-slate-50 border-slate-200 hover:border-blue-300/50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {paper.name}
                            </span>
                            <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {paper.authors} • {paper.venue} {paper.year}
                            </span>
                          </div>
                          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {paper.title}
                          </h3>
                          <p className={`text-sm leading-relaxed mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {paper.description}
                          </p>
                          
                          <div className="flex items-center gap-3">
                            <motion.a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`
                                inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
                                ${isDarkMode 
                                  ? 'bg-blue-900/50 text-blue-200 hover:bg-blue-800/60 border border-blue-700/50' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                                }
                              `}
                            >
                              <svg 
                                className="w-4 h-4 transition-transform group-hover:translate-x-0.5" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Read Paper
                            </motion.a>
                            
                            {paper.codeUrl && (
                              <motion.a
                                href={paper.codeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
                                  ${isDarkMode 
                                    ? 'bg-orange-900/50 text-orange-200 hover:bg-orange-800/60 border border-orange-700/50' 
                                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200'
                                  }
                                `}
                              >
                                <svg 
                                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5" 
                                  fill="currentColor" 
                                  viewBox="0 0 496 512"
                                >
                                  <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
                                </svg>
                                Code
                              </motion.a>
                            )}
                            
                            {paper.leaderboardTask && (
                              <motion.button
                                onClick={() => navigateToLeaderboard(paper.leaderboardTask)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
                                  ${isDarkMode 
                                    ? 'bg-purple-900/50 text-purple-200 hover:bg-purple-800/60 border border-purple-700/50' 
                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200'
                                  }
                                `}
                              >
                                <svg 
                                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                View Results
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <strong>Note:</strong> Each leaderboard corresponds to research from different papers. 
                    Click on the papers above to read the full research or view their corresponding results.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaperCitationModal; 