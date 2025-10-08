import { FC } from 'react';
import { motion } from 'framer-motion';
import { Code, Eye, Shield } from 'lucide-react';

interface BenchmarkConstructionOverviewProps {
  isDarkMode: boolean;
}

const BenchmarkConstructionOverview: FC<BenchmarkConstructionOverviewProps> = ({ isDarkMode }) => {
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

        {/* Task Categories - Evaluation Tasks Overview */}
        <motion.div
          className="space-y-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >          
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
                <h4 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {category.title}
                </h4>
              </div>
              
              <div className={`grid gap-6 ${category.tasks.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                {category.tasks.map((task, taskIndex) => (
                  <motion.div
                    key={taskIndex}
                    className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (categoryIndex * 0.2) + (taskIndex * 0.05) }}
                  >
                    <h5 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      {task.name}
                    </h5>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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

export default BenchmarkConstructionOverview;
