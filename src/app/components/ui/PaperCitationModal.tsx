import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaperCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

interface PaperInfo {
  name: string;
  title: string;
  authors: string;
  venue: string;
  year: string;
  description: string;
  url: string;
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
    leaderboardTask: "code-robustness"
  }
];

const PaperCitationModal: FC<PaperCitationModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  const navigateToLeaderboard = (task?: string) => {
    if (task) {
      onClose();
      
      const leaderboardElement = document.getElementById('evaluation');
      if (leaderboardElement) {
        leaderboardElement.scrollIntoView({ behavior: 'smooth' });
        
        const taskChangeEvent = new CustomEvent('changeLeaderboardTask', {
          detail: { task }
        });
        window.dispatchEvent(taskChangeEvent);
      }
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