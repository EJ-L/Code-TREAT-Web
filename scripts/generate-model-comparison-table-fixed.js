#!/usr/bin/env node

/**
 * Script to generate a comparison table of model performance across different tasks
 * similar to the one shown in the paper.
 * 
 * Usage:
 *   node generate-model-comparison-table-fixed.js [options]
 * 
 * Options:
 *   --data-dir <path>     Path to the precomputed data directory (default: ../data/precomputed)
 *   --output <path>       Path to save the output as CSV (optional)
 *   --top-n <number>      Number of top models to highlight (default: 3)
 *   --filter <regex>      Filter models by name (optional)
 *   --tasks <task1,task2> Comma-separated list of tasks to include (optional)
 *   --no-color            Disable colored output
 *   --help                Show this help message
 * 
 * This script loads data from the precomputed results and generates a table showing
 * the performance of each model across different tasks, with average rank calculation.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { table } = require('table');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dataDir: path.join(__dirname, '../data/precomputed'),
  output: null,
  topN: 3,
  filter: null,
  tasks: null,
  color: true
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help') {
    console.log(`
Usage: node generate-model-comparison-table-fixed.js [options]

Options:
  --data-dir <path>     Path to the precomputed data directory (default: ../data/precomputed)
  --output <path>       Path to save the output as CSV (optional)
  --top-n <number>      Number of top models to highlight (default: 3)
  --filter <regex>      Filter models by name (optional)
  --tasks <task1,task2> Comma-separated list of tasks to include (optional)
  --no-color            Disable colored output
  --help                Show this help message
`);
    process.exit(0);
  } else if (arg === '--data-dir' && i + 1 < args.length) {
    options.dataDir = args[++i];
  } else if (arg === '--output' && i + 1 < args.length) {
    options.output = args[++i];
  } else if (arg === '--top-n' && i + 1 < args.length) {
    options.topN = parseInt(args[++i], 10);
    if (isNaN(options.topN)) options.topN = 3;
  } else if (arg === '--filter' && i + 1 < args.length) {
    options.filter = new RegExp(args[++i], 'i');
  } else if (arg === '--tasks' && i + 1 < args.length) {
    options.tasks = args[++i].split(',').map(t => t.trim());
  } else if (arg === '--no-color') {
    options.color = false;
  }
}

// Task abbreviations used in the table
const TASK_ABBR = {
  'code generation': 'CG',
  'code summarization': 'CS',
  'code translation': 'CT',
  'code review': 'CRv', // Code Review
  'input prediction': 'CR', // Code Reasoning (Input)
  'output prediction': 'CR', // Code Reasoning (Output)
  'code-robustness': 'CR', // Also use CR for code-robustness for consistency
  'unit test generation': 'TG',
  'vulnerability detection': 'VD'
};

// Define which metric to use for each task
const TASK_PRIMARY_METRICS = {
  'code generation': 'pass@1',
  'code summarization': 'LLM Judge',
  'code translation': 'pass@1',
  'code review': 'LLM Judge',
  'code-robustness': 'ALL',
  'input prediction': 'pass@1',
  'output prediction': 'pass@1',
  'unit test generation': 'line_coverage',
  'vulnerability detection': 'Accuracy'
};

// Path to precomputed data is now set via command-line options

// Function to load task data
function loadTaskData(task, dataDir) {
  const taskFileName = task.replace(/\s+/g, '-');
  const filePath = path.join(dataDir, `${taskFileName}_consolidated.json`);
  
  try {
    if (fs.existsSync(filePath)) {
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return fileData;
    } else {
      console.warn(`Warning: File not found: ${filePath}`);
      return { data: {} };
    }
  } catch (error) {
    console.error(`Error loading data for task ${task}:`, error);
    return { data: {} };
  }
}

// Function to extract the primary metric score for a model on a task
function extractModelScore(taskData, modelName, metric) {
  if (!taskData.data[modelName] || !taskData.data[modelName].overall) {
    return null;
  }
  
  const score = taskData.data[modelName].overall[metric];
  if (score === undefined || score === null || score === '-') {
    return null;
  }
  
  // Convert to number and ensure it's in the 0-100 range
  const numScore = parseFloat(score);
  return isNaN(numScore) ? null : numScore;
}

// Function to calculate ranks for a specific task
function calculateRanks(taskData, metric) {
  const scores = [];
  
  // Extract scores for all models
  for (const modelName in taskData.data) {
    const score = extractModelScore(taskData, modelName, metric);
    if (score !== null) {
      scores.push({ model: modelName, score });
    }
  }
  
  // Sort by score (descending)
  scores.sort((a, b) => b.score - a.score);
  
  // Assign ranks
  const ranks = {};
  scores.forEach((item, index) => {
    ranks[item.model] = index + 1;
  });
  
  return ranks;
}

// Function to get top N models for a task
function getTopModels(taskData, metric, n = 3) {
  const scores = [];
  
  // Extract scores for all models
  for (const modelName in taskData.data) {
    const score = extractModelScore(taskData, modelName, metric);
    if (score !== null) {
      scores.push({ model: modelName, score });
    }
  }
  
  // Sort by score (descending) and return top N
  return scores.sort((a, b) => b.score - a.score).slice(0, n);
}

// Function to calculate combined Code Reasoning ranks
function calculateCombinedCodeReasoningRanks(taskDataMap) {
  const inputPredictionData = taskDataMap['input prediction'];
  const outputPredictionData = taskDataMap['output prediction'];
  
  // Get all models that have scores in either input or output prediction
  const allModels = new Set();
  if (inputPredictionData && inputPredictionData.data) {
    Object.keys(inputPredictionData.data).forEach(model => allModels.add(model));
  }
  if (outputPredictionData && outputPredictionData.data) {
    Object.keys(outputPredictionData.data).forEach(model => allModels.add(model));
  }
  
  // Calculate combined scores for Code Reasoning
  const combinedScores = [];
  allModels.forEach(model => {
    const inputScore = extractModelScore(inputPredictionData, model, 'pass@1');
    const outputScore = extractModelScore(outputPredictionData, model, 'pass@1');
    
    const validScores = [];
    if (inputScore !== null) validScores.push(inputScore);
    if (outputScore !== null) validScores.push(outputScore);
    
    if (validScores.length > 0) {
      const avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;
      combinedScores.push({ model, score: avgScore });
    }
  });
  
  // Sort by combined score (descending) and assign ranks
  combinedScores.sort((a, b) => b.score - a.score);
  
  const combinedRanks = {};
  combinedScores.forEach((item, index) => {
    combinedRanks[item.model] = index + 1;
  });
  
  return combinedRanks;
}

// Main function to generate the comparison table
function generateComparisonTable(opts = options) {
  // Define the tasks to include
  const tasks = opts.tasks || [
    'code generation',
    'code summarization',
    'code translation',
    'code review',
    'input prediction',
    'output prediction',
    'unit test generation',
    'vulnerability detection'
  ];
  
  // Load data for each task
  const taskDataMap = {};
  tasks.forEach(task => {
    taskDataMap[task] = loadTaskData(task, opts.dataDir);
  });
  
  // Collect all unique model names across all tasks
  const allModels = new Set();
  tasks.forEach(task => {
    const taskData = taskDataMap[task];
    Object.keys(taskData.data || {}).forEach(model => {
      // Apply model name filter if provided
      if (!opts.filter || opts.filter.test(model)) {
        allModels.add(model);
      }
    });
  });
  
  // Calculate ranks for each individual task
  const taskRanks = {};
  tasks.forEach(task => {
    const metric = TASK_PRIMARY_METRICS[task];
    taskRanks[task] = calculateRanks(taskDataMap[task], metric);
  });
  
  // Calculate combined Code Reasoning ranks
  const codeReasoningRanks = calculateCombinedCodeReasoningRanks(taskDataMap);
  
  // Get top N models for each task for highlighting
  const topModels = {};
  tasks.forEach(task => {
    const metric = TASK_PRIMARY_METRICS[task];
    topModels[task] = getTopModels(taskDataMap[task], metric, opts.topN);
  });
  
  // Group tasks by their abbreviation
  const taskGroups = {};
  tasks.forEach(task => {
    const abbr = TASK_ABBR[task] || task;
    if (!taskGroups[abbr]) {
      taskGroups[abbr] = [];
    }
    taskGroups[abbr].push(task);
  });
  
  // Create a list of unique abbreviations in the same order as tasks
  const uniqueAbbrs = [];
  const seenAbbrs = new Set();
  tasks.forEach(task => {
    const abbr = TASK_ABBR[task] || task;
    if (!seenAbbrs.has(abbr)) {
      uniqueAbbrs.push(abbr);
      seenAbbrs.add(abbr);
    }
  });
  
  // Define task groups for average ranking calculation (grouped by abbreviation)
  const rankingTaskGroups = [
    'code generation',
    'code summarization', 
    'code translation',
    'code review',
    'code-reasoning', // Combined input/output prediction
    'unit test generation',
    'vulnerability detection'
  ];
  
  // Prepare data for the table
  const tableData = [];
  
  // Header row
  const header = ['Model Name'];
  uniqueAbbrs.forEach(abbr => {
    header.push(abbr);
  });
  header.push('Avg. Rank');
  tableData.push(header);
  
  // Model data rows
  const modelData = [];
  allModels.forEach(model => {
    const row = { model, scores: {}, ranks: {}, taskCount: 0, totalRank: 0 };
    
    // Get scores and ranks for each task (for display purposes)
    tasks.forEach(task => {
      const metric = TASK_PRIMARY_METRICS[task];
      const score = extractModelScore(taskDataMap[task], model, metric);
      if (score !== null) {
        row.scores[task] = score;
        row.ranks[task] = taskRanks[task][model] || null;
      } else {
        row.scores[task] = null;
        row.ranks[task] = null;
      }
    });
    
    // Calculate average rank using grouped tasks
    rankingTaskGroups.forEach(taskGroup => {
      let rankToAdd = null;
      
      if (taskGroup === 'code-reasoning') {
        // Use combined Code Reasoning rank
        rankToAdd = codeReasoningRanks[model] || null;
      } else {
        // Use individual task rank
        rankToAdd = taskRanks[taskGroup] ? taskRanks[taskGroup][model] : null;
      }
      
      if (rankToAdd !== null) {
        row.taskCount++;
        row.totalRank += rankToAdd;
      }
    });
    
    // Calculate average rank
    row.avgRank = row.taskCount > 0 ? row.totalRank / row.taskCount : null;
    
    modelData.push(row);
  });
  
  // Sort by average rank
  modelData.sort((a, b) => {
    if (a.avgRank === null) return 1;
    if (b.avgRank === null) return -1;
    return a.avgRank - b.avgRank;
  });
  
  // Add model data to table
  modelData.forEach((row) => {
    const tableRow = [row.model];
    
    // For each unique abbreviation, calculate the combined score
    uniqueAbbrs.forEach(abbr => {
      const tasksForAbbr = taskGroups[abbr] || [];
      
      if (tasksForAbbr.length === 0) {
        tableRow.push('-');
        return;
      }
      
      // Collect scores for all tasks with this abbreviation
      const scores = [];
      let topModelIndex = -1;
      
      tasksForAbbr.forEach(task => {
        const score = row.scores[task];
        if (score !== null) {
          scores.push(score);
          
          // Check if this model is in the top N for this task
          const taskTopIndex = topModels[task].findIndex(m => m.model === row.model);
          if (taskTopIndex >= 0 && taskTopIndex < opts.topN && taskTopIndex < topModelIndex || topModelIndex === -1) {
            topModelIndex = taskTopIndex;
          }
        }
      });
      
      // Calculate average score for this abbreviation
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const formattedScore = avgScore.toFixed(1);
        
        // Apply highlighting based on top model index
        if (opts.color && topModelIndex >= 0 && topModelIndex < opts.topN) {
          if (topModelIndex === 0) {
            tableRow.push(`\x1b[32m${formattedScore}\x1b[0m`); // Green for 1st
          } else if (topModelIndex === 1) {
            tableRow.push(`\x1b[33m${formattedScore}\x1b[0m`); // Orange/Yellow for 2nd
          } else if (topModelIndex === 2) {
            tableRow.push(`\x1b[34m${formattedScore}\x1b[0m`); // Blue for 3rd
          } else {
            tableRow.push(`\x1b[36m${formattedScore}\x1b[0m`); // Cyan for 4th and beyond
          }
        } else {
          tableRow.push(formattedScore);
        }
      } else {
        tableRow.push('-');
      }
    });
    
    // Add average rank
    tableRow.push(row.avgRank !== null ? row.avgRank.toFixed(1) : '-');
    
    tableData.push(tableRow);
  });
  
  // Generate and print the table
  const tableConfig = {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼'
    },
    columns: {
      0: { width: 20 }, // Model name column width
    }
  };
  
  // Print the table to console
  console.log('\nTable: Overall model performance (%) on general coding tasks.');
  console.log(`The top ${opts.topN} results on each task are highlighted in green (1st), yellow (2nd), and blue (3rd).\n`);
  console.log(table(tableData, tableConfig));
  
  // Save as CSV if output path is provided
  if (opts.output) {
    try {
      const csvRows = [];
      
      // Add header row
      csvRows.push(header.join(','));
      
      // Add data rows (without color codes)
      modelData.forEach((row) => {
        const csvRow = [row.model];
        
        // For each unique abbreviation, calculate the combined score
        uniqueAbbrs.forEach(abbr => {
          const tasksForAbbr = taskGroups[abbr] || [];
          
          if (tasksForAbbr.length === 0) {
            csvRow.push('-');
            return;
          }
          
          // Collect scores for all tasks with this abbreviation
          const scores = [];
          
          tasksForAbbr.forEach(task => {
            const score = row.scores[task];
            if (score !== null) {
              scores.push(score);
            }
          });
          
          // Calculate average score for this abbreviation
          if (scores.length > 0) {
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            csvRow.push(avgScore.toFixed(1));
          } else {
            csvRow.push('-');
          }
        });
        
        csvRow.push(row.avgRank !== null ? row.avgRank.toFixed(1) : '-');
        csvRows.push(csvRow.join(','));
      });
      
      // Write to file
      fs.writeFileSync(opts.output, csvRows.join('\n'), 'utf8');
      console.log(`\nCSV output saved to: ${opts.output}`);
    } catch (error) {
      console.error(`Error saving CSV output:`, error);
    }
  }
  
  // Return the data for potential further use
  return { tableData, modelData, tasks, uniqueAbbrs };
}

// Execute the main function if this script is run directly
if (require.main === module) {
  generateComparisonTable(options);
}

// Export for potential use as a module
module.exports = {
  generateComparisonTable,
  loadTaskData,
  extractModelScore,
  calculateRanks,
  getTopModels
};
