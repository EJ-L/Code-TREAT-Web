import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define task abilities - same as in page.tsx
const taskAbilities = {
  'overall': {
    dataset: ['HackerRank', 'GeeksForGeeks', 'PolyHumanEval', 'github_2023', 'PrimeVul', 'PrimeVulPairs'],
    modality: ['Python', 'Java', 'C', 'CPP', 'C#', 'Ruby', 'JavaScript', 'TypeScript', 'PHP', 'Go'],
    knowledge: ['Algorithms', 'Data Structures', 'Math'],
    reasoning: ['Direct', 'CoT Reasoning', 'Inductive'],
    robustness: ['Code Structure', 'Code Convention'],
    privacy: ['Privacy', 'Vulnerability', 'Bias', 'Authorship'],
    llmJudges: [],
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
    reasoning: [],
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
    dataset: ['Merge-CruxEval+CE', 'CRUXEval', 'LiveCodeBench (CE)', 'HackerRank', 'GeeksforGeeks', 'Merge-HR+GFG'],
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
};

// Tasks that support difficulty-based results
const tasksWithDifficulty = ['code generation', 'code translation', 'input prediction', 'output prediction'];

// Generate all possible combinations for a given array
// function generateCombinations(arr) {
//   const combinations = [];
//   
//   // Always include the "all selected" option (empty array means all)
//   combinations.push([]);
//   
//   // Generate all non-empty subsets
//   for (let i = 1; i < (1 << arr.length); i++) {
//     const combination = [];
//     for (let j = 0; j < arr.length; j++) {
//       if (i & (1 << j)) {
//         combination.push(arr[j]);
//       }
//     }
//     combinations.push(combination);
//   }
//   
//   return combinations;
// }

// Generate filename for a specific filter combination
function generateFilename(task, filters, showByDifficulty = false) {
  let filename = task.replace(/\s+/g, '-');
  
  // Add difficulty suffix if enabled
  if (showByDifficulty) {
    filename += '_difficulty';
  }
  
  // Add filter information to filename
  const filterParts = [];
  
  // Add filters in a consistent order
  const filterOrder = ['dataset', 'modality', 'knowledge', 'reasoning', 'robustness', 'privacy', 'llmJudges', 'framework'];
  
  for (const filterType of filterOrder) {
    if (filters[filterType] && filters[filterType].length > 0) {
      filterParts.push(`${filterType}-${filters[filterType].join('-').replace(/\s+/g, '')}`);
    }
  }
  
  // If no filters are applied, add "overall" to the filename
  if (filterParts.length === 0) {
    filterParts.push('overall');
  }
  
  // Combine all parts
  if (filterParts.length > 0) {
    filename += '_' + filterParts.join('_');
  }
  
  return filename + '.json';
}

// Generate all filter combinations for a task
function generateTaskCombinations(task, abilities) {
  const combinations = [];
  
  // Get available filter types for this task (only those with multiple meaningful options)
  const availableFilters = {};
  
  Object.keys(abilities).forEach(filterType => {
    if (abilities[filterType] && abilities[filterType].length > 0) {
      // Special handling for specific tasks
      if (task === 'code summarization' || task === 'code review') {
        // For these tasks, ignore dataset and llmJudges since they typically use the same ones
        if (filterType === 'dataset' || filterType === 'llmJudges') {
          return;
        }
      }
      
      // Only include filter types that have more than one option for meaningful combinations
      if (abilities[filterType].length > 1) {
        availableFilters[filterType] = abilities[filterType];
      }
    }
  });
  
  // If no meaningful filters available, just return the base combination
  if (Object.keys(availableFilters).length === 0) {
    const baseFilters = {};
    combinations.push({
      filters: baseFilters,
      showByDifficulty: false,
      filename: generateFilename(task, baseFilters, false)
    });
    
    // Add difficulty version if supported
    if (tasksWithDifficulty.includes(task)) {
      combinations.push({
        filters: baseFilters,
        showByDifficulty: true,
        filename: generateFilename(task, baseFilters, true)
      });
    }
    
    return combinations;
  }
  
  // Generate cross-combinations between different filter sections
  // Strategy: 
  // 1. Base combination (no filters)
  // 2. Individual filter values
  // 3. Cross-combinations between filter sections
  
  const practicalCombinations = [];
  
  // 1. Base combination (no filters)
  const baseFilters = {};
  Object.keys(availableFilters).forEach(filterType => {
    baseFilters[filterType] = [];
  });
  practicalCombinations.push(baseFilters);
  
  // 2. Generate individual filter value combinations
  const filterTypesArray = Object.keys(availableFilters);
  
  // NOTE: We skip "all values selected" combinations since selecting all = selecting none (no filtering)
  // This is an optimization: if all buttons in a filter section are selected, it's equivalent to no filter
  
  // Add combinations with individual and multiple values for each filter type
  filterTypesArray.forEach(filterType => {
    const values = availableFilters[filterType];
    
    // For filter types with many options (like modality with 10 languages), 
    // only generate practical combinations instead of all 2^n combinations
    if (values.length > 4) {
      // For large filter types, only generate individual values and common pairs
      // Individual values
      values.forEach(value => {
        const combo = { ...baseFilters };
        combo[filterType] = [value];
        practicalCombinations.push(combo);
      });
      
      // Common pairs for programming languages (e.g., Python+Java, Python+JavaScript, etc.)
      if (filterType === 'modality' && values.includes('Python') && values.includes('Java')) {
        const commonPairs = [
          ['Python', 'Java'],
          ['Python', 'JavaScript'],
          ['Java', 'JavaScript'],
          ['Python', 'C'],
          ['Java', 'C']
        ];
        
        commonPairs.forEach(pair => {
          if (pair.every(lang => values.includes(lang))) {
            const combo = { ...baseFilters };
            combo[filterType] = pair;
            practicalCombinations.push(combo);
          }
        });
      }
    } else {
      // For small filter types (≤4 options), generate all combinations except "all values"
      const maxValue = values.length > 2 ? (1 << values.length) - 1 : (1 << values.length);
      
      for (let i = 1; i < maxValue; i++) { // Exclude 0 (empty), and optionally exclude "all values"
        const combination = [];
        for (let j = 0; j < values.length; j++) {
          if (i & (1 << j)) {
            combination.push(values[j]);
          }
        }
        
        const combo = { ...baseFilters };
        combo[filterType] = combination;
        practicalCombinations.push(combo);
      }
    }
  });
  
  // 3. Generate cross-combinations between different filter sections
  // For each combination of filter types, generate combinations of their values
  if (filterTypesArray.length >= 2) {
    // First, collect all the practical value combinations for each filter type
    const filterCombinations = {};
    
    filterTypesArray.forEach(filterType => {
      const values = availableFilters[filterType];
      const combinations = [];
      
      if (values.length > 4) {
        // For large filter types, only use individual values and common pairs
        values.forEach(value => combinations.push([value]));
        
        // Add common pairs for modality
        if (filterType === 'modality' && values.includes('Python') && values.includes('Java')) {
          const commonPairs = [
            ['Python', 'Java'],
            ['Python', 'JavaScript'], 
            ['Java', 'JavaScript'],
            ['Python', 'C'],
            ['Java', 'C']
          ];
          commonPairs.forEach(pair => {
            if (pair.every(lang => values.includes(lang))) {
              combinations.push(pair);
            }
          });
        }
      } else {
        // For small filter types, generate all meaningful combinations
        const maxValue = values.length > 2 ? (1 << values.length) - 1 : (1 << values.length);
        
        for (let i = 1; i < maxValue; i++) {
          const combination = [];
          for (let j = 0; j < values.length; j++) {
            if (i & (1 << j)) {
              combination.push(values[j]);
            }
          }
          combinations.push(combination);
        }
      }
      
      filterCombinations[filterType] = combinations;
    });
    
    // Generate cross-combinations between pairs of filter types
    for (let i = 0; i < filterTypesArray.length; i++) {
      for (let j = i + 1; j < filterTypesArray.length; j++) {
        const filterType1 = filterTypesArray[i];
        const filterType2 = filterTypesArray[j];
        
        // Generate combinations between all value combinations of both filter types
        filterCombinations[filterType1].forEach(combo1 => {
          filterCombinations[filterType2].forEach(combo2 => {
            const crossCombo = { ...baseFilters };
            crossCombo[filterType1] = combo1;
            crossCombo[filterType2] = combo2;
            practicalCombinations.push(crossCombo);
          });
        });
      }
    }
  }
  
  // 4. Additional task-specific combinations
  if (task === 'code generation' || task === 'code translation') {
    // Already covered by the cross-combinations above, but we can add more specific ones if needed
  }
  
  // Remove duplicates based on JSON representation
  const uniqueCombinations = [];
  const seen = new Set();
  
  practicalCombinations.forEach(combo => {
    const key = JSON.stringify(combo);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCombinations.push(combo);
    }
  });
  
  // Generate combinations for both regular and difficulty modes
  uniqueCombinations.forEach(filterCombo => {
    // Regular mode
    combinations.push({
      filters: filterCombo,
      showByDifficulty: false,
      filename: generateFilename(task, filterCombo, false)
    });
    
    // Difficulty mode (if supported)
    if (tasksWithDifficulty.includes(task)) {
      // For code translation with difficulty, only allow HackerRank dataset
      if (task === 'code translation') {
        const difficultyFilters = { ...filterCombo };
        if (difficultyFilters.dataset && difficultyFilters.dataset.length > 0 && 
            !difficultyFilters.dataset.includes('HackerRank')) {
          return; // Skip this combination for difficulty mode
        }
        if (difficultyFilters.dataset && difficultyFilters.dataset.length > 0) {
          difficultyFilters.dataset = ['HackerRank'];
        }
        
        combinations.push({
          filters: difficultyFilters,
          showByDifficulty: true,
          filename: generateFilename(task, difficultyFilters, true)
        });
      } else {
        combinations.push({
          filters: filterCombo,
          showByDifficulty: true,
          filename: generateFilename(task, filterCombo, true)
        });
      }
    }
  });
  
  return combinations;
}

// Main function to generate all combinations
function generateAllCombinations() {
  const allCombinations = {};
  
  // Skip 'overall' task as requested
  Object.keys(taskAbilities).forEach(task => {
    if (task === 'overall') return;
    
    console.log(`Generating combinations for ${task}...`);
    allCombinations[task] = generateTaskCombinations(task, taskAbilities[task]);
    console.log(`  Generated ${allCombinations[task].length} combinations`);
  });
  
  return allCombinations;
}

// Create directories for precomputed results
function createPrecomputedDirectories() {
  const baseDir = path.join(__dirname, '..', 'data', 'precomputed');
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  // Create subdirectories for each task
  Object.keys(taskAbilities).forEach(task => {
    if (task === 'overall') return;
    
    const taskDir = path.join(baseDir, task.replace(/\s+/g, '-'));
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }
  });
  
  return baseDir;
}

// Save combination metadata
function saveCombinationMetadata(combinations, baseDir) {
  const metadata = {
    generated: new Date().toISOString(),
    tasks: {}
  };
  
  Object.keys(combinations).forEach(task => {
    metadata.tasks[task] = {
      totalCombinations: combinations[task].length,
      combinations: combinations[task].map(combo => ({
        filename: combo.filename,
        filters: combo.filters,
        showByDifficulty: combo.showByDifficulty
      }))
    };
  });
  
  fs.writeFileSync(
    path.join(baseDir, 'combinations-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('Saved combination metadata to combinations-metadata.json');
}

// Main execution
async function main() {
  try {
    console.log('Generating all possible filter combinations...');
    
    // Create directories
    const baseDir = createPrecomputedDirectories();
    
    // Generate all combinations
    const allCombinations = generateAllCombinations();
    
    // Save metadata
    saveCombinationMetadata(allCombinations, baseDir);
    
    // Print summary
    console.log('\nSummary:');
    let totalCombinations = 0;
    Object.keys(allCombinations).forEach(task => {
      const count = allCombinations[task].length;
      console.log(`  ${task}: ${count} combinations`);
      totalCombinations += count;
    });
    console.log(`\nTotal combinations across all tasks: ${totalCombinations}`);
    
    console.log('\nNext steps:');
    console.log('1. Review the generated combinations in data/precomputed/combinations-metadata.json');
    console.log('2. Run the data processing script to generate actual precomputed results');
    console.log('3. The filenames follow the pattern: taskname_[difficulty_]filters_YYYY-MM-DD.json');
    
  } catch (error) {
    console.error('Error generating combinations:', error);
    process.exit(1);
  }
}

// Run the main function
main();

export {
  generateAllCombinations,
  generateTaskCombinations,
  generateFilename,
  taskAbilities,
  tasksWithDifficulty
}; 