"use client";
import { useState, useEffect } from 'react';
import { Ability, TaskType } from '@/lib/types';
import { DataLoader } from '@/app/components/DataLoader';
import Background from '@/app/components/layout/Background';
import Sidebar from '@/app/components/layout/Sidebar';

import OverviewPage from '@/app/components/pages/OverviewPage';
import TasksPage from '@/app/components/pages/TasksPage';
import AboutPage from '@/app/components/pages/AboutPage';
import GuidelinePage from '@/app/components/pages/GuidelinePage';

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
    modality: ['python->java', 'java->python', 'python->cpp', 'cpp->python', 'java->cpp', 'cpp->java'],
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
  'unit test generation': {
    modality: ['Python'],
    knowledge: [],
    reasoning: ['Direct'],
    dataset: ['symprompt'],
    robustness: [],
    privacy: [],
  },
  'multi-modality': {
    modality: [],
    knowledge: [],
    reasoning: [],
    dataset: ['UI Code Generation', 'UI Code Edit', 'UI Code Repair'],
    robustness: [],
    privacy: [],
    framework: ['React', 'Vue', 'Angular', 'Vanilla'],
  },
  'code-robustness': {
    modality: [],
    knowledge: [],
    reasoning: [],
    dataset: ['HackerRank', 'GeeksforGeeks'],
    robustness: [],
    privacy: [],
  },
};

export default function Home() {
  // Main app state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentSection, setCurrentSection] = useState<'overview' | 'tasks' | 'about' | 'guide'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskType>('overall');

  // URL synchronization - update hash when section changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sectionToHash = {
        'overview': '#home',
        'tasks': '#evaluation', 
        'about': '#about',
        'guide': '#guide'
      };
      window.location.hash = sectionToHash[currentSection];
    }
  }, [currentSection]);

  // Read URL hash on page load to restore section state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hashToSection = {
        '#home': 'overview' as const,
        '#evaluation': 'tasks' as const,
        '#about': 'about' as const,
        '#guide': 'guide' as const,
        '': 'overview' as const // Default case
      };
      
      const currentHash = window.location.hash || '';
      const sectionFromHash = hashToSection[currentHash as keyof typeof hashToSection];
      
      if (sectionFromHash && sectionFromHash !== currentSection) {
        setCurrentSection(sectionFromHash);
      }

      // Listen for hash changes (back/forward navigation)
      const handleHashChange = () => {
        const newHash = window.location.hash || '';
        const newSection = hashToSection[newHash as keyof typeof hashToSection];
        if (newSection && newSection !== currentSection) {
          setCurrentSection(newSection);
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [currentSection]);

  const handleSectionChange = (section: 'overview' | 'tasks' | 'about' | 'guide') => {
    setCurrentSection(section);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
    
    // Reset currentTask when navigating away from tasks section
    if (section !== 'tasks') {
      setCurrentTask('overall');
    }
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTaskChange = (task: TaskType) => {
    setCurrentTask(task);
  };

  const handleNavigateToTask = (task: string) => {
    setCurrentSection('tasks');
    setCurrentTask(task as TaskType);
    setIsSidebarOpen(false);
  };

  const renderCurrentPage = () => {
    switch (currentSection) {
      case 'overview':
        return <OverviewPage isDarkMode={isDarkMode} onNavigateToTask={handleNavigateToTask} />;
      case 'tasks':
        return <TasksPage taskAbilities={taskAbilities} isDarkMode={isDarkMode} currentTask={currentTask} />;
      case 'about':
        return <AboutPage isDarkMode={isDarkMode} />;
      case 'guide':
        return <GuidelinePage isDarkMode={isDarkMode} onNavigateToTask={handleNavigateToTask} />;
      default:
        return <OverviewPage isDarkMode={isDarkMode} onNavigateToTask={handleNavigateToTask} />;
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
        <div className="flex-1 xl:ml-80 min-h-screen w-full xl:w-auto pt-20 xl:pt-0">
          {renderCurrentPage()}
        </div>
      </div>

      {/* Preload data in the background */}
      <DataLoader />
    </div>
  );
}