"use client";
import { useState } from 'react';
import { Ability, TaskType } from '@/lib/types';
import { DataLoader } from '@/app/components/DataLoader';
import Header from '@/app/components/layout/Header';
import Background from '@/app/components/layout/Background';
import Hero from '@/app/components/sections/Hero';
import About from '@/app/components/sections/About';
import Leaderboard from '@/app/components/sections/Leaderboard';

// Define task abilities - mapping each task type to its associated capabilities
const taskAbilities: Record<TaskType, Ability> = {
  'overall': {
    dataset: ['HackerRank', 'GeeksForGeeks', 'PolyHumanEval', 'CodeTransOcean', 'GitHub', 'PrimeVul', 'PrimeVulPairs'],
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
    dataset: ['HackerRank', 'PolyHumanEval', 'CodeTransOcean'],
    robustness: [],
    privacy: [],
  },
  'code summarization': {
    modality: ['Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go'],
    knowledge: ['Docstring'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['GitHub'],
    robustness: [],
    privacy: [],
    llmJudges: ['gpt-4o-2024-11-20'],
  },
  'code review': {
    modality: ['Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go'],
    knowledge: ['Code Review'],
    reasoning: ['Direct', 'CoT Reasoning'],
    dataset: ['GitHub'],
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

  // Add height padding for the fixed header
  const headerPadding = "h-16";

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#09101f] text-white' : 'bg-slate-50 text-black'}`}>
      {/* Background */}
      <Background isDarkMode={isDarkMode} />

      {/* Header */}
      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      {/* Add padding for fixed header */}
      <div className={headerPadding}></div>

      {/* Hero Section */}
      <Hero isDarkMode={isDarkMode} />

      {/* About Section */}
      <About isDarkMode={isDarkMode} />

      {/* Leaderboard Section */}
      <Leaderboard taskAbilities={taskAbilities} isDarkMode={isDarkMode} />

      {/* Preload data in the background */}
      <DataLoader />
    </div>
  );
}