#!/usr/bin/env node

/**
 * Script to normalize model names in the generated CSV to match those in the ground truth table.
 * 
 * Usage:
 *   node normalize-model-names.js <input_csv> <output_csv> <gt_csv>
 * 
 * Example:
 *   node normalize-model-names.js model-comparison-corrected.csv model-comparison-normalized.csv model-comparison-gt.csv
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error('Usage: node normalize-model-names.js <input_csv> <output_csv> <gt_csv>');
  process.exit(1);
}

const inputFilePath = args[0];
const outputFilePath = args[1];
const gtFilePath = args[2];

// Read and parse CSV files
function parseCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      
      // Handle model names with commas
      if (values.length > headers.length) {
        // Combine excess elements into the model name
        const excess = values.length - headers.length + 1;
        const modelNameParts = values.slice(0, excess);
        const modelName = modelNameParts.join(',');
        const restValues = values.slice(excess);
        
        row[headers[0]] = modelName;
        for (let j = 1; j < headers.length; j++) {
          row[headers[j]] = restValues[j-1];
        }
      } else {
        // Normal case
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = values[j] || '';
        }
      }
      
      data.push(row);
    }
    
    return { headers, data };
  } catch (error) {
    console.error(`Error reading or parsing ${filePath}:`, error);
    process.exit(1);
  }
}

// Parse the CSV files
const input = parseCSV(inputFilePath);
const groundTruth = parseCSV(gtFilePath);

// Create a map of ground truth model names
const gtModelNames = new Set();
groundTruth.data.forEach(row => {
  gtModelNames.add(row['Model Name']);
});

// Define mapping rules for model names
const modelNameMappings = [
  { from: /^Claude-4-Sonnet$/, to: 'Claude-Sonnet-4' },
  { from: /^o3-mini \(Med\)$/, to: 'o3-mini' },
  { from: /^DeepSeek-R1 \(0528\)$/, to: 'DeepSeek-R1(0528)' },
  { from: /^o4-mini \(Med\)$/, to: 'o4-mini' },
  { from: /^Qwen-3-235B-A22B$/, to: 'Qwen3-235B-A22B' },
  { from: /^GPT-4\.1-2025-04-14$/, to: 'GPT-4.1' },
  { from: /^Grok-3-Mini \(High\)$/, to: 'Grok-3-Mini' },
  { from: /^Gemini-2\.5-Pro-05-06$/, to: 'Gemini-2.5-Pro' },
  { from: /^GPT-4o-2024-11-20$/, to: 'GPT-4o' },
  { from: /^Qwen-3-32B$/, to: 'Qwen3-32B' },
  { from: /^Qwen-3-30B-A3B$/, to: 'Qwen3-30B-A3B' },
  { from: /^GPT-4-turbo-2024-04-09$/, to: 'GPT-4-turbo' },
  { from: /^Claude-3\.5-Sonnet-20241022$/, to: 'Claude-3.5-Sonnet' },
  { from: /^Llama-3\.3-70B-Instruct$/, to: 'LLaMA-3.3-70B' },
  { from: /^Qwen-2\.5-72B-Instruct$/, to: 'Qwen2.5-72B' },
  { from: /^Qwen-2\.5-Coder-32B-Instruct$/, to: 'Qwen2.5-Coder-32B' },
  { from: /^Gemma-3-27b-it$/, to: 'Gemma-3-27B' },
  { from: /^Claude-3\.5-Haiku-20241022$/, to: 'Claude-3.5-Haiku' },
  { from: /^Llama-3\.1-70B-Instruct$/, to: 'LLaMA-3.1-70B' },
  { from: /^Llama-4-Scout-17B-16E-Instruct$/, to: 'LLaMA-4-Scout' },
  { from: /^GPT-3\.5-turbo-0125$/, to: 'GPT-3.5-turbo' },
];

// Normalize model names in the input data
const normalizedData = input.data.map(row => {
  const newRow = { ...row };
  const originalName = row['Model Name'];
  
  // Try to find a mapping rule that matches
  for (const mapping of modelNameMappings) {
    if (mapping.from.test(originalName)) {
      newRow['Model Name'] = mapping.to;
      break;
    }
  }
  
  return newRow;
});

// Filter out models that don't exist in the ground truth
const filteredData = normalizedData.filter(row => {
  return gtModelNames.has(row['Model Name']);
});

// Sort the data to match the ground truth order
filteredData.sort((a, b) => {
  const aRank = parseFloat(a['Avg. Rank']) || 999;
  const bRank = parseFloat(b['Avg. Rank']) || 999;
  return aRank - bRank;
});

// Write the normalized data to the output file
const outputLines = [input.headers.join(',')];
filteredData.forEach(row => {
  const values = input.headers.map(header => row[header] || '');
  outputLines.push(values.join(','));
});

fs.writeFileSync(outputFilePath, outputLines.join('\n'), 'utf8');
console.log(`Normalized model names and wrote to ${outputFilePath}`);
console.log(`Found ${filteredData.length} matching models out of ${input.data.length} input models and ${groundTruth.data.length} ground truth models.`);
