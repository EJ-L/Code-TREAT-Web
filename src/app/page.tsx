"use client";
import { useState } from 'react';
import { Ability, TaskType } from '@/lib/types';
import { DataLoader } from '@/app/components/DataLoader';
import Background from '@/app/components/layout/Background';
import Sidebar from '@/app/components/layout/Sidebar';
import OverviewPage from '@/app/components/pages/OverviewPage';
import TasksPage from '@/app/components/pages/TasksPage';
import AboutPage from '@/app/components/pages/AboutPage';

// Define task abilities - mapping each task type to its associated capabilities
const taskAbilities: Record<TaskType, Ability> = {
  'overall': {
    dataset: ['HackerRank', 'GeeksForGeeks', 'PolyHumanEval', 'github_2023', 'PrimeVul', 'PrimeVulPairs'],
    modality: ['Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning', 'Inductive'],
    robustness: ['Code Structure', 'Code Convention'],
    privacy: ['Privacy', 'Vulnerability', 'Bias', 'Authorship'],
    llmJudges: [], // Will be populated at runtime
  },
  'code generation': {
    dataset: ['HackerRank', 'GeeksForGeeks'],
    modality: ['Python', 'Java'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning'],
    robustness: [],
    privacy: [],
  },
  'code translation': {
    modality: ['Python', 'Java'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['HackerRank', 'PolyHumanEval'],
    robustness: [],
    privacy: [],
  },
  'code summarization': {
    modality: ['Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go'],
    knowledge: ['Docstring'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['github_2023'],
    robustness: [],
    privacy: [],
    llmJudges: ['gpt-4o-2024-11-20'],
  },
  'code review': {
    modality: ['Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go'],
    knowledge: ['Code Review'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['github_2023'],
    robustness: [],
    privacy: [],
    llmJudges: ['gpt-4o-2024-11-20'],
  },
  'input prediction': {
    modality: ['Python', 'Java'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['HackerRank', 'GeeksForGeeks'],
    robustness: [],
    privacy: [],
  },
  'output prediction': {
    modality: ['Python', 'Java'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['HackerRank', 'GeeksForGeeks'],
    robustness: [],
    privacy: [],
  },
  'vulnerability detection': {
    modality: [],
    knowledge: [],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['PrimeVul', 'PrimeVulPairs'],
    robustness: [],
    privacy: [],
  },
  'code-web': {
    modality: [],
    knowledge: [],
    reasoning: [],
    dataset: ['Design Generation', 'Design Edit', 'Design Repair'],
    robustness: [],
    privacy: [],
    framework: ['React', 'Vue', 'Angular', 'Vanilla'],
  },
  'mr-web': {
    modality: [],
    knowledge: ['Visual', 'RER'],
    reasoning: ['CoT', 'ZS', 'SR'],
    dataset: ['MR-Web'],
    robustness: [],
    privacy: [],
  },
  'interaction-2-code': {
    modality: [],
    knowledge: [],
    reasoning: [],
    dataset: [],
    robustness: [],
    privacy: [],
  },
  'code-robustness': {
    modality: [],
    knowledge: [],
    reasoning: [],
    dataset: ['Merge', 'CRUXEval', 'LiveCodeBench (CE)'],
    robustness: [],
    privacy: [],
  },
};

export default function Home() {
  // Main app state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentSection, setCurrentSection] = useState<'overview' | 'tasks' | 'about'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskType>('overall');

  const handleSectionChange = (section: 'overview' | 'tasks' | 'about') => {
    setCurrentSection(section);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTaskChange = (task: TaskType) => {
    setCurrentTask(task);
  };

  const renderCurrentPage = () => {
    switch (currentSection) {
      case 'overview':
        return <OverviewPage isDarkMode={isDarkMode} />;
      case 'tasks':
        return <TasksPage taskAbilities={taskAbilities} isDarkMode={isDarkMode} currentTask={currentTask} />;
      case 'about':
        return <AboutPage isDarkMode={isDarkMode} />;
      default:
        return <OverviewPage isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#09101f] text-white' : 'bg-slate-50 text-black'}`}>
      {/* Background */}
      <Background isDarkMode={isDarkMode} />

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
          isOpen={isSidebarOpen}
          onToggle={handleSidebarToggle}
          taskAbilities={taskAbilities}
          currentTask={currentTask}
          onTaskChange={handleTaskChange}
        />

        {/* Main Content */}
        <div className="flex-1 xl:ml-80 min-h-screen w-full xl:w-auto">
          {renderCurrentPage()}
        </div>
      </div>

      {/* Preload data in the background */}
      <DataLoader />
    </div>
  );
}