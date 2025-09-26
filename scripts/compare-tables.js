#!/usr/bin/env node

/**
 * Script to compare the generated model comparison table with the ground truth table from the paper.
 * 
 * Usage:
 *   node compare-tables.js <generated_csv> <ground_truth_csv>
 * 
 * Example:
 *   node compare-tables.js model-comparison-corrected.csv model-comparison-gt.csv
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node compare-tables.js <generated_csv> <ground_truth_csv>');
  process.exit(1);
}

const generatedFilePath = args[0];
const groundTruthFilePath = args[1];

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
const generated = parseCSV(generatedFilePath);
const groundTruth = parseCSV(groundTruthFilePath);

// Create a map of ground truth data by model name for easy lookup
const gtModelMap = new Map();
groundTruth.data.forEach(row => {
  gtModelMap.set(row['Model Name'], row);
});

// Create a map of generated data by model name for easy lookup
const genModelMap = new Map();
generated.data.forEach(row => {
  genModelMap.set(row['Model Name'], row);
});

// Compare the tables
console.log('\n=== COMPARISON BETWEEN GENERATED TABLE AND GROUND TRUTH ===\n');

// 1. Check for models in GT but not in generated
const missingModels = [];
gtModelMap.forEach((value, key) => {
  if (!genModelMap.has(key)) {
    missingModels.push(key);
  }
});

if (missingModels.length > 0) {
  console.log('Models in ground truth but missing in generated table:');
  missingModels.forEach(model => console.log(`  - ${model}`));
  console.log();
} else {
  console.log('All ground truth models are present in the generated table.\n');
}

// 2. Check for models in generated but not in GT
const extraModels = [];
genModelMap.forEach((value, key) => {
  if (!gtModelMap.has(key)) {
    extraModels.push(key);
  }
});

if (extraModels.length > 0) {
  console.log('Models in generated table but not in ground truth:');
  extraModels.forEach(model => console.log(`  - ${model}`));
  console.log();
} else {
  console.log('No extra models in the generated table.\n');
}

// 3. Compare metric values for models present in both tables
console.log('Metric differences for models present in both tables:');
let hasDifferences = false;

// Get all metrics (excluding Model Name and Avg. Rank)
const metrics = groundTruth.headers.filter(h => h !== 'Model Name' && h !== 'Avg. Rank');

gtModelMap.forEach((gtRow, modelName) => {
  if (genModelMap.has(modelName)) {
    const genRow = genModelMap.get(modelName);
    const differences = [];
    
    metrics.forEach(metric => {
      const gtValue = gtRow[metric];
      const genValue = genRow[metric];
      
      // Compare as numbers if possible
      const gtNum = parseFloat(gtValue);
      const genNum = parseFloat(genValue);
      
      if (!isNaN(gtNum) && !isNaN(genNum)) {
        // Both are numbers, compare with tolerance for floating point
        if (Math.abs(gtNum - genNum) > 0.1) {
          differences.push(`${metric}: ${genValue} (gen) vs ${gtValue} (gt)`);
        }
      } else if (gtValue !== genValue && gtValue !== '-' && genValue !== '-') {
        // One or both are not numbers, compare as strings
        differences.push(`${metric}: ${genValue} (gen) vs ${gtValue} (gt)`);
      }
    });
    
    // Compare ranks
    const gtRank = parseInt(gtRow['Avg. Rank'], 10);
    const genRank = parseFloat(genRow['Avg. Rank']);
    
    if (!isNaN(gtRank) && !isNaN(genRank) && Math.abs(gtRank - Math.round(genRank)) > 0) {
      differences.push(`Rank: ${genRow['Avg. Rank']} (gen) vs ${gtRow['Avg. Rank']} (gt)`);
    }
    
    if (differences.length > 0) {
      hasDifferences = true;
      console.log(`\n${modelName}:`);
      differences.forEach(diff => console.log(`  - ${diff}`));
    }
  }
});

if (!hasDifferences) {
  console.log('  No metric differences found for models present in both tables.');
}

// 4. Summary of key differences in ranking
console.log('\n=== RANKING DIFFERENCES SUMMARY ===\n');

// Get models sorted by rank in each table
const gtModelsSorted = [...gtModelMap.entries()]
  .map(([name, row]) => ({ name, rank: parseInt(row['Avg. Rank'], 10) }))
  .filter(item => !isNaN(item.rank))
  .sort((a, b) => a.rank - b.rank);

const genModelsSorted = [...genModelMap.entries()]
  .map(([name, row]) => ({ name, rank: parseFloat(row['Avg. Rank']) }))
  .filter(item => !isNaN(item.rank))
  .sort((a, b) => a.rank - b.rank);

// Print top 10 models in each table
console.log('Top 10 models in ground truth:');
gtModelsSorted.slice(0, 10).forEach(model => {
  console.log(`  ${model.rank}. ${model.name}`);
});

console.log('\nTop 10 models in generated table:');
genModelsSorted.slice(0, 10).forEach(model => {
  console.log(`  ${Math.round(model.rank)}. ${model.name}`);
});

// Find models with big ranking differences
console.log('\nModels with significant ranking differences:');
let hasRankDifferences = false;

gtModelsSorted.forEach(gtModel => {
  const genModelEntry = genModelsSorted.find(m => m.name === gtModel.name);
  if (genModelEntry) {
    const rankDiff = Math.abs(gtModel.rank - Math.round(genModelEntry.rank));
    if (rankDiff >= 3) { // Threshold for "significant" difference
      hasRankDifferences = true;
      console.log(`  - ${gtModel.name}: Rank ${Math.round(genModelEntry.rank)} (gen) vs ${gtModel.rank} (gt), diff: ${rankDiff}`);
    }
  }
});

if (!hasRankDifferences) {
  console.log('  No significant ranking differences found.');
}

// 5. Analyze potential causes for ranking differences
console.log('\n=== POTENTIAL CAUSES FOR RANKING DIFFERENCES ===\n');

// Check for metric value patterns that might explain ranking differences
const metricDifferences = {};
metrics.forEach(metric => {
  metricDifferences[metric] = {
    count: 0,
    avgDiff: 0,
    models: []
  };
});

gtModelMap.forEach((gtRow, modelName) => {
  if (genModelMap.has(modelName)) {
    const genRow = genModelMap.get(modelName);
    
    metrics.forEach(metric => {
      const gtValue = parseFloat(gtRow[metric]);
      const genValue = parseFloat(genRow[metric]);
      
      if (!isNaN(gtValue) && !isNaN(genValue)) {
        const diff = Math.abs(gtValue - genValue);
        if (diff > 0.1) {
          metricDifferences[metric].count++;
          metricDifferences[metric].avgDiff += diff;
          metricDifferences[metric].models.push(modelName);
        }
      }
    });
  }
});

// Calculate average differences and sort metrics by count
Object.keys(metricDifferences).forEach(metric => {
  if (metricDifferences[metric].count > 0) {
    metricDifferences[metric].avgDiff /= metricDifferences[metric].count;
  }
});

const sortedMetricDiffs = Object.entries(metricDifferences)
  .sort((a, b) => b[1].count - a[1].count);

// Report metrics with most differences
console.log('Metrics with most differences (potential causes):');
sortedMetricDiffs.forEach(([metric, stats]) => {
  if (stats.count > 0) {
    console.log(`  - ${metric}: ${stats.count} differences, avg diff: ${stats.avgDiff.toFixed(2)}`);
    if (stats.count <= 5) { // Only show models for metrics with few differences
      console.log(`    Affected models: ${stats.models.join(', ')}`);
    }
  }
});

// 6. Conclusion
console.log('\n=== CONCLUSION ===\n');
console.log('Based on the analysis, here are the main differences between the generated table and the ground truth:');

// Identify the main differences based on the analysis
const mainDifferences = [];

if (missingModels.length > 0) {
  mainDifferences.push(`- Missing models: ${missingModels.length} models from the ground truth are not in the generated table.`);
}

if (extraModels.length > 0) {
  mainDifferences.push(`- Extra models: ${extraModels.length} models in the generated table are not in the ground truth.`);
}

// Find metrics with most differences
const problematicMetrics = sortedMetricDiffs
  .filter(([_, stats]) => stats.count > 0)
  .slice(0, 3)
  .map(([metric, stats]) => `${metric} (${stats.count} differences)`);

if (problematicMetrics.length > 0) {
  mainDifferences.push(`- Most problematic metrics: ${problematicMetrics.join(', ')}`);
}

// Check if ranking is significantly different
const topRankingDifference = gtModelsSorted.slice(0, 5).some(gtModel => {
  const genModelEntry = genModelsSorted.find(m => m.name === gtModel.name);
  return genModelEntry && Math.abs(gtModel.rank - Math.round(genModelEntry.rank)) >= 2;
});

if (topRankingDifference) {
  mainDifferences.push('- Significant differences in top 5 model rankings.');
}

if (mainDifferences.length === 0) {
  console.log('No major differences found. The generated table closely matches the ground truth.');
} else {
  mainDifferences.forEach(diff => console.log(diff));
}

console.log('\nRecommendations:');
console.log('1. Check the calculation of the CR (Code Reasoning) metric, as it appears to have the most differences.');
console.log('2. Verify that the correct metrics are being used for each task type.');
console.log('3. Ensure the ranking calculation matches the method used in the paper.');
