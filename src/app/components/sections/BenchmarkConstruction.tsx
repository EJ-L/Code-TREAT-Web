import { FC } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Code, Database, Shield, Layers, GitBranch, Bug, TestTube, Eye } from 'lucide-react';

interface BenchmarkConstructionProps {
  isDarkMode: boolean;
}

const BenchmarkConstruction: FC<BenchmarkConstructionProps> = ({ isDarkMode }) => {
  const taskCategories = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "General Coding Tasks",
      tasks: [
        { name: "Code Generation", desc: "Algorithmic problems from GeeksforGeeks and HackerRank" },
        { name: "Code Summarization", desc: "Function-docstring pairs extracted from GitHub repositories" },
        { name: "Code Translation", desc: "Python-Java bidirectional translation using PolyHumanEval" },
        { name: "Code Reasoning", desc: "Input/output prediction with masked function components" },
        { name: "Code Review", desc: "Real-world code review from GitHub pull requests" },
        { name: "Test Generation", desc: "Unit test creation following CodaMOSA methodology" },
        { name: "Vulnerability Detection", desc: "Expert-verified vulnerable functions using PRIMEVUL" }
      ]
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Multi-Modality Tasks",
      tasks: [
        { name: "UI-based Code Generation", desc: "Visual design to code implementation" },
        { name: "Code Edit & Repair", desc: "Visual element-based code modification tasks" }
      ]
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Robustness Evaluation",
      tasks: [
        { name: "Code Transformation", desc: "Program structure modifications while preserving functionality" },
        { name: "Misleading Comments", desc: "Assessment under intentionally deceptive documentation" }
      ]
    }
  ];

  const constructionSteps = [
    {
      icon: <Database className="w-8 h-8" />,
      title: "Data Collection",
      description: "Hybrid strategy combining automated GitHub crawling with curated public datasets"
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: "Multi-Language Support",
      description: "Coverage of 10+ programming languages with focus on Python and Java"
    },
    {
      icon: <GitBranch className="w-8 h-8" />,
      title: "Quality Assurance",
      description: "Rigorous filtering and validation against ground-truth solutions"
    },
    {
      icon: <TestTube className="w-8 h-8" />,
      title: "Evaluation Design",
      description: "Multi-prompt strategies and systematic metric design for comprehensive assessment"
    }
  ];

  return (
    <section id="benchmark-construction" className="relative py-20">
      <motion.div 
        className="max-w-6xl mx-auto px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Section Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
            Benchmark Construction
          </h2>
        </motion.div>

        {/* Construction Process */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="space-y-12 max-w-5xl mx-auto">
            <div className="space-y-8">
              <p className={`text-xl text-center leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                TREAT employs a <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>structured pipeline</strong> for 
                comprehensive code intelligence evaluation, encompassing <strong className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>10+ evaluation tasks</strong> across 
                the entire software development lifecycle.
              </p>
            </div>
          </div>

          {/* Methodology Image */}
          <motion.div
            className="flex justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="w-full max-w-4xl">
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-[#0f1729]/80 border border-blue-500/20' : 'bg-white/90 border border-slate-200'} backdrop-blur-sm shadow-lg`}>
                <Image
                  src="/overview/Paper_Method.jpg"
                  alt="TREAT Benchmark Construction Methodology"
                  width={800}
                  height={500}
                  className="rounded-lg w-full h-auto"
                  priority
                />
              </div>
            </div>
          </motion.div>

          <h3 className={`text-4xl font-bold text-center mb-12 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Construction Methodology
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {constructionSteps.map((step, index) => (
              <motion.div
                key={index}
                className={`p-6 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border-2 border-blue-500/70' : 'bg-blue-50 border-2 border-blue-400'} text-center`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className={`flex justify-center mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {step.icon}
                </div>
                <h4 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {step.title}
                </h4>
                <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Task Categories */}
        <motion.div
          className="space-y-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h3 className={`text-4xl font-bold text-center mb-12 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Evaluation Tasks Overview
          </h3>
          
          {taskCategories.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.2 }}
            >
              <div className="flex items-center mb-6">
                <div className={`mr-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {category.icon}
                </div>
                <h4 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {category.title}
                </h4>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tasks.map((task, taskIndex) => (
                  <motion.div
                    key={taskIndex}
                    className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (categoryIndex * 0.2) + (taskIndex * 0.05) }}
                  >
                    <h5 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      {task.name}
                    </h5>
                    <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {task.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

      </motion.div>
    </section>
  );
};

export default BenchmarkConstruction;
